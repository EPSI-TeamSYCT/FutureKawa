import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { getAggregate } from "../services/aggregate";
import { selectAlerts } from "../services/views";
import { assertCountry, parseIntParam } from "./helpers";

export const alertsRouter = Router();

alertsRouter.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    const countryId = parseIntParam(req.query.country);
    const { data, ...meta } = await getAggregate();
    assertCountry(data, countryId);
    res.json({ alerts: selectAlerts(data, countryId), meta });
  }),
);
