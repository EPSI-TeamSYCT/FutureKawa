import { COUNTRIES, type Country } from "../config";
import { Errors } from "../enums/errors";
import { HttpError } from "../middleware/errorHandler";
import {
  getAllCountryData,
  getCountryData,
  type CountryData,
} from "../services/countryData";

function isCountry(value: string): value is Country {
  return COUNTRIES.some((country) => country === value);
}

export async function resolveData(
  countryQuery: unknown,
): Promise<CountryData[]> {
  if (countryQuery === undefined) {
    return getAllCountryData();
  }
  if (typeof countryQuery !== "string" || !isCountry(countryQuery)) {
    throw new HttpError(400, Errors.UNKNOWN_COUNTRY, String(countryQuery));
  }
  return getCountryData(countryQuery).then((data) => [data]);
}
