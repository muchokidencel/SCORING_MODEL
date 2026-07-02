import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getMetricHistory, getQuantitativeScore, submitMetricScore } from "../services/metric-score.service.js";
import { invalidateDashboardCache } from "../services/dashboard.service.js";

export const metricScoreRouter = Router({ mergeParams: true });

const submitScoreSchema = z.object({
  rawMeasurement: z.coerce.number().finite().nonnegative(),
});

metricScoreRouter.use(requireAuth);

metricScoreRouter.post(
  "/metrics/:metricId/score",
  requireRole("SCORER", "ADMIN"),
  validateBody(submitScoreSchema),
  asyncHandler(async (req, res) => {
    const score = await submitMetricScore({
      clientId: req.params.id,
      evaluationCategoryId: req.params.metricId,
      rawMeasurement: req.body.rawMeasurement,
      scoredById: req.user!.id,
    });
    invalidateDashboardCache(req.params.id);
    res.status(201).json({ score });
  }),
);

metricScoreRouter.get(
  "/quantitative-score",
  asyncHandler(async (req, res) => {
    const result = await getQuantitativeScore(req.params.id);
    res.json(result);
  }),
);

metricScoreRouter.get(
  "/metrics/:metricId/history",
  asyncHandler(async (req, res) => {
    const history = await getMetricHistory(req.params.id, req.params.metricId);
    res.json({ history });
  }),
);

