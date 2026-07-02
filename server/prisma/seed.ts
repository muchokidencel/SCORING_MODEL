import { PrismaClient, BenchmarkDirection } from "@prisma/client";

const prisma = new PrismaClient();

// Source: scoring-model doc's evaluation category table. Weights must sum to
// 100% — verified below before writing anything.
//
// benchmarkValue/benchmarkDirection parse the free-text targetBenchmark into
// numbers the formula engine compares against. Sales Velocity's source text
// ("90-180 days or more") is ambiguous about direction — treated here as an
// AT_MOST ceiling of 180 days (shorter cycle = better), flagged for
// confirmation against the real source doc.
const evaluationCategories = [
  {
    sortOrder: 1,
    name: "Digitization Efficiency",
    metricKpi: "Daily throughput variance",
    measurementFormula: "Actual pages scanned ÷ Scanned rated capacity",
    targetBenchmark: "≥ 95% capacity utilization",
    benchmarkValue: 0.95,
    benchmarkDirection: BenchmarkDirection.AT_LEAST,
    weight: 0.15,
  },
  {
    sortOrder: 2,
    name: "Data Accuracy",
    metricKpi: "QA Indexing and Error Rate",
    measurementFormula: "Rejected documents ÷ Total indexed documents",
    targetBenchmark: "≤ 0.1 error rate",
    benchmarkValue: 0.1,
    benchmarkDirection: BenchmarkDirection.AT_MOST,
    weight: 0.15,
  },
  {
    sortOrder: 3,
    name: "SLA and Support",
    metricKpi: "Resolution SLA",
    measurementFormula: "Tickets closed within SLA ÷ Total support tickets",
    targetBenchmark: "≥ 95% timely resolution",
    benchmarkValue: 0.95,
    benchmarkDirection: BenchmarkDirection.AT_LEAST,
    weight: 0.15,
  },
  {
    sortOrder: 4,
    name: "Sales Velocity",
    metricKpi: "Sales Cycle Duration",
    measurementFormula: "Date of lead ingestion to date of close",
    targetBenchmark: "90-180 days or more",
    benchmarkValue: 180,
    benchmarkDirection: BenchmarkDirection.AT_MOST,
    weight: 0.1,
  },
  {
    sortOrder: 5,
    name: "Financial Health",
    metricKpi: "ARR Retention Rate",
    measurementFormula: "Current year revenue ÷ Previous year revenue",
    targetBenchmark: "≥ 95% client retention",
    benchmarkValue: 0.95,
    benchmarkDirection: BenchmarkDirection.AT_LEAST,
    weight: 0.2,
  },
  {
    sortOrder: 6,
    name: "Project Delivery",
    metricKpi: "Scope and Budget Overrun",
    measurementFormula: "Actual project cost ÷ Estimated proposal cost",
    targetBenchmark: "100% zero overruns",
    benchmarkValue: 1.0,
    benchmarkDirection: BenchmarkDirection.AT_MOST,
    weight: 0.15,
  },
  {
    sortOrder: 7,
    name: "Software Quality",
    metricKpi: "Post-launch bug density",
    measurementFormula: "Critical bugs logged ÷ Days post-go-live (90 days)",
    targetBenchmark: "≤ 2 critical bugs",
    benchmarkValue: 2,
    benchmarkDirection: BenchmarkDirection.AT_MOST,
    weight: 0.1,
  },
];

const totalWeight = evaluationCategories.reduce((sum, c) => sum + c.weight, 0);
if (Math.abs(totalWeight - 1) > 1e-9) {
  throw new Error(`Evaluation category weights must sum to 100%, got ${totalWeight * 100}%`);
}

async function main() {
  for (const category of evaluationCategories) {
    await prisma.evaluationCategory.upsert({
      where: { name: category.name },
      create: category,
      update: category,
    });
  }
  console.log(`Seeded ${evaluationCategories.length} evaluation categories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
