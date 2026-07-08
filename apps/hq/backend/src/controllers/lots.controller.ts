import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { Errors } from "../types/errors.enum";
import { HttpError } from "../middleware/errorHandler";
import { getAggregate, getWarehouseMeasures } from "../services/aggregate.service";
import { findLot, selectLots } from "../services/views.service";
import { assertCountry, parseIntParam } from "./helpers";

export const lotsRouter = Router();

lotsRouter.get(
  "/lots",
  asyncHandler(async (req, res) => {
    const countryId = parseIntParam(req.query.country);
    const exploitationId = parseIntParam(req.query.exploitation);
    const { data, meta } = await getAggregate();
    assertCountry(data, countryId);
    res.json({ lots: selectLots(data, { countryId, exploitationId }), meta });
  }),
);

lotsRouter.get(
  "/lots/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id)!;
    const { data } = await getAggregate();
    const lot = findLot(data, id);
    if (!lot) throw new HttpError(404, Errors.LOT_NOT_FOUND, String(id));
    res.json({ lot });
  }),
);

lotsRouter.get(
  "/lots/:id/measures",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id)!;
    const { data } = await getAggregate();
    const lot = findLot(data, id);
    if (!lot) throw new HttpError(404, Errors.LOT_NOT_FOUND, String(id));
    res.json({
      lotId: lot.id,
      reference: lot.reference,
      warehouse: lot.warehouse,
      measures: await getWarehouseMeasures(lot.source, lot.localWarehouseId),
    });
  }),
);
