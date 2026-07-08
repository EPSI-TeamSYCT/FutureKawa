import type { z } from "zod";
import type {
  rawAlertSchema,
  rawBatchSchema,
  rawCountrySchema,
  rawExploitationSchema,
  rawMeasureSchema,
  rawWarehouseSchema,
} from "../schemas/country-api.schema";

// --- Raw shapes: inferred from the country API schemas (the wire contract) ---

export type RawCountry = z.infer<typeof rawCountrySchema>;
export type RawExploitation = z.infer<typeof rawExploitationSchema>;
export type RawWarehouse = z.infer<typeof rawWarehouseSchema>;
export type RawBatch = z.infer<typeof rawBatchSchema>;
export type RawMeasure = z.infer<typeof rawMeasureSchema>;
export type RawAlert = z.infer<typeof rawAlertSchema>;

// --- Normalized DTOs: the clean contract served to the frontend --------------

// Every DTO carries `source`: the code of the sovereign country API it came
// from (e.g. "BRAZIL"). It tags provenance across the merged snapshot and is
// how the measures endpoint routes back to the owning country API.
export interface Country {
  id: number;
  name: string;
  isoCode: string;
  source: string;
  ideal: { temperature: number; humidity: number };
  tolerance: { temperature: number; humidity: number };
}

export interface Lot {
  id: number;
  reference: string;
  storageDate: string;
  status: string;
  source: string;
  countryId: number | null;
  country: string | null;
  exploitationId: number;
  exploitation: string | null;
  warehouseId: number;
  warehouse: string | null;
  // Warehouse id as it exists inside the owning country API (before HQ's
  // global-id offset). Used to fetch this lot's measures from that API.
  localWarehouseId: number;
}

export interface Measure {
  id: number;
  temperature: number | null;
  humidity: number | null;
  measuredAt: string;
}

export interface Alert {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  emailSent: boolean;
  source: string;
  countryId: number | null;
  country: string | null;
  warehouseId: number;
  warehouse: string | null;
  batchId: number | null;
}

// A warehouse enriched with its country's ideal conditions and its lot count
// (bulk-derivable, part of the cached aggregate).
export interface Warehouse {
  id: number;
  name: string;
  source: string;
  countryId: number | null;
  country: string | null;
  isoCode: string | null;
  ideal: { temperature: number; humidity: number } | null;
  tolerance: { temperature: number; humidity: number } | null;
  // Warehouse id as it exists inside the owning country API (before HQ's
  // global-id offset). Used to fetch this warehouse's measures from that API.
  localWarehouseId: number;
  lots: number;
}

// A warehouse plus its live reading (fetched on demand, not cached).
export interface WarehouseStatus extends Warehouse {
  latestMeasure: Measure | null;
  outOfRange: boolean;
}

// Foreign keys resolved once into these lookups, keyed by entity id.
export interface Ref {
  id: number;
  name: string;
  countryId: number;
}

export interface Lookups {
  countries: Map<number, Country>;
  exploitations: Map<number, Ref>;
  warehouses: Map<number, Ref>;
}

// The consolidated view of all countries, built once and cached.
export interface Aggregate {
  countries: Country[];
  warehouses: Warehouse[];
  lots: Lot[];
  alerts: Alert[];
}
