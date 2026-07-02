import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword, issueAccessToken } from "../src/services/auth.service.js";
import {
  connectClientIntegration,
  getSimulatedError,
  setSimulatedError,
  syncIntegration,
} from "../src/services/integration.service.js";
import { runSyncCron } from "../src/services/cron-jobs.js";

const app = createApp();
const runId = randomUUID().slice(0, 8);

const testUsers: { id: string }[] = [];
let clientId: string;
let scorerToken: string;
let viewerToken: string;
let userId: string;

const makeUser = async (role: "VIEWER" | "SCORER" | "ADMIN") => {
  const user = await prisma.user.create({
    data: {
      email: `integration-${role.toLowerCase()}-${runId}@coseke.test`,
      passwordHash: await hashPassword("pass123"),
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
  const scorer = await makeUser("SCORER");
  scorerToken = scorer.token;
  userId = scorer.id;

  const viewer = await makeUser("VIEWER");
  viewerToken = viewer.token;

  const client = await prisma.client.create({
    data: { name: `Integration Test Client ${runId}` },
  });
  clientId = client.id;
});

afterAll(async () => {
  // Clean up all data created by this run
  await prisma.integrationConfig.deleteMany({ where: { clientId } });
  await prisma.projectMetricSnapshot.deleteMany({ where: { clientId } });
  await prisma.client.delete({ where: { id: clientId } });
  await prisma.user.deleteMany({ where: { id: { in: testUsers.map((u) => u.id) } } });
  await prisma.$disconnect();
});

describe("Integration Connection & Mapping (POST / PATCH / DELETE)", () => {
  it("requires authentication for all endpoints", async () => {
    await request(app).get(`/clients/${clientId}/integration`).expect(401);
  });

  it("returns null config when none exists", async () => {
    const res = await request(app)
      .get(`/clients/${clientId}/integration`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.config).toBeNull();
    expect(res.body.simulatedError).toBe("NONE");
  });

  it("lets a SCORER connect a provider", async () => {
    const res = await request(app)
      .post(`/clients/${clientId}/integration/connect`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ provider: "JIRA", authCode: "some_temp_code" })
      .expect(200);

    expect(res.body.config).toBeDefined();
    expect(res.body.config.provider).toBe("JIRA");
    expect(res.body.config.accessToken).toContain("mock_access_token_");
  });

  it("rejects a VIEWER connecting a provider", async () => {
    await request(app)
      .post(`/clients/${clientId}/integration/connect`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ provider: "ASANA", authCode: "code" })
      .expect(403);
  });

  it("lets a SCORER save field mapping", async () => {
    const res = await request(app)
      .patch(`/clients/${clientId}/integration/mapping`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({
        pvField: "customfield_1001",
        acField: "customfield_1002",
        evField: "customfield_1003",
        jiraProjectKey: "COSEKE",
      })
      .expect(200);

    expect(res.body.config.pvField).toBe("customfield_1001");
    expect(res.body.config.jiraProjectKey).toBe("COSEKE");
  });
});

describe("Sync & Error Simulations (POST / clients/:id/integration/sync)", () => {
  it("lets a SCORER simulate an error status", async () => {
    const res = await request(app)
      .post(`/clients/${clientId}/integration/simulate-error`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ errorType: "TOKEN_EXPIRED" })
      .expect(200);

    expect(res.body.simulatedError).toBe("TOKEN_EXPIRED");
    expect(getSimulatedError(clientId)).toBe("TOKEN_EXPIRED");
  });

  it("sync fails with 401 on TOKEN_EXPIRED simulation", async () => {
    const res = await request(app)
      .post(`/clients/${clientId}/integration/sync`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .expect(401);

    expect(res.body.error).toContain("expired");

    // DB config should reflect failure
    const configRes = await request(app)
      .get(`/clients/${clientId}/integration`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(configRes.body.config.lastSyncStatus).toBe("FAILED");
    expect(configRes.body.config.lastSyncError).toContain("expired");
  });

  it("sync fails with 429 on RATE_LIMIT simulation", async () => {
    await request(app)
      .post(`/clients/${clientId}/integration/simulate-error`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ errorType: "RATE_LIMIT" })
      .expect(200);

    await request(app)
      .post(`/clients/${clientId}/integration/sync`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .expect(429);
  });

  it("sync succeeds when error simulation is disabled", async () => {
    await request(app)
      .post(`/clients/${clientId}/integration/simulate-error`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .send({ errorType: "NONE" })
      .expect(200);

    const res = await request(app)
      .post(`/clients/${clientId}/integration/sync`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .expect(200);

    expect(res.body.snapshot).toBeDefined();
    expect(res.body.snapshot.pv).toBeGreaterThan(0);
    expect(res.body.config.lastSyncStatus).toBe("SUCCESS");
    expect(res.body.config.lastSyncedAt).toBeDefined();
  });
});

describe("Recalculation Cron Job Automated Sync", () => {
  it("runSyncCron executes successfully across connected integrations", async () => {
    // Should complete without throwing and process the client we connected
    await expect(runSyncCron()).resolves.toBeUndefined();
  });
});

describe("Integration Disconnection", () => {
  it("lets a SCORER disconnect the integration", async () => {
    await request(app)
      .delete(`/clients/${clientId}/integration`)
      .set("Authorization", `Bearer ${scorerToken}`)
      .expect(200);

    const res = await request(app)
      .get(`/clients/${clientId}/integration`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(200);

    expect(res.body.config).toBeNull();
  });
});
