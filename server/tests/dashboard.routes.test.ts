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
      email: `dashboard-${role.toLowerCase()}-${runId}@coseke.test`,
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
  const client = await prisma.client.create({ data: { name: `Dashboard Test Client ${runId}` } });
  clientId = client.id;
});

afterAll(async () => {
  await prisma.metricScore.deleteMany({ where: { clientId } });
  await prisma.maturityRating.deleteMany({ where: { clientId } });
  await prisma.projectMetricSnapshot.deleteMany({ where: { clientId } });
  await prisma.client.delete({ where: { id: clientId } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("GET /clients/:id/dashboard", () => {
  it("requires authentication", async () => {
    await request(app).get(`/clients/${clientId}/dashboard`).expect(401);
  });

  it("bundles composite/quantitative/qualitative/progress into one payload for a zero-data client", async () => {
    const res = await request(app)
      .get(`/clients/${clientId}/dashboard`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.composite.score).toBeNull();
    expect(res.body.quantitative.categories).toHaveLength(7);
    expect(res.body.quantitative.categories.every((c: { ceilingPoints: number }) => c.ceilingPoints > 0)).toBe(true);
    expect(res.body.qualitative.dimensions).toHaveLength(3);
    expect(res.body.progress.scorecardPoints).toBeNull();
  });

  it("reflects a newly-submitted score immediately (cache invalidated on write)", async () => {
    const categories = await prisma.evaluationCategory.findMany();
    const category = categories[0];

    // Prime the cache with the zero-data snapshot.
    await request(app)
      .get(`/clients/${clientId}/dashboard`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    await request(app)
      .post(`/clients/${clientId}/metrics/${category.id}/score`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ rawMeasurement: category.benchmarkValue })
      .expect(201);

    const res = await request(app)
      .get(`/clients/${clientId}/dashboard`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    const scoredEntry = res.body.quantitative.categories.find(
      (c: { id: string }) => c.id === category.id,
    );
    expect(scoredEntry.computedScore).toBe(5);
    expect(scoredEntry.earnedPoints).toBeCloseTo(100 * category.weight, 9);
  });

  it("includes the latest progress score once a health snapshot exists", async () => {
    await request(app)
      .post(`/clients/${clientId}/health-snapshots`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ pv: 100_000, ac: 90_000, ev: 95_000, clientSignoff: true, resourceUtilization: 0.92 })
      .expect(201);

    const res = await request(app)
      .get(`/clients/${clientId}/dashboard`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.progress.scorecardPoints).toBe(85);
  });
});
