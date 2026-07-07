import { countryClient } from "../adapters/country-api.adapter";
import { config } from "../config";
import { FallbackCache, type Cached } from "../lib/cache";
import { toAlert, toCountry, toLot, toMeasure, toRef } from "../mappers/domain.mapper";
import type { Aggregate, Lookups, Measure } from "../types/domain";

function mapById<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
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

  return {
    countries: [...lookups.countries.values()],
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
