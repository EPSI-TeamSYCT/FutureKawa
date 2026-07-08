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
} from "../types/domain";

// Pure transformations: raw country-API shapes (IRIs, wire format) into the
// normalized DTOs served to the frontend. No I/O.
//
// Each sovereign country API owns an independent id space (all three start at
// 1), so ids collide once the snapshots are merged. To keep every DTO id
// globally unique HQ offsets emitted ids by a per-country `offset`. IRIs and
// lookups stay keyed by the *local* id (that is what the wire references); the
// offset is applied only when an id is written onto an outgoing DTO.

// Extract the trailing numeric id from an API Platform IRI ("/api/countries/1").
export function iriId(iri: string): number {
  const id = Number(iri.split("/").pop());
  if (!Number.isInteger(id)) throw new Error(`Invalid IRI: ${iri}`);
  return id;
}

export function toCountry(raw: RawCountry, source: string, offset = 0): Country {
  return {
    id: raw.id + offset,
    name: raw.name,
    isoCode: raw.isoCode,
    source,
    ideal: { temperature: raw.idealTemp, humidity: raw.idealHumidity },
    tolerance: {
      temperature: raw.toleranceTemp,
      humidity: raw.toleranceHumidity,
    },
  };
}

// Refs keep their *local* id and local countryId: lookups are keyed by the
// local id the country-API IRIs point to.
export function toRef(raw: RawExploitation | RawWarehouse): Ref {
  return { id: raw.id, name: raw.name, countryId: iriId(raw.country) };
}

// Resolve a warehouse IRI to its warehouse and (via it) its country. Both are
// what ties a stored lot or an alert to a country. `country.id` is already the
// offset (global) id — the country lookup holds mapped Country DTOs.
function locate(lk: Lookups, warehouseIri: string) {
  const warehouseId = iriId(warehouseIri);
  const warehouse = lk.warehouses.get(warehouseId);
  const country = warehouse ? lk.countries.get(warehouse.countryId) : undefined;
  return { warehouseId, warehouse, country };
}

// A lot's country is where it is physically stored (its warehouse), which is
// what the IoT sensors monitor.
export function toLot(raw: RawBatch, lk: Lookups, source: string, offset = 0): Lot {
  const exploitationId = iriId(raw.exploitation);
  const { warehouseId, warehouse, country } = locate(lk, raw.warehouse);
  return {
    id: raw.id + offset,
    reference: raw.ref,
    storageDate: raw.storageDate,
    status: raw.status,
    source,
    countryId: country ? country.id : null,
    country: country?.name ?? null,
    exploitationId: exploitationId + offset,
    exploitation: lk.exploitations.get(exploitationId)?.name ?? null,
    warehouseId: warehouseId + offset,
    warehouse: warehouse?.name ?? null,
    localWarehouseId: warehouseId,
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

export function toAlert(raw: RawAlert, lk: Lookups, source: string, offset = 0): Alert {
  const { warehouseId, warehouse, country } = locate(lk, raw.warehouse);
  return {
    id: raw.id + offset,
    type: raw.type,
    message: raw.message,
    createdAt: raw.createdAt,
    emailSent: raw.emailSent,
    source,
    countryId: country ? country.id : null,
    country: country?.name ?? null,
    warehouseId: warehouseId + offset,
    warehouse: warehouse?.name ?? null,
    batchId: raw.batch ? iriId(raw.batch) + offset : null,
  };
}
