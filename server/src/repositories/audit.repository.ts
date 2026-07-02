import { prisma } from "../lib/prisma.js";

export const createAuditLog = (params: {
  clientId: string | null;
  userId: string;
  action: string;
  details: string;
}) =>
  prisma.auditLog.create({
    data: {
      clientId: params.clientId,
      userId: params.userId,
      action: params.action,
      details: params.details,
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

export const findAuditLogsByClient = (clientId: string) =>
  prisma.auditLog.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });
