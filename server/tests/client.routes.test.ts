import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword, issueAccessToken } from "../src/services/auth.service.js";

const app = createApp();
const runId = randomUUID().slice(0, 8);

const testUsers: { id: string; token: string }[] = [];
const createdClientIds: string[] = [];

const makeUser = async (role: "VIEWER" | "SCORER" | "ADMIN") => {
  const user = await prisma.user.create({
    data: {
      email: `${role.toLowerCase()}-${runId}@coseke.test`,
      passwordHash: await hashPassword("irrelevant-for-these-tests"),
      name: `${role} Tester`,
      role,
    },
  });
  const token = issueAccessToken({ sub: user.id, email: user.email, role: user.role });
  testUsers.push({ id: user.id, token });
  return token;
};

let viewerToken: string;
let scorerToken: string;
let adminToken: string;

beforeAll(async () => {
  viewerToken = await makeUser("VIEWER");
  scorerToken = await makeUser("SCORER");
  adminToken = await makeUser("ADMIN");
});

afterAll(async () => {
  await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("GET /clients", () => {
  it("requires authentication", async () => {
    await request(app).get("/clients").expect(401);
  });

  it("returns an empty list for a search term that matches nothing", async () => {
    const res = await request(app)
      .get(`/clients?search=no-such-client-${runId}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);
    expect(res.body.clients).toEqual([]);
  });
});

describe("POST /clients", () => {
  it("lets a SCORER create a client with valid fields", async () => {
    const res = await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ name: `Acme Corp ${runId}`, contactEmail: "ops@acme.test" })
      .expect(201);

    expect(res.body.client.name).toBe(`Acme Corp ${runId}`);
    expect(res.body.client.status).toBe("ACTIVE");
    createdClientIds.push(res.body.client.id);
  });

  it("rejects a VIEWER attempting to create a client", async () => {
    const res = await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ name: `Should Not Exist ${runId}` })
      .expect(403);
    expect(res.body.error).toMatch(/role/i);
  });

  it("rejects a missing required field with a validation error", async () => {
    await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ contactEmail: "no-name@acme.test" })
      .expect(400);
  });
});

describe("GET /clients/:id", () => {
  it("returns 404 for a client that doesn't exist", async () => {
    await request(app)
      .get(`/clients/${randomUUID()}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(404);
  });

  it("returns the created client by id", async () => {
    const created = await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ name: `Fetch Me ${runId}` })
      .expect(201);
    createdClientIds.push(created.body.client.id);

    const res = await request(app)
      .get(`/clients/${created.body.client.id}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);
    expect(res.body.client.name).toBe(`Fetch Me ${runId}`);
  });
});

describe("PATCH /clients/:id", () => {
  it("lets a SCORER update a client's fields", async () => {
    const created = await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ name: `Before Update ${runId}` })
      .expect(201);
    createdClientIds.push(created.body.client.id);

    const res = await request(app)
      .patch(`/clients/${created.body.client.id}`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ status: "INACTIVE" })
      .expect(200);

    expect(res.body.client.status).toBe("INACTIVE");
    expect(res.body.client.name).toBe(`Before Update ${runId}`);
  });

  it("rejects a VIEWER attempting to update a client", async () => {
    const created = await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ name: `Protected From Viewer ${runId}` })
      .expect(201);
    createdClientIds.push(created.body.client.id);

    await request(app)
      .patch(`/clients/${created.body.client.id}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ status: "INACTIVE" })
      .expect(403);
  });
});

describe("DELETE /clients/:id", () => {
  it("rejects a SCORER attempting to delete a client", async () => {
    const created = await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ name: `Not Deletable By Scorer ${runId}` })
      .expect(201);
    createdClientIds.push(created.body.client.id);

    await request(app)
      .delete(`/clients/${created.body.client.id}`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .expect(403);
  });

  it("lets an ADMIN delete a client", async () => {
    const created = await request(app)
      .post("/clients")
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ name: `Deletable By Admin ${runId}` })
      .expect(201);

    await request(app)
      .delete(`/clients/${created.body.client.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(204);

    await request(app)
      .get(`/clients/${created.body.client.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });
});

describe("GET /evaluation-categories", () => {
  it("returns the 7 seeded metrics with weights summing to 100%", async () => {
    const res = await request(app)
      .get("/evaluation-categories")
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.categories).toHaveLength(7);
    const totalWeight = res.body.categories.reduce(
      (sum: number, c: { weight: number }) => sum + c.weight,
      0,
    );
    expect(totalWeight).toBeCloseTo(1, 9);
  });
});
