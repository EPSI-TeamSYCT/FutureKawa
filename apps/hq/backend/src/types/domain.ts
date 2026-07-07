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

export interface Country {
  id: number;
  name: string;
  isoCode: string;
  ideal: { temperature: number; humidity: number };
  tolerance: { temperature: number; humidity: number };
}

export interface Lot {
  id: number;
  reference: string;
  storageDate: string;
  status: string;
  countryId: number | null;
  country: string | null;
  exploitationId: number;
  exploitation: string | null;
  warehouseId: number;
  warehouse: string | null;
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
  countryId: number | null;
  country: string | null;
  warehouseId: number;
  warehouse: string | null;
  batchId: number | null;
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
  lots: Lot[];
  alerts: Alert[];
}
