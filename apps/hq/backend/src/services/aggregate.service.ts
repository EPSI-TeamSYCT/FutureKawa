import { countryClients, type CountryClient } from "../adapters/country-api.adapter";
import { config, type CountryEndpoint } from "../config";
import { FallbackCache, summarizeMeta, type CountryMeta, type Meta } from "../lib/cache";
import { logger } from "../lib/logger";
import {
  iriId,
  isOutOfRange,
  toAlert,
  toCountry,
  toLot,
  toMeasure,
  toRef,
  toWarehouse,
} from "../mappers/domain.mapper";
import type { Aggregate, Lookups, Measure, Warehouse, WarehouseStatus } from "../types/domain";

// Per-country id offset. Each sovereign country API owns an independent id
// space (all three start at 1), so ids collide once merged. Multiplying the
// country's slot index by this large base keeps every emitted DTO id globally
// unique while staying well within safe-integer range.
const ID_OFFSET = 1_000_000;

// The merged snapshot plus the per-country freshness that produced it.
export interface AggregateResult {
  data: Aggregate;
  meta: Meta;
}

function mapByLocalId<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}

// Count how many batches each warehouse holds, keyed by the warehouse's *local*
// id (the id the batch IRIs reference, before HQ's global offset).
function countLotsByWarehouse(batches: { warehouse: string }[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const b of batches) {
    const id = iriId(b.warehouse);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

// Fetch one country's reference data + batches + alerts in parallel, then
// normalize the relational shapes into flat DTOs, offsetting ids so they stay
// unique across the merged set and tagging every entity with its source.
function loadCountryAggregate(client: CountryClient, source: string, offset: number) {
  return async (): Promise<Aggregate> => {
    const [countries, exploitations, warehouses, batches, alerts] = await Promise.all([
      client.fetchCountries(),
      client.fetchExploitations(),
      client.fetchWarehouses(),
      client.fetchBatches(),
      client.fetchAlerts(),
    ]);

    // Lookups are keyed by the *local* id the IRIs reference; countries hold the
    // already-offset Country DTOs so resolved ids come out global.
    const lookups: Lookups = {
      countries: new Map(countries.map((c) => [c.id, toCountry(c, source, offset)])),
      exploitations: mapByLocalId(exploitations.map(toRef)),
      warehouses: mapByLocalId(warehouses.map(toRef)),
    };
    const lotsByWarehouse = countLotsByWarehouse(batches);

    return {
      countries: [...lookups.countries.values()],
      warehouses: warehouses.map((w) =>
        toWarehouse(w, lookups.countries, lotsByWarehouse.get(w.id) ?? 0, source, offset),
      ),
      lots: batches.map((b) => toLot(b, lookups, source, offset)),
      alerts: alerts.map((a) => toAlert(a, lookups, source, offset)),
    };
  };
}

interface CountrySlot {
  endpoint: CountryEndpoint;
  offset: number;
  cache: FallbackCache<Aggregate>;
}

// One fallback cache per country, so a single failing API degrades to *its*
// last-known-good snapshot without dragging the others down.
const slots: CountrySlot[] = config.countries.map((endpoint, index) => {
  const client = countryClients.get(endpoint.code);
  if (!client) throw new Error(`No client configured for country ${endpoint.code}`);
  const offset = index * ID_OFFSET;
  return {
    endpoint,
    offset,
    cache: new FallbackCache(
      loadCountryAggregate(client, endpoint.code, offset),
      config.cacheStaleMs,
    ),
  };
});

const EMPTY: Aggregate = { countries: [], warehouses: [], lots: [], alerts: [] };

function merge(parts: Aggregate[]): Aggregate {
  return {
    countries: parts.flatMap((p) => p.countries),
    warehouses: parts.flatMap((p) => p.warehouses),
    lots: parts.flatMap((p) => p.lots),
    alerts: parts.flatMap((p) => p.alerts),
  };
}

// Fan out to every configured country API in parallel and merge the results.
// A country that has no cached snapshot at all (never answered) contributes an
// empty slice and is flagged in its per-country meta, without failing the whole
// response.
export async function getAggregate(): Promise<AggregateResult> {
  const results = await Promise.all(
    slots.map(async (slot) => {
      try {
        const cached = await slot.cache.get();
        const meta: CountryMeta = {
          code: slot.endpoint.code,
          source: cached.source,
          stale: cached.stale,
          fetchedAt: cached.fetchedAt,
        };
        return { data: cached.data, meta };
      } catch (err) {
        // No live data and no cache for this country: degrade the slice to
        // empty and flag it stale so the merged response still succeeds.
        logger.warn(
          { err, country: slot.endpoint.code },
          "country API has no snapshot, serving empty slice",
        );
        const meta: CountryMeta = {
          code: slot.endpoint.code,
          source: "cache",
          stale: true,
          fetchedAt: new Date(0).toISOString(),
        };
        return { data: EMPTY, meta };
      }
    }),
  );

  return {
    data: merge(results.map((r) => r.data)),
    meta: summarizeMeta(results.map((r) => r.meta)),
  };
}

// A warehouse's readings are fetched on demand (not cached with the bulk
// snapshot). The caller passes the owning country `source` and the
// `localWarehouseId` (the id as it exists inside that country API, before HQ's
// global offset), so we route the call to the right country API. Both a lot
// (via its stored warehouse) and a warehouse carry these. Sorted ascending so
// the frontend can plot them as a time series.
export async function getWarehouseMeasures(
  source: string,
  localWarehouseId: number,
): Promise<Measure[]> {
  const client = countryClients.get(source);
  if (!client) throw new Error(`No client configured for country ${source}`);
  const measures = await client.fetchWarehouseMeasures(localWarehouseId);
  return measures
    .map(toMeasure)
    .sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt));
}

// Enrich a warehouse with its latest reading and an out-of-range flag, routing
// the measures fetch to the warehouse's owning country via its `source` and
// local id.
async function enrichWarehouse(w: Warehouse): Promise<WarehouseStatus> {
  const measures = await getWarehouseMeasures(w.source, w.localWarehouseId);
  const latestMeasure = measures.length ? measures[measures.length - 1]! : null;
  return {
    ...w,
    latestMeasure,
    outOfRange: latestMeasure ? isOutOfRange(latestMeasure, w.ideal, w.tolerance) : false,
  };
}

export function enrichWarehouses(warehouses: Warehouse[]): Promise<WarehouseStatus[]> {
  return Promise.all(warehouses.map(enrichWarehouse));
}
