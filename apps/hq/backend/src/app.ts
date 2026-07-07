import express from "express";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import { countriesRouter } from "./routes/countries";
import { lotsRouter } from "./routes/lots";
import { alertsRouter } from "./routes/alerts";
import { overviewRouter } from "./routes/overview";

export function createApp() {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use(countriesRouter);
  app.use(lotsRouter);
  app.use(alertsRouter);
  app.use(overviewRouter);

  app.use(errorHandler);
  return app;
}
