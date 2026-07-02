import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyAccessToken } from "../services/auth.service.js";
import { forbidden, unauthorized } from "../types/http-error.js";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw unauthorized("Missing bearer token");
  }

  const token = header.slice("Bearer ".length);
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw unauthorized("Invalid or expired token");
  }

  req.user = { id: payload.sub, email: payload.email, role: payload.role };
  next();
};

export const requireRole =
  (...allowed: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw unauthorized();
    }
    if (!allowed.includes(req.user.role)) {
      throw forbidden(`Requires role: ${allowed.join(" or ")}`);
    }
    next();
  };
