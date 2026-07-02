import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { findUserById, listAllUsers, updateUserRole } from "../repositories/user.repository.js";
import { logEvent } from "../services/audit.service.js";
import { notFound } from "../types/http-error.js";

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.use(requireRole("ADMIN"));

userRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await listAllUsers();
    res.json({ users });
  }),
);

const updateRoleSchema = z.object({
  role: z.enum(["VIEWER", "SCORER", "ADMIN"]),
});

userRouter.patch(
  "/:id/role",
  validateBody(updateRoleSchema),
  asyncHandler(async (req, res) => {
    const target = await findUserById(req.params.id);
    if (!target) {
      throw notFound("User not found");
    }

    const updated = await updateUserRole(req.params.id, req.body.role);

    await logEvent({
      clientId: null,
      userId: req.user!.id,
      action: "USER_ROLE_UPDATE",
      details: {
        targetUserId: target.id,
        targetName: target.name,
        oldRole: target.role,
        newRole: req.body.role,
      },
    });

    res.json({ user: updated });
  }),
);
