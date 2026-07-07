import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getAggregate } from "../services/aggregate.service";
import { summarizeCountries } from "../services/views.service";

export const countriesRouter = Router();

countriesRouter.get(
  "/countries",
  asyncHandler(async (_req, res) => {
    const { data, ...meta } = await getAggregate();
    res.json({ countries: summarizeCountries(data), meta });
  }),
);
