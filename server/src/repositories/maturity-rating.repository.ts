import type { MaturityDimension } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const createMaturityRating = (data: {
  clientId: string;
  dimension: MaturityDimension;
  level: number;
  notes?: string | null;
  ratedById: string;
}) => prisma.maturityRating.create({ data });

/// One row per dimension: the most recent rating entered for this client.
export const findLatestRatingsForClient = (clientId: string) =>
  prisma.maturityRating.findMany({
    where: { clientId },
    distinct: ["dimension"],
    orderBy: { createdAt: "desc" },
  });
