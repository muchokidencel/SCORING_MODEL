import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getHealthHistory, submitHealthSnapshot } from "../services/project-health.service.js";
import { invalidateDashboardCache } from "../services/dashboard.service.js";

export const projectHealthRouter = Router({ mergeParams: true });

const submitSnapshotSchema = z.object({
  pv: z.coerce.number().finite().nonnegative(),
  ac: z.coerce.number().finite().nonnegative(),
  ev: z.coerce.number().finite().nonnegative(),
  clientSignoff: z.boolean(),
  resourceUtilization: z.coerce.number().min(0).max(1),
});

projectHealthRouter.use(requireAuth);

projectHealthRouter.post(
  "/health-snapshots",
  requireRole("SCORER", "ADMIN"),
  validateBody(submitSnapshotSchema),
  asyncHandler(async (req, res) => {
    const snapshot = await submitHealthSnapshot({
      clientId: req.params.id,
      ...req.body,
      enteredById: req.user!.id,
    });
    invalidateDashboardCache(req.params.id);
    res.status(201).json({ snapshot });
  }),
);

projectHealthRouter.get(
  "/health-history",
  asyncHandler(async (req, res) => {
    const snapshots = await getHealthHistory(req.params.id);
    res.json({ snapshots });
  }),
);
