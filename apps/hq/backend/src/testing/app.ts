import express, { type Router } from "express";
import { errorHandler } from "../middleware/errorHandler";

// Minimal Express app to exercise a single controller router in isolation,
// with the shared error handler mounted (so 4xx/5xx are shaped as in prod).
export function testApp(router: Router) {
  const app = express();
  app.use(router);
  app.use(errorHandler);
  return app;
}
