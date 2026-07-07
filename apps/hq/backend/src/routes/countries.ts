import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getAggregate } from "../services/aggregate";
import { summarizeCountries } from "../services/views";

export const countriesRouter = Router();

countriesRouter.get(
  "/countries",
  asyncHandler(async (_req, res) => {
    const { data, ...meta } = await getAggregate();
    res.json({ countries: summarizeCountries(data), meta });
  }),
);
