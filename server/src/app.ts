import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { rateLimit } from "express-rate-limit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { clientRouter } from "./routes/client.routes.js";
import { evaluationCategoryRouter } from "./routes/evaluation-category.routes.js";
import { metricScoreRouter } from "./routes/metric-score.routes.js";
import { maturityRatingRouter } from "./routes/maturity-rating.routes.js";
import { qualitativeDimensionRouter } from "./routes/qualitative-dimension.routes.js";
import { projectHealthRouter } from "./routes/project-health.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { integrationRouter } from "./routes/integration.routes.js";
import { auditRouter } from "./routes/audit.routes.js";
import { monitoringRouter } from "./routes/monitoring.routes.js";
import { userRouter } from "./routes/user.routes.js";



export const createApp = () => {
  const app = express();

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later." },
  });

  app.use(globalLimiter);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/auth", authLimiter, authRouter);
  app.use("/clients", clientRouter);
  app.use("/clients/:id", metricScoreRouter);
  app.use("/clients/:id", maturityRatingRouter);
  app.use("/clients/:id", projectHealthRouter);
  app.use("/clients/:id", dashboardRouter);
  app.use("/clients/:id", integrationRouter);
  app.use("/clients/:id", auditRouter);
  app.use("/admin", monitoringRouter);
  app.use("/users", userRouter);
  app.use("/evaluation-categories", evaluationCategoryRouter);
  app.use("/qualitative-dimensions", qualitativeDimensionRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
