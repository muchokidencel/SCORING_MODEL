import type { MaturityDimension } from "@prisma/client";
import { QUALITATIVE_DIMENSIONS } from "../constants/qualitative-dimensions.js";
import { badRequest } from "../types/http-error.js";
import { logEvent } from "./audit.service.js";
import { getClientOrThrow } from "./client.service.js";
import { qualitativeScore, type MaturityLevel } from "./composite.service.js";
import {
  createMaturityRating,
  findLatestRatingsForClient,
} from "../repositories/maturity-rating.repository.js";

const VALID_LEVELS = [1, 3, 5];

export const submitMaturityRating = async (params: {
  clientId: string;
  dimension: MaturityDimension;
  level: number;
  notes?: string;
  ratedById: string;
}) => {
  await getClientOrThrow(params.clientId);

  if (!VALID_LEVELS.includes(params.level)) {
    throw badRequest("Level must be 1, 3, or 5");
  }

  const rating = await createMaturityRating({
    clientId: params.clientId,
    dimension: params.dimension,
    level: params.level,
    notes: params.notes ?? null,
    ratedById: params.ratedById,
  });

  await logEvent({
    clientId: params.clientId,
    userId: params.ratedById,
    action: "MATURITY_RATING_UPDATE",
    details: {
      dimension: params.dimension,
      level: params.level,
      notes: params.notes ?? null,
    },
  });

  return rating;
};

export const getQualitativeScore = async (clientId: string) => {
  await getClientOrThrow(clientId);

  const latestRatings = await findLatestRatingsForClient(clientId);
  const ratingByDimension = new Map(latestRatings.map((r) => [r.dimension, r]));

  const dimensions = QUALITATIVE_DIMENSIONS.map((def) => {
    const latest = ratingByDimension.get(def.key);
    return {
      key: def.key,
      label: def.label,
      levels: def.levels,
      currentLevel: latest?.level ?? null,
      notes: latest?.notes ?? null,
      ratedAt: latest?.createdAt ?? null,
    };
  });

  const allRated = dimensions.every((d) => d.currentLevel !== null);
  const score = allRated
    ? qualitativeScore(dimensions.map((d) => d.currentLevel as MaturityLevel))
    : null;

  return { dimensions, score };
};
