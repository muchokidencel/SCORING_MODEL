import { notFound } from "../types/http-error.js";
import { getClientOrThrow } from "./client.service.js";
import { departmentalScore, scoreMetric } from "./scoring.service.js";
import { logEvent } from "./audit.service.js";
import {
  findEvaluationCategoryById,
  listEvaluationCategories,
} from "../repositories/evaluation-category.repository.js";
import {
  createMetricScore,
  findLatestScoresForClient,
  findScoresHistoryForClientAndCategory,
} from "../repositories/metric-score.repository.js";


export const submitMetricScore = async (params: {
  clientId: string;
  evaluationCategoryId: string;
  rawMeasurement: number;
  scoredById: string;
}) => {
  await getClientOrThrow(params.clientId);

  const category = await findEvaluationCategoryById(params.evaluationCategoryId);
  if (!category) {
    throw notFound("Evaluation category not found");
  }

  const computedScore = scoreMetric(
    params.rawMeasurement,
    category.benchmarkValue,
    category.benchmarkDirection,
  );

  const score = await createMetricScore({
    clientId: params.clientId,
    evaluationCategoryId: params.evaluationCategoryId,
    rawMeasurement: params.rawMeasurement,
    computedScore,
    weightSnapshot: category.weight,
    scoredById: params.scoredById,
  });

  await logEvent({
    clientId: params.clientId,
    userId: params.scoredById,
    action: "METRIC_SCORE_UPDATE",
    details: {
      categoryName: category.name,
      rawMeasurement: params.rawMeasurement,
      computedScore,
    },
  });

  return score;
};

export const getQuantitativeScore = async (clientId: string) => {
  await getClientOrThrow(clientId);

  const [categories, latestScores] = await Promise.all([
    listEvaluationCategories(),
    findLatestScoresForClient(clientId),
  ]);

  const scoreByCategory = new Map(latestScores.map((s) => [s.evaluationCategoryId, s]));

  const breakdown = categories.map((category) => {
    const latest = scoreByCategory.get(category.id);
    return {
      id: category.id,
      name: category.name,
      metricKpi: category.metricKpi,
      targetBenchmark: category.targetBenchmark,
      benchmarkValue: category.benchmarkValue,
      benchmarkDirection: category.benchmarkDirection,
      weight: category.weight,
      latestScore: latest
        ? {
            rawMeasurement: latest.rawMeasurement,
            computedScore: latest.computedScore,
            period: latest.period,
            scoredAt: latest.createdAt,
          }
        : null,
    };
  });

  const allScored = breakdown.every((c) => c.latestScore !== null);
  const departmental = allScored
    ? departmentalScore(
        breakdown.map((c) => ({ score: c.latestScore!.computedScore, weight: c.weight })),
      )
    : null;

  return { categories: breakdown, departmentalScore: departmental };
};

export const getMetricHistory = async (clientId: string, evaluationCategoryId: string) => {
  await getClientOrThrow(clientId);
  return findScoresHistoryForClientAndCategory(clientId, evaluationCategoryId);
};

