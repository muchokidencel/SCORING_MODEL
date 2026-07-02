import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { listEvaluationCategories } from "../repositories/evaluation-category.repository.js";

export const evaluationCategoryRouter = Router();

evaluationCategoryRouter.use(requireAuth);

evaluationCategoryRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await listEvaluationCategories();
    res.json({ categories });
  }),
);
