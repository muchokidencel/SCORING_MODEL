import { prisma } from "../lib/prisma.js";

export const listEvaluationCategories = () =>
  prisma.evaluationCategory.findMany({ orderBy: { sortOrder: "asc" } });

export const findEvaluationCategoryById = (id: string) =>
  prisma.evaluationCategory.findUnique({ where: { id } });
