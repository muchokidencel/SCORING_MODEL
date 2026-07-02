import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { conflict, unauthorized } from "../types/http-error.js";
import { createUser, findUserByEmail } from "../repositories/user.repository.js";

const SALT_ROUNDS = 12;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const issueAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload & jwt.JwtPayload;
  } catch {
    return null;
  }
};

/// First registered account becomes ADMIN so there's always at least one
/// admin without a manual DB edit; every account after that defaults to VIEWER.
export const registerUser = async (params: { email: string; password: string; name: string }) => {
  const existing = await findUserByEmail(params.email);
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const userCount = await prisma.user.count();
  const role: Role = userCount === 0 ? "ADMIN" : "VIEWER";

  const passwordHash = await hashPassword(params.password);
  const user = await createUser({
    email: params.email,
    passwordHash,
    name: params.name,
    role,
  });

  const token = issueAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
};

export const loginUser = async (params: { email: string; password: string }) => {
  const user = await findUserByEmail(params.email);
  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  const valid = await verifyPassword(params.password, user.passwordHash);
  if (!valid) {
    throw unauthorized("Invalid email or password");
  }

  const token = issueAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
};
