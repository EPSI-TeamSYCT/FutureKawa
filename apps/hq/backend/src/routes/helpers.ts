import { Errors } from "../enums/errors";
import { HttpError } from "../middleware/errorHandler";
import type { Aggregate } from "../services/aggregate";

export function parseIntParam(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, Errors.INVALID_PARAM);
  }
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw new HttpError(400, Errors.INVALID_PARAM, value);
  }
  return n;
}

export function assertCountry(agg: Aggregate, countryId?: number): void {
  if (countryId === undefined) return;
  if (!agg.countries.some((c) => c.id === countryId)) {
    throw new HttpError(400, Errors.UNKNOWN_COUNTRY, String(countryId));
  }
}
