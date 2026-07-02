import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getAuditLogs } from "../services/audit.service.js";

export const auditRouter = Router({ mergeParams: true });

auditRouter.use(requireAuth);

auditRouter.get(
  "/audit-logs",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const logs = await getAuditLogs(req.params.id);
    res.json({ logs });
  }),
);
