import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  connectClientIntegration,
  disconnectClientIntegration,
  getSimulatedError,
  saveClientIntegrationMapping,
  setSimulatedError,
  syncIntegration,
} from "../services/integration.service.js";
import { findIntegrationConfigByClient } from "../repositories/integration.repository.js";
import { logEvent } from "../services/audit.service.js";

export const integrationRouter = Router({ mergeParams: true });

integrationRouter.use(requireAuth);

integrationRouter.get(
  "/integration",
  asyncHandler(async (req, res) => {
    const config = await findIntegrationConfigByClient(req.params.id);
    const simulatedError = getSimulatedError(req.params.id);
    res.json({ config, simulatedError });
  })
);

const connectSchema = z.object({
  provider: z.enum(["JIRA", "ASANA"]),
  authCode: z.string().min(1),
});

integrationRouter.post(
  "/integration/connect",
  requireRole("SCORER", "ADMIN"),
  validateBody(connectSchema),
  asyncHandler(async (req, res) => {
    const config = await connectClientIntegration({
      clientId: req.params.id,
      provider: req.body.provider,
      authCode: req.body.authCode,
    });
    await logEvent({
      clientId: req.params.id,
      userId: req.user!.id,
      action: "INTEGRATION_CONNECT",
      details: { provider: req.body.provider },
    });
    res.json({ config });
  })
);

const mappingSchema = z.object({
  pvField: z.string().min(1),
  acField: z.string().min(1),
  evField: z.string().min(1),
  jiraProjectKey: z.string().optional(),
  asanaWorkspaceId: z.string().optional(),
});

integrationRouter.patch(
  "/integration/mapping",
  requireRole("SCORER", "ADMIN"),
  validateBody(mappingSchema),
  asyncHandler(async (req, res) => {
    const config = await saveClientIntegrationMapping({
      clientId: req.params.id,
      ...req.body,
    });
    await logEvent({
      clientId: req.params.id,
      userId: req.user!.id,
      action: "INTEGRATION_MAPPING_UPDATE",
      details: req.body,
    });
    res.json({ config });
  })
);

integrationRouter.delete(
  "/integration",
  requireRole("SCORER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await logEvent({
      clientId: req.params.id,
      userId: req.user!.id,
      action: "INTEGRATION_DISCONNECT",
      details: {},
    });
    await disconnectClientIntegration(req.params.id);
    res.json({ success: true });
  })
);

integrationRouter.post(
  "/integration/sync",
  requireRole("SCORER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const result = await syncIntegration(req.params.id, req.user!.id);
    res.json(result);
  })
);

const simulateErrorSchema = z.object({
  errorType: z.enum(["TOKEN_EXPIRED", "RATE_LIMIT", "PERMISSION_DENIED", "NONE"]),
});

integrationRouter.post(
  "/integration/simulate-error",
  requireRole("SCORER", "ADMIN"),
  validateBody(simulateErrorSchema),
  asyncHandler(async (req, res) => {
    setSimulatedError(req.params.id, req.body.errorType);
    res.json({ success: true, simulatedError: req.body.errorType });
  })
);
