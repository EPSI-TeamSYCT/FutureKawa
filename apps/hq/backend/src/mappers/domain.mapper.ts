import type {
  Alert,
  Country,
  Lookups,
  Lot,
  Measure,
  RawAlert,
  RawBatch,
  RawCountry,
  RawExploitation,
  RawMeasure,
  RawWarehouse,
  Ref,
  Warehouse,
} from "../types/domain";

// Pure transformations: raw country-API shapes (IRIs, wire format) into the
// normalized DTOs served to the frontend. No I/O.

// Extract the trailing numeric id from an API Platform IRI ("/api/countries/1").
export function iriId(iri: string): number {
  const id = Number(iri.split("/").pop());
  if (!Number.isInteger(id)) throw new Error(`Invalid IRI: ${iri}`);
  return id;
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

// A warehouse enriched with its country's conditions and its lot count.
export function toWarehouse(
  raw: RawWarehouse,
  countries: Map<number, Country>,
  lots: number,
): Warehouse {
  const country = countries.get(iriId(raw.country));
  return {
    id: raw.id,
    name: raw.name,
    countryId: country?.id ?? null,
    country: country?.name ?? null,
    isoCode: country?.isoCode ?? null,
    ideal: country?.ideal ?? null,
    tolerance: country?.tolerance ?? null,
    lots,
  };
}

// A reading drifts when temperature OR humidity leaves the country's ideal band.
export function isOutOfRange(
  m: Measure,
  ideal: Country["ideal"] | null,
  tolerance: Country["tolerance"] | null,
): boolean {
  if (!ideal || !tolerance) return false;
  const tempOut =
    m.temperature != null && Math.abs(m.temperature - ideal.temperature) > tolerance.temperature;
  const humidityOut =
    m.humidity != null && Math.abs(m.humidity - ideal.humidity) > tolerance.humidity;
  return tempOut || humidityOut;
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
