import type { Country } from "../config";
import type { Alert, Lot, Measure } from "../types/domain";
import type { CountryData, Freshness } from "./countryData";

export interface Consolidated<T> {
  data: T;
  meta: Freshness[];
}

function meta(results: CountryData[]): Freshness[] {
  return results.map((r) => r.freshness);
}

function flatten<T>(
  results: CountryData[],
  pick: (p: NonNullable<CountryData["payload"]>) => T[],
): T[] {
  return results.flatMap((r) => (r.payload ? pick(r.payload) : []));
}

// Lots fusionnés puis triés par storageDate croissant.
export function consolidateLots(results: CountryData[]): Consolidated<Lot[]> {
  const lots = flatten(results, (p) => p.lots).sort(
    (a, b) => Date.parse(a.storageDate) - Date.parse(b.storageDate),
  );
  return { data: lots, meta: meta(results) };
}

export function consolidateAlerts(
  results: CountryData[],
): Consolidated<Alert[]> {
  const alerts = flatten(results, (p) => p.alerts).sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );
  return { data: alerts, meta: meta(results) };
}

export function findLot(results: CountryData[], lotId: string): Lot | null {
  return (
    flatten(results, (p) => p.lots).find((lot) => lot.id === lotId) ?? null
  );
}

// Mesures d'un entrepôt donné, triées par timestamp croissant (pour tracer des courbes).
export function measuresForWarehouse(
  results: CountryData[],
  warehouse: string,
): Measure[] {
  return flatten(results, (p) => p.measures)
    .filter((m) => m.warehouse === warehouse)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export interface CountryState {
  country: Country;
  source: Freshness["source"];
  stale: boolean;
  fetchedAt: string | null;
  lots: number;
  alerts: number;
}

export function countryStates(results: CountryData[]): CountryState[] {
  return results.map((r) => ({
    country: r.freshness.country,
    source: r.freshness.source,
    stale: r.freshness.stale,
    fetchedAt: r.freshness.fetchedAt,
    lots: r.payload?.lots.length ?? 0,
    alerts: r.payload?.alerts.length ?? 0,
  }));
}

export interface Overview {
  countries: CountryState[];
  totals: {
    lots: number;
    alerts: number;
    lotsByStatus: Record<Lot["status"], number>;
    countriesLive: number;
    countriesStale: number;
    countriesUnavailable: number;
  };
}

export function buildOverview(results: CountryData[]): Overview {
  const countries = countryStates(results);
  const lots = flatten(results, (p) => p.lots);
  const alerts = flatten(results, (p) => p.alerts);

  const lotsByStatus: Overview["totals"]["lotsByStatus"] = {
    conforme: 0,
    en_alerte: 0,
    perime: 0,
  };
  for (const lot of lots) lotsByStatus[lot.status]++;

  return {
    countries,
    totals: {
      lots: lots.length,
      alerts: alerts.length,
      lotsByStatus,
      countriesLive: countries.filter((c) => c.source === "live").length,
      countriesStale: countries.filter((c) => c.stale && c.source === "cache")
        .length,
      countriesUnavailable: countries.filter((c) => c.source === "unavailable")
        .length,
    },
  };
}
