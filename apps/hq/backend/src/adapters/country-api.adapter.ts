import axios, { type AxiosInstance } from "axios";
import { z } from "zod";
import { config } from "../config";
import {
  rawAlertSchema,
  rawBatchSchema,
  rawCountrySchema,
  rawExploitationSchema,
  rawMeasureSchema,
  rawWarehouseSchema,
} from "../schemas/country-api.schema";
import type {
  RawAlert,
  RawBatch,
  RawCountry,
  RawExploitation,
  RawMeasure,
  RawWarehouse,
} from "../types/domain";

// The thin HTTP gateway to one sovereign country API. Every method `fetch*`
// hits the API and returns raw (unnormalized) shapes; normalization happens in
// the mappers one layer up.
export interface CountryClient {
  fetchCountries: () => Promise<RawCountry[]>;
  fetchExploitations: () => Promise<RawExploitation[]>;
  fetchWarehouses: () => Promise<RawWarehouse[]>;
  fetchBatches: () => Promise<RawBatch[]>;
  fetchAlerts: () => Promise<RawAlert[]>;
  fetchWarehouseMeasures: (warehouseId: number) => Promise<RawMeasure[]>;
}

// Build an HTTP client for one country API. `Accept: application/json` asks for
// plain arrays instead of the JSON-LD/Hydra envelope; the shared API key
// authenticates every call. One client per country lets HQ fan out across the
// three sovereign APIs (each with its own base URL) in parallel.
export function createCountryClient(baseURL: string): CountryClient {
  const http: AxiosInstance = axios.create({
    baseURL,
    timeout: config.countryTimeoutMs,
    headers: {
      "X-API-KEY": config.countryApiKey,
      Accept: "application/json",
    },
  });

  async function getList<T>(
    path: string,
    schema: z.ZodType<T>,
    params?: Record<string, unknown>,
  ): Promise<T[]> {
    const { data } = await http.get(path, { params });
    return z.array(schema).parse(data);
  }

  return {
    fetchCountries: () => getList("/api/countries", rawCountrySchema),
    fetchExploitations: () => getList("/api/exploitations", rawExploitationSchema),
    fetchWarehouses: () => getList("/api/warehouses", rawWarehouseSchema),
    fetchBatches: () => getList("/api/batches", rawBatchSchema),
    fetchAlerts: () => getList("/api/alerts", rawAlertSchema),
    fetchWarehouseMeasures: (warehouseId: number) =>
      // The API returns measures newest-first; charts want them chronological,
      // so reverse. `sensor.warehouse` scopes them to this warehouse.
      getList("/api/measures", rawMeasureSchema, {
        "sensor.warehouse": warehouseId,
      }).then((measures) => measures.reverse()),
  };
}

// One client per configured country, keyed by the country code. The aggregate
// service fans out over these.
export const countryClients: ReadonlyMap<string, CountryClient> = new Map(
  config.countries.map((c) => [c.code, createCountryClient(c.url)]),
);
