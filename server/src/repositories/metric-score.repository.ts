import { prisma } from "../lib/prisma.js";

export const createMetricScore = (data: {
  clientId: string;
  evaluationCategoryId: string;
  rawMeasurement: number;
  computedScore: number;
  weightSnapshot: number;
  scoredById: string;
}) => prisma.metricScore.create({ data });

/// One row per category: the most recent score entered for this client,
/// per category. Categories never scored for this client are simply absent.
export const findLatestScoresForClient = (clientId: string) =>
  prisma.metricScore.findMany({
    where: { clientId },
    distinct: ["evaluationCategoryId"],
    orderBy: { createdAt: "desc" },
  });

export const findScoresHistoryForClientAndCategory = (
  clientId: string,
  evaluationCategoryId: string
) =>
  prisma.metricScore.findMany({
    where: { clientId, evaluationCategoryId },
    orderBy: { createdAt: "desc" },
    include: {
      scoredBy: {
        select: { name: true },
      },
    },
  });

