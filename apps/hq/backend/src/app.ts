import express from "express";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import { countriesRouter } from "./controllers/countries.controller";
import { warehousesRouter } from "./controllers/warehouses.controller";
import { lotsRouter } from "./controllers/lots.controller";
import { alertsRouter } from "./controllers/alerts.controller";
import { overviewRouter } from "./controllers/overview.controller";

export function createApp() {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use(countriesRouter);
  app.use(warehousesRouter);
  app.use(lotsRouter);
  app.use(alertsRouter);
  app.use(overviewRouter);

  app.use(errorHandler);
  return app;
}
