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
let scorerToken: string;

const makeUser = async (role: "SCORER" | "ADMIN") => {
  const user = await prisma.user.create({
    data: {
      email: `monitoring-${role.toLowerCase()}-${runId}@coseke.test`,
      passwordHash: await hashPassword("secure123"),
      name: `${role} Tester`,
      role,
    },
  });
  testUsers.push({ id: user.id });
  return issueAccessToken({ sub: user.id, email: user.email, role: user.role });
};

beforeAll(async () => {
  adminToken = await makeUser("ADMIN");
  scorerToken = await makeUser("SCORER");
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("GET /admin/system-health (Security & Details)", () => {
  it("requires authentication", async () => {
    await request(app).get("/admin/system-health").expect(401);
  });

  it("rejects a SCORER with 403 Forbidden", async () => {
    await request(app)
      .get("/admin/system-health")
      .set("Authorization", `Bearer ${scorerToken}`)
      .expect(403);
  });

  it("allows an ADMIN to check system health details", async () => {
    const res = await request(app)
      .get("/admin/system-health")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.status).toBeDefined();
    expect(res.body.uptimeSeconds).toBeGreaterThan(0);
    expect(res.body.database.status).toBe("HEALTHY");
    expect(res.body.process.memory).toBeDefined();
  });
});
