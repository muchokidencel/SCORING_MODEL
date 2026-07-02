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
      email: `maturity-${role.toLowerCase()}-${runId}@coseke.test`,
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
  const client = await prisma.client.create({ data: { name: `Maturity Test Client ${runId}` } });
  clientId = client.id;
});

afterAll(async () => {
  await prisma.maturityRating.deleteMany({ where: { clientId } });
  await prisma.client.delete({ where: { id: clientId } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("GET /qualitative-dimensions", () => {
  it("returns the 3 fixed dimensions with their rubric text", async () => {
    const res = await request(app)
      .get("/qualitative-dimensions")
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.dimensions).toHaveLength(3);
    expect(res.body.dimensions[0].levels[1]).toBeTruthy();
    expect(res.body.dimensions[0].levels[3]).toBeTruthy();
    expect(res.body.dimensions[0].levels[5]).toBeTruthy();
  });
});

describe("POST /clients/:id/dimensions/:dimension/rating", () => {
  it("rejects a VIEWER", async () => {
    await request(app)
      .post(`/clients/${clientId}/dimensions/SYSTEM_ADOPTION/rating`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ level: 5 })
      .expect(403);
  });

  it("rejects an invalid level (not 1/3/5)", async () => {
    await request(app)
      .post(`/clients/${clientId}/dimensions/SYSTEM_ADOPTION/rating`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ level: 4 })
      .expect(400);
  });

  it("rejects an unknown dimension", async () => {
    await request(app)
      .post(`/clients/${clientId}/dimensions/NOT_A_REAL_DIMENSION/rating`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ level: 5 })
      .expect(400);
  });

  it("accepts a valid rating from a SCORER", async () => {
    const res = await request(app)
      .post(`/clients/${clientId}/dimensions/SYSTEM_ADOPTION/rating`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ level: 5, notes: "Fully migrated off paper workflows" })
      .expect(201);

    expect(res.body.rating.level).toBe(5);
  });
});

describe("GET /clients/:id/composite-score", () => {
  it("reports composite as null until quantitative and qualitative are both complete", async () => {
    const res = await request(app)
      .get(`/clients/${clientId}/composite-score`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.composite).toBeNull();
    expect(res.body.band).toBeNull();
    const systemAdoption = res.body.qualitative.dimensions.find(
      (d: { key: string }) => d.key === "SYSTEM_ADOPTION",
    );
    expect(systemAdoption.currentLevel).toBe(5);
  });

  it("computes composite and band once all 7 quantitative metrics and all 3 qualitative dimensions are scored", async () => {
    const categories = await prisma.evaluationCategory.findMany();
    await Promise.all(
      categories.map((category) =>
        request(app)
          .post(`/clients/${clientId}/metrics/${category.id}/score`)
          .set("Authorization", `Bearer ${scorerToken}`)
          .send({ rawMeasurement: category.benchmarkValue }) // every metric = 5 -> quantitative = 100
          .expect(201),
      ),
    );

    await request(app)
      .post(`/clients/${clientId}/dimensions/DATA_PRIVACY_COMPLIANCE/rating`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ level: 1 })
      .expect(201);
    await request(app)
      .post(`/clients/${clientId}/dimensions/CHANGE_MANAGEMENT_ONBOARDING/rating`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ level: 3 })
      .expect(201);
    // SYSTEM_ADOPTION already rated at 5 above.
    // Qualitative: normalized (100, 20, 60) -> average 60.
    // Composite: 100 * 0.6 + 60 * 0.4 = 84 -> "Strong" band.

    const res = await request(app)
      .get(`/clients/${clientId}/composite-score`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.quantitative.departmentalScore).toBeCloseTo(100, 9);
    expect(res.body.qualitative.score).toBeCloseTo(60, 9);
    expect(res.body.composite).toBeCloseTo(84, 9);
    expect(res.body.band).toBe("Strong");
  });

  it("requires authentication", async () => {
    await request(app).get(`/clients/${clientId}/composite-score`).expect(401);
  });
});
