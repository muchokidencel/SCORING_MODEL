import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { isValidDimension } from "../constants/qualitative-dimensions.js";
import { badRequest } from "../types/http-error.js";
import { submitMaturityRating } from "../services/maturity-rating.service.js";
import { getCompositeScoreForClient } from "../services/composite.service.js";
import { invalidateDashboardCache } from "../services/dashboard.service.js";

export const maturityRatingRouter = Router({ mergeParams: true });

const submitRatingSchema = z.object({
  level: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  notes: z.string().optional(),
});

maturityRatingRouter.use(requireAuth);

maturityRatingRouter.post(
  "/dimensions/:dimension/rating",
  requireRole("SCORER", "ADMIN"),
  validateBody(submitRatingSchema),
  asyncHandler(async (req, res) => {
    if (!isValidDimension(req.params.dimension)) {
      throw badRequest("Unknown qualitative dimension");
    }

    const rating = await submitMaturityRating({
      clientId: req.params.id,
      dimension: req.params.dimension,
      level: req.body.level,
      notes: req.body.notes,
      ratedById: req.user!.id,
    });
    invalidateDashboardCache(req.params.id);
    res.status(201).json({ rating });
  }),
);

maturityRatingRouter.get(
  "/composite-score",
  asyncHandler(async (req, res) => {
    const result = await getCompositeScoreForClient(req.params.id);
    res.json(result);
  }),
);
