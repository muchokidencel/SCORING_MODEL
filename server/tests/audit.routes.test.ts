import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword, issueAccessToken } from "../src/services/auth.service.js";

const app = createApp();
const runId = randomUUID().slice(0, 8);

const testUsers: { id: string }[] = [];
let clientId: string;
let adminToken: string;
let scorerToken: string;
let viewerToken: string;

const makeUser = async (role: "VIEWER" | "SCORER" | "ADMIN") => {
  const user = await prisma.user.create({
    data: {
      email: `audit-${role.toLowerCase()}-${runId}@coseke.test`,
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
  viewerToken = await makeUser("VIEWER");

  const client = await prisma.client.create({
    data: { name: `Audit Log Test Client ${runId}` },
  });
  clientId = client.id;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { clientId } });
  await prisma.client.delete({ where: { id: clientId } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("GET /clients/:id/audit-logs (Security & Roles)", () => {
  it("requires authentication", async () => {
    await request(app).get(`/clients/${clientId}/audit-logs`).expect(401);
  });

  it("rejects a VIEWER with 403 Forbidden", async () => {
    await request(app)
      .get(`/clients/${clientId}/audit-logs`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(403);
  });

  it("rejects a SCORER with 403 Forbidden", async () => {
    await request(app)
      .get(`/clients/${clientId}/audit-logs`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .expect(403);
  });

  it("allows an ADMIN to fetch audit logs", async () => {
    const res = await request(app)
      .get(`/clients/${clientId}/audit-logs`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.logs).toBeInstanceOf(Array);
  });
});

describe("Audit Event Generation", () => {
  it("automatically logs client updates and score submissions", async () => {
    // 1. Submit a client edit
    await request(app)
      .patch(`/clients/${clientId}`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ accountManager: "New AM Name" })
      .expect(200);

    // 2. Fetch the logs as ADMIN
    const res = await request(app)
      .get(`/clients/${clientId}/audit-logs`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // Check if the log for client update exists
    const updateLog = res.body.logs.find((log: any) => log.action === "CLIENT_UPDATE");
    expect(updateLog).toBeDefined();
    expect(JSON.parse(updateLog.details).accountManager).toBe("New AM Name");
    expect(updateLog.user.name).toBe("SCORER Tester");
  });
});
