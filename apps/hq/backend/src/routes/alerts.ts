import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { consolidateAlerts } from "../services/consolidation";
import { resolveData } from "./helpers";

export const alertsRouter = Router();

alertsRouter.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    const results = await resolveData(req.query.country);
    const { data, meta } = consolidateAlerts(results);
    res.json({ alerts: data, meta });
  }),
);
