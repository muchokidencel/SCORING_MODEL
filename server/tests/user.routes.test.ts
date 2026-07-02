import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword, issueAccessToken } from "../src/services/auth.service.js";

const app = createApp();
const runId = randomUUID().slice(0, 8);

const testUsers: { id: string }[] = [];
let adminToken: string;
let adminId: string;
let scorerToken: string;
let viewerToken: string;
let viewerId: string;

const makeUser = async (role: "VIEWER" | "SCORER" | "ADMIN") => {
  const user = await prisma.user.create({
    data: {
      email: `user-routes-${role.toLowerCase()}-${runId}@coseke.test`,
      passwordHash: await hashPassword("secure123"),
      name: `${role} Tester`,
      role,
    },
  });
  testUsers.push({ id: user.id });
  return {
    id: user.id,
    token: await issueAccessToken({ sub: user.id, email: user.email, role: user.role }),
  };
};

beforeAll(async () => {
  const admin = await makeUser("ADMIN");
  adminToken = admin.token;
  adminId = admin.id;

  const scorer = await makeUser("SCORER");
  scorerToken = scorer.token;

  const viewer = await makeUser("VIEWER");
  viewerToken = viewer.token;
  viewerId = viewer.id;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { userId: { in: testUsers.map((u) => u.id) } } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("GET /users (User List Security)", () => {
  it("requires authentication", async () => {
    await request(app).get("/users").expect(401);
  });

  it("rejects a VIEWER with 403 Forbidden", async () => {
    await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(403);
  });

  it("rejects a SCORER with 403 Forbidden", async () => {
    await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${scorerToken}`)
      .expect(403);
  });

  it("allows an ADMIN to list all registered users", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.users).toBeInstanceOf(Array);
    expect(res.body.users.length).toBeGreaterThanOrEqual(3);
    const viewerEntry = res.body.users.find((u: any) => u.id === viewerId);
    expect(viewerEntry).toBeDefined();
    expect(viewerEntry.passwordHash).toBeUndefined(); // Verify hash is excluded
  });
});

describe("PATCH /users/:id/role (Role updates & Audit)", () => {
  it("rejects a SCORER trying to update user roles", async () => {
    await request(app)
      .patch(`/users/${viewerId}/role`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ role: "SCORER" })
      .expect(403);
  });

  it("lets an ADMIN promote a VIEWER to a SCORER and logs it", async () => {
    const res = await request(app)
      .patch(`/users/${viewerId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "SCORER" })
      .expect(200);

    expect(res.body.user.role).toBe("SCORER");

    // Check DB
    const userInDb = await prisma.user.findUnique({ where: { id: viewerId } });
    expect(userInDb?.role).toBe("SCORER");

    // Check Audit Log
    const logs = await prisma.auditLog.findMany({
      where: { userId: adminId, action: "USER_ROLE_UPDATE" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const details = JSON.parse(logs[0].details);
    expect(details.targetUserId).toBe(viewerId);
    expect(details.newRole).toBe("SCORER");
  });
});
