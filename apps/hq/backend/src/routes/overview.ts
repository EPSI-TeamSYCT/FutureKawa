import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getAllCountryData } from "../services/countryData";
import { buildOverview } from "../services/consolidation";

export const overviewRouter = Router();

overviewRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const results = await getAllCountryData();
    res.json(buildOverview(results));
  }),
);
