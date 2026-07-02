import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findUserById = (id: string) => prisma.user.findUnique({ where: { id } });

export const createUser = (data: {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}) => prisma.user.create({ data });

export const listAllUsers = () =>
  prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

export const updateUserRole = (id: string, role: Role) =>
  prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

