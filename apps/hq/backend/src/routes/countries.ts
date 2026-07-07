import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getAllCountryData } from "../services/countryData";
import { countryStates } from "../services/consolidation";

export const countriesRouter = Router();

countriesRouter.get(
  "/countries",
  asyncHandler(async (_req, res) => {
    const results = await getAllCountryData();
    res.json({ countries: countryStates(results) });
  }),
);
