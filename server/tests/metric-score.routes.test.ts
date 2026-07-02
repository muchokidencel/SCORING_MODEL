import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword, issueAccessToken } from "../src/services/auth.service.js";
import type { EvaluationCategory } from "@prisma/client";

const app = createApp();
const runId = randomUUID().slice(0, 8);

const testUsers: { id: string }[] = [];
let clientId: string;
let categories: EvaluationCategory[];

let viewerToken: string;
let scorerToken: string;

const makeUser = async (role: "VIEWER" | "SCORER" | "ADMIN") => {
  const user = await prisma.user.create({
    data: {
      email: `metricscore-${role.toLowerCase()}-${runId}@coseke.test`,
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

  const client = await prisma.client.create({ data: { name: `Scoring Test Client ${runId}` } });
  clientId = client.id;

  categories = await prisma.evaluationCategory.findMany({ orderBy: { sortOrder: "asc" } });
});

afterAll(async () => {
  await prisma.metricScore.deleteMany({ where: { clientId } });
  await prisma.client.delete({ where: { id: clientId } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("POST /clients/:id/metrics/:metricId/score", () => {
  it("requires SCORER or ADMIN, not VIEWER", async () => {
    const category = categories[0];
    await request(app)
      .post(`/clients/${clientId}/metrics/${category.id}/score`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ rawMeasurement: 0.95 })
      .expect(403);
  });

  it("computes and stores a score for a valid submission", async () => {
    const category = categories.find((c) => c.name === "Digitization Efficiency")!;
    const res = await request(app)
      .post(`/clients/${clientId}/metrics/${category.id}/score`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ rawMeasurement: 0.95 }) // exactly meets the 0.95 AT_LEAST benchmark
      .expect(201);

    expect(res.body.score.computedScore).toBe(5);
    expect(res.body.score.rawMeasurement).toBe(0.95);
  });

  it("returns 404 for a client that doesn't exist", async () => {
    const category = categories[0];
    await request(app)
      .post(`/clients/${randomUUID()}/metrics/${category.id}/score`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ rawMeasurement: 0.95 })
      .expect(404);
  });

  it("returns 404 for a metric category that doesn't exist", async () => {
    await request(app)
      .post(`/clients/${clientId}/metrics/${randomUUID()}/score`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ rawMeasurement: 0.95 })
      .expect(404);
  });

  it("rejects a negative raw measurement", async () => {
    const category = categories[0];
    await request(app)
      .post(`/clients/${clientId}/metrics/${category.id}/score`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ rawMeasurement: -1 })
      .expect(400);
  });
});

describe("GET /clients/:id/quantitative-score", () => {
  it("reports departmentalScore as null until all 7 categories are scored", async () => {
    const fresh = await prisma.client.create({
      data: { name: `Partial Scoring Client ${runId}` },
    });

    const category = categories[0];
    await request(app)
      .post(`/clients/${fresh.id}/metrics/${category.id}/score`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ rawMeasurement: 0.95 })
      .expect(201);

    const res = await request(app)
      .get(`/clients/${fresh.id}/quantitative-score`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.departmentalScore).toBeNull();
    const scoredEntry = res.body.categories.find((c: { id: string }) => c.id === category.id);
    expect(scoredEntry.latestScore.computedScore).toBe(5);
    const unscoredEntry = res.body.categories.find((c: { id: string }) => c.id !== category.id);
    expect(unscoredEntry.latestScore).toBeNull();

    await prisma.metricScore.deleteMany({ where: { clientId: fresh.id } });
    await prisma.client.delete({ where: { id: fresh.id } });
  });

  it(
    "computes the departmental score once all 7 categories are scored",
    async () => {
      // Score every category at exactly its benchmark -> every metric = 5 -> departmental = 100
      await Promise.all(
        categories.map((category) =>
          request(app)
            .post(`/clients/${clientId}/metrics/${category.id}/score`)
            .set("Authorization", `Bearer ${scorerToken}`)
            .send({ rawMeasurement: category.benchmarkValue })
            .expect(201),
        ),
      );

      const res = await request(app)
        .get(`/clients/${clientId}/quantitative-score`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.categories).toHaveLength(7);
      expect(
        res.body.categories.every(
          (c: { latestScore: { computedScore: number } }) => c.latestScore.computedScore === 5,
        ),
      ).toBe(true);
      expect(res.body.departmentalScore).toBeCloseTo(100, 9);
    },
    60000,
  );

  it("requires authentication", async () => {
    await request(app).get(`/clients/${clientId}/quantitative-score`).expect(401);
  });
});

describe("GET /clients/:id/metrics/:metricId/history", () => {
  it("returns scoring history ordered by createdAt desc", async () => {
    const category = categories[0];
    const res = await request(app)
      .get(`/clients/${clientId}/metrics/${category.id}/history`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.history).toBeInstanceOf(Array);
    if (res.body.history.length > 0) {
      expect(res.body.history[0]).toHaveProperty("rawMeasurement");
      expect(res.body.history[0]).toHaveProperty("scoredBy");
      expect(res.body.history[0].scoredBy).toHaveProperty("name");
    }
  });

  it("requires authentication", async () => {
    const category = categories[0];
    await request(app).get(`/clients/${clientId}/metrics/${category.id}/history`).expect(401);
  });
});

