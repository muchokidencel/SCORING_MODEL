import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { QUALITATIVE_DIMENSIONS } from "../constants/qualitative-dimensions.js";

export const qualitativeDimensionRouter = Router();

qualitativeDimensionRouter.use(requireAuth);

qualitativeDimensionRouter.get("/", (_req, res) => {
  res.json({ dimensions: QUALITATIVE_DIMENSIONS });
});
