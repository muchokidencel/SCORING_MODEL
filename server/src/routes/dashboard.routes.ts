import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { getDashboard } from "../services/dashboard.service.js";

export const dashboardRouter = Router({ mergeParams: true });

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const result = await getDashboard(req.params.id);
    res.json(result);
  }),
);
