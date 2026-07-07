import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { Errors } from "../enums/errors";
import { HttpError } from "../middleware/errorHandler";
import { getAllCountryData } from "../services/countryData";
import { consolidateLots, findLot, measuresForWarehouse } from "../services/consolidation";
import { resolveData } from "./helpers";

export const lotsRouter = Router();

lotsRouter.get(
  "/lots",
  asyncHandler(async (req, res) => {
    const results = await resolveData(req.query.country);
    const { data, meta } = consolidateLots(results);
    res.json({ lots: data, meta });
  }),
);

lotsRouter.get(
  "/lots/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const results = await getAllCountryData();
    const lot = id ? findLot(results, id) : null;
    if (!lot) throw new HttpError(404, Errors.LOT_NOT_FOUND, id ?? "");
    res.json({ lot });
  }),
);

lotsRouter.get(
  "/lots/:id/measures",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const results = await getAllCountryData();
    const lot = id ? findLot(results, id) : null;
    if (!lot) throw new HttpError(404, Errors.LOT_NOT_FOUND, id ?? "");
    res.json({ lotId: lot.id, warehouse: lot.warehouse, measures: measuresForWarehouse(results, lot.warehouse) });
  }),
);
