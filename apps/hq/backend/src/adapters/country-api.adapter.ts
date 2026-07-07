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

// Single shared HTTP client for the API Platform country API. `Accept:
// application/json` asks for plain arrays instead of the JSON-LD/Hydra
// envelope; the shared API key authenticates every call.
const http: AxiosInstance = axios.create({
  baseURL: config.countryApiUrl,
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

// Thin HTTP layer: every method `fetch*` hits the country API and returns raw
// (unnormalized) shapes. Normalization happens in the mappers, one layer up.
export const countryClient = {
  fetchCountries: (): Promise<RawCountry[]> => getList("/api/countries", rawCountrySchema),
  fetchExploitations: (): Promise<RawExploitation[]> =>
    getList("/api/exploitations", rawExploitationSchema),
  fetchWarehouses: (): Promise<RawWarehouse[]> => getList("/api/warehouses", rawWarehouseSchema),
  fetchBatches: (): Promise<RawBatch[]> => getList("/api/batches", rawBatchSchema),
  fetchAlerts: (): Promise<RawAlert[]> => getList("/api/alerts", rawAlertSchema),
  fetchWarehouseMeasures: (warehouseId: number): Promise<RawMeasure[]> =>
    getList("/api/measures", rawMeasureSchema, {
      "sensor.warehouse": warehouseId,
    }),
};
