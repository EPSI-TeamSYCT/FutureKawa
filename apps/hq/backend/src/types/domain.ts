import { z } from "zod";

// The country API is API Platform (Symfony): fields are camelCase and relations
// are IRIs like "/api/countries/1". These raw schemas are the ONLY place
// coupled to that wire format; unknown keys (IRI arrays we don't need) are
// stripped by zod, so we declare just what HQ consumes.

// Extract the trailing numeric id from an API Platform IRI ("/api/countries/1").
export function iriId(iri: string): number {
  const id = Number(iri.split("/").pop());
  if (!Number.isInteger(id)) throw new Error(`Invalid IRI: ${iri}`);
  return id;
}

// --- Raw shapes: the integration contract with the country API ---------------

export const rawCountrySchema = z.object({
  id: z.number(),
  name: z.string(),
  isoCode: z.string(),
  idealTemp: z.number(),
  idealHumidity: z.number(),
  toleranceTemp: z.number(),
  toleranceHumidity: z.number(),
});

export const rawExploitationSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
});

export const rawWarehouseSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
});

export const rawBatchSchema = z.object({
  id: z.number(),
  ref: z.string(),
  storageDate: z.string(),
  status: z.string(),
  exploitation: z.string(),
  warehouse: z.string(),
});

export const rawMeasureSchema = z.object({
  id: z.number(),
  temperature: z.number().nullable(),
  humidity: z.number().nullable(),
  measuredAt: z.string(),
});

export const rawAlertSchema = z.object({
  id: z.number(),
  type: z.string(),
  message: z.string(),
  createdAt: z.string(),
  emailSent: z.boolean(),
  warehouse: z.string(),
  batch: z.string().nullable(),
});

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

export function toCountry(raw: RawCountry): Country {
  return {
    id: raw.id,
    name: raw.name,
    isoCode: raw.isoCode,
    ideal: { temperature: raw.idealTemp, humidity: raw.idealHumidity },
    tolerance: {
      temperature: raw.toleranceTemp,
      humidity: raw.toleranceHumidity,
    },
  };
}

export function toRef(raw: RawExploitation | RawWarehouse): Ref {
  return { id: raw.id, name: raw.name, countryId: iriId(raw.country) };
}

// Resolve a warehouse IRI to its warehouse and (via it) its country. Both are
// what ties a stored lot or an alert to a country.
function locate(lk: Lookups, warehouseIri: string) {
  const warehouseId = iriId(warehouseIri);
  const warehouse = lk.warehouses.get(warehouseId);
  const country = warehouse ? lk.countries.get(warehouse.countryId) : undefined;
  return { warehouseId, warehouse, country };
}

// A lot's country is where it is physically stored (its warehouse), which is
// what the IoT sensors monitor.
export function toLot(raw: RawBatch, lk: Lookups): Lot {
  const exploitationId = iriId(raw.exploitation);
  const { warehouseId, warehouse, country } = locate(lk, raw.warehouse);
  return {
    id: raw.id,
    reference: raw.ref,
    storageDate: raw.storageDate,
    status: raw.status,
    countryId: country?.id ?? null,
    country: country?.name ?? null,
    exploitationId,
    exploitation: lk.exploitations.get(exploitationId)?.name ?? null,
    warehouseId,
    warehouse: warehouse?.name ?? null,
  };
}

export function toMeasure(raw: RawMeasure): Measure {
  return {
    id: raw.id,
    temperature: raw.temperature,
    humidity: raw.humidity,
    measuredAt: raw.measuredAt,
  };
}

export function toAlert(raw: RawAlert, lk: Lookups): Alert {
  const { warehouseId, warehouse, country } = locate(lk, raw.warehouse);
  return {
    id: raw.id,
    type: raw.type,
    message: raw.message,
    createdAt: raw.createdAt,
    emailSent: raw.emailSent,
    countryId: country?.id ?? null,
    country: country?.name ?? null,
    warehouseId,
    warehouse: warehouse?.name ?? null,
    batchId: raw.batch ? iriId(raw.batch) : null,
  };
}
