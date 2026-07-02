import { getClientOrThrow } from "./client.service.js";
import { getCompositeScoreForClient } from "./composite.service.js";
import { normalizeScore } from "./scoring.service.js";
import { findLatestSnapshotForClient } from "../repositories/project-metric-snapshot.repository.js";
import { getCached, invalidateCached, setCached } from "../lib/ttl-cache.js";

const cacheKey = (clientId: string) => `dashboard:${clientId}`;

export const invalidateDashboardCache = (clientId: string): void => {
  invalidateCached(cacheKey(clientId));
};

const buildDashboard = async (clientId: string) => {
  await getClientOrThrow(clientId);

  const [composite, latestSnapshot] = await Promise.all([
    getCompositeScoreForClient(clientId),
    findLatestSnapshotForClient(clientId),
  ]);

  const categories = composite.quantitative.categories.map((category) => ({
    id: category.id,
    name: category.name,
    weight: category.weight,
    computedScore: category.latestScore?.computedScore ?? null,
    earnedPoints: category.latestScore
      ? normalizeScore(category.latestScore.computedScore) * category.weight
      : null,
    ceilingPoints: 100 * category.weight,
  }));

  return {
    composite: { score: composite.composite, band: composite.band },
    quantitative: {
      departmentalScore: composite.quantitative.departmentalScore,
      categories,
    },
    qualitative: {
      score: composite.qualitative.score,
      dimensions: composite.qualitative.dimensions.map((d) => ({
        key: d.key,
        label: d.label,
        currentLevel: d.currentLevel,
        notes: d.notes,
        ratedAt: d.ratedAt,
      })),
    },
    progress: {
      scorecardPoints: latestSnapshot?.scorecardPoints ?? null,
      spi: latestSnapshot?.spi ?? null,
      cpi: latestSnapshot?.cpi ?? null,
      period: latestSnapshot?.period ?? null,
    },
  };
};

export const getDashboard = async (clientId: string) => {
  const cached = getCached<Awaited<ReturnType<typeof buildDashboard>>>(cacheKey(clientId));
  if (cached) return cached;

  const payload = await buildDashboard(clientId);
  setCached(cacheKey(clientId), payload, 60_000);
  return payload;
};
