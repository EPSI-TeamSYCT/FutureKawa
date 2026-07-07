import axios from "axios";
import { config, type Country } from "../config";
import {
  alertsResponseSchema,
  lotsResponseSchema,
  measuresResponseSchema,
  type CountryPayload,
} from "../types/domain";

export async function fetchCountry(country: Country): Promise<CountryPayload> {
  const baseURL = config.countryUrls[country];
  const http = axios.create({ baseURL, timeout: config.countryTimeoutMs });

  const [lots, measures, alerts] = await Promise.all([
    http.get("/lots").then((r) => lotsResponseSchema.parse(r.data)),
    http.get("/measures").then((r) => measuresResponseSchema.parse(r.data)),
    http.get("/alerts").then((r) => alertsResponseSchema.parse(r.data)),
  ]);

  return { lots, measures, alerts };
}
