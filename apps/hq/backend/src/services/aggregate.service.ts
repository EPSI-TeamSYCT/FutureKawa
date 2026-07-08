import { countryClient } from "../adapters/country-api.adapter";
import { config } from "../config";
import { FallbackCache, type Cached } from "../lib/cache";
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
import type {
  Aggregate,
  Lookups,
  Measure,
  Warehouse,
  WarehouseStatus,
} from "../types/domain";

function mapById<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function countLotsByWarehouse(batches: { warehouse: string }[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const b of batches) {
    const id = iriId(b.warehouse);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

// Fetch reference data + batches + alerts in parallel, then normalize the
// relational shapes into the flat DTOs the frontend consumes.
async function loadAggregate(): Promise<Aggregate> {
  const [countries, exploitations, warehouses, batches, alerts] = await Promise.all([
    countryClient.fetchCountries(),
    countryClient.fetchExploitations(),
    countryClient.fetchWarehouses(),
    countryClient.fetchBatches(),
    countryClient.fetchAlerts(),
  ]);

  const lookups: Lookups = {
    countries: mapById(countries.map(toCountry)),
    exploitations: mapById(exploitations.map(toRef)),
    warehouses: mapById(warehouses.map(toRef)),
  };
  const lotsByWarehouse = countLotsByWarehouse(batches);

  return {
    countries: [...lookups.countries.values()],
    warehouses: warehouses.map((w) =>
      toWarehouse(w, lookups.countries, lotsByWarehouse.get(w.id) ?? 0),
    ),
    lots: batches.map((b) => toLot(b, lookups)),
    alerts: alerts.map((a) => toAlert(a, lookups)),
  };
}

const cache = new FallbackCache(loadAggregate, config.cacheStaleMs);

export function getAggregate(): Promise<Cached<Aggregate>> {
  return cache.get();
}

// A lot's readings are the measures of the warehouse it is stored in, fetched
// on demand (not cached with the bulk snapshot). Sorted ascending so the
// frontend can plot them as time series.
export async function getWarehouseMeasures(warehouseId: number): Promise<Measure[]> {
  const measures = await countryClient.fetchWarehouseMeasures(warehouseId);
  return measures
    .map(toMeasure)
    .sort((a, b) => Date.parse(a.measuredAt) - Date.parse(b.measuredAt));
}

async function enrichWarehouse(w: Warehouse): Promise<WarehouseStatus> {
  const measures = await getWarehouseMeasures(w.id);
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
