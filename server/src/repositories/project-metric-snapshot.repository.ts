import { prisma } from "../lib/prisma.js";

export const createProjectMetricSnapshot = (data: {
  clientId: string;
  pv: number;
  ac: number;
  ev: number;
  clientSignoff: boolean;
  resourceUtilization: number;
  spi: number;
  cpi: number;
  scorecardPoints: number;
  enteredById: string;
}) => prisma.projectMetricSnapshot.create({ data });

export const findSnapshotsForClient = (clientId: string) =>
  prisma.projectMetricSnapshot.findMany({
    where: { clientId },
    orderBy: { period: "asc" },
  });

export const findLatestSnapshotForClient = (clientId: string) =>
  prisma.projectMetricSnapshot.findFirst({
    where: { clientId },
    orderBy: { period: "desc" },
  });
