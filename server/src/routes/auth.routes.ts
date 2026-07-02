import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { loginUser, registerUser } from "../services/auth.service.js";
import { findUserById } from "../repositories/user.repository.js";
import { notFound } from "../types/http-error.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const toPublicUser = (user: { id: string; email: string; name: string; role: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { user, token } = await registerUser(req.body);
    res.status(201).json({ user: toPublicUser(user), token });
  }),
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { user, token } = await loginUser(req.body);
    res.json({ user: toPublicUser(user), token });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.user!.id);
    if (!user) {
      throw notFound("User no longer exists");
    }
    res.json({ user: toPublicUser(user) });
  }),
);
