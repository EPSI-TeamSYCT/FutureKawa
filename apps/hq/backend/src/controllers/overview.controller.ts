import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getAggregate } from "../services/aggregate.service";
import { buildOverview } from "../services/views.service";

export const overviewRouter = Router();

overviewRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const { data, meta } = await getAggregate();
    res.json({ ...buildOverview(data), meta });
  }),
);
