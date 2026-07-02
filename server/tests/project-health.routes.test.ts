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

let viewerToken: string;
let scorerToken: string;

const makeUser = async (role: "VIEWER" | "SCORER" | "ADMIN") => {
  const user = await prisma.user.create({
    data: {
      email: `health-${role.toLowerCase()}-${runId}@coseke.test`,
      passwordHash: await hashPassword("irrelevant-for-these-tests"),
      name: `${role} Tester`,
      role,
    },
  });
  testUsers.push({ id: user.id });
  return issueAccessToken({ sub: user.id, email: user.email, role: user.role });
};

beforeAll(async () => {
  viewerToken = await makeUser("VIEWER");
  scorerToken = await makeUser("SCORER");
  const client = await prisma.client.create({ data: { name: `Health Test Client ${runId}` } });
  clientId = client.id;
});

afterAll(async () => {
  await prisma.projectMetricSnapshot.deleteMany({ where: { clientId } });
  await prisma.client.delete({ where: { id: clientId } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("POST /clients/:id/health-snapshots", () => {
  it("rejects a VIEWER", async () => {
    await request(app)
      .post(`/clients/${clientId}/health-snapshots`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ pv: 100_000, ac: 90_000, ev: 95_000, clientSignoff: true, resourceUtilization: 0.92 })
      .expect(403);
  });

  it("computes SPI/CPI/scorecard matching the BDD worked example", async () => {
    const res = await request(app)
      .post(`/clients/${clientId}/health-snapshots`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ pv: 100_000, ac: 90_000, ev: 95_000, clientSignoff: true, resourceUtilization: 0.92 })
      .expect(201);

    expect(res.body.snapshot.spi).toBeCloseTo(0.95, 9);
    expect(res.body.snapshot.cpi).toBeCloseTo(1.0556, 4);
    // schedule 15 (0.9<=0.95<1.0) + budget 30 (1.0556>=1.0) + signoff 20 + bench 20 (0.92>=0.9) = 85
    expect(res.body.snapshot.scorecardPoints).toBe(85);
  });

  it("returns 404 for a client that doesn't exist", async () => {
    await request(app)
      .post(`/clients/${randomUUID()}/health-snapshots`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ pv: 100, ac: 100, ev: 100, clientSignoff: true, resourceUtilization: 0.5 })
      .expect(404);
  });

  it("rejects a resourceUtilization outside 0-1", async () => {
    await request(app)
      .post(`/clients/${clientId}/health-snapshots`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ pv: 100, ac: 100, ev: 100, clientSignoff: true, resourceUtilization: 1.5 })
      .expect(400);
  });
});

describe("GET /clients/:id/health-history", () => {
  it("returns snapshots ordered by period ascending", async () => {
    await request(app)
      .post(`/clients/${clientId}/health-snapshots`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ pv: 200, ac: 200, ev: 210, clientSignoff: false, resourceUtilization: 0.5 })
      .expect(201);

    const res = await request(app)
      .get(`/clients/${clientId}/health-history`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.snapshots.length).toBeGreaterThanOrEqual(2);
    const periods = res.body.snapshots.map((s: { period: string }) => new Date(s.period).getTime());
    const sorted = [...periods].sort((a, b) => a - b);
    expect(periods).toEqual(sorted);
  });

  it("requires authentication", async () => {
    await request(app).get(`/clients/${clientId}/health-history`).expect(401);
  });
});
