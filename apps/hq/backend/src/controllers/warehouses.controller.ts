import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { Errors } from "../types/errors.enum";
import { HttpError } from "../middleware/errorHandler";
import {
  enrichWarehouses,
  getAggregate,
  getWarehouseMeasures,
} from "../services/aggregate.service";
import { assertCountry, parseIntParam } from "./helpers";

export const warehousesRouter = Router();

warehousesRouter.get(
  "/warehouses",
  asyncHandler(async (req, res) => {
    const countryId = parseIntParam(req.query.country);
    const { data, ...meta } = await getAggregate();
    assertCountry(data, countryId);
    const list =
      countryId !== undefined
        ? data.warehouses.filter((w) => w.countryId === countryId)
        : data.warehouses;
    res.json({ warehouses: await enrichWarehouses(list), meta });
  }),
);

warehousesRouter.get(
  "/warehouses/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id)!;
    const { data } = await getAggregate();
    const warehouse = data.warehouses.find((w) => w.id === id);
    if (!warehouse) throw new HttpError(404, Errors.WAREHOUSE_NOT_FOUND, String(id));
    const [status] = await enrichWarehouses([warehouse]);
    res.json({ warehouse: status });
  }),
);

warehousesRouter.get(
  "/warehouses/:id/measures",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id)!;
    res.json({ warehouseId: id, measures: await getWarehouseMeasures(id) });
  }),
);
