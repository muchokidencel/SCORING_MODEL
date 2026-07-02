import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const listClients = (search?: string) =>
  prisma.client.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
  });

export const findClientById = (id: string) => prisma.client.findUnique({ where: { id } });

export const createClient = (data: Prisma.ClientCreateInput) => prisma.client.create({ data });

export const updateClient = (id: string, data: Prisma.ClientUpdateInput) =>
  prisma.client.update({ where: { id }, data });

export const deleteClient = (id: string) => prisma.client.delete({ where: { id } });
