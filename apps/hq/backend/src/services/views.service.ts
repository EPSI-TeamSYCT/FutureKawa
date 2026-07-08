import type { Aggregate, Alert, Lot } from "../types/domain";
import type { CountrySummary, LotFilter, Overview } from "../types/views";

// Lots sorted by storage date ascending: oldest first, to drive FIFO shipping.
export function selectLots(agg: Aggregate, filter: LotFilter = {}): Lot[] {
  return agg.lots
    .filter(
      (lot) =>
        (filter.countryId === undefined || lot.countryId === filter.countryId) &&
        (filter.exploitationId === undefined || lot.exploitationId === filter.exploitationId),
    )
    .sort((a, b) => Date.parse(a.storageDate) - Date.parse(b.storageDate));
}

export function findLot(agg: Aggregate, id: number): Lot | null {
  return agg.lots.find((lot) => lot.id === id) ?? null;
}

// Alerts most recent first, optionally scoped to a country.
export function selectAlerts(agg: Aggregate, countryId?: number): Alert[] {
  return agg.alerts
    .filter((a) => countryId === undefined || a.countryId === countryId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function countBy<T>(items: T[], key: (item: T) => number | null): Map<number, number> {
  const counts = new Map<number, number>();
  for (const item of items) {
    const id = key(item);
    if (id !== null) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

// Countries enriched with their lot/alert counts, for the selector and dashboard.
export function summarizeCountries(agg: Aggregate): CountrySummary[] {
  const lots = countBy(agg.lots, (l) => l.countryId);
  const alerts = countBy(agg.alerts, (a) => a.countryId);
  return agg.countries.map((country) => ({
    ...country,
    lots: lots.get(country.id) ?? 0,
    alerts: alerts.get(country.id) ?? 0,
  }));
}

export function buildOverview(agg: Aggregate): Overview {
  const lotsByStatus: Record<string, number> = {};
  for (const lot of agg.lots) {
    lotsByStatus[lot.status] = (lotsByStatus[lot.status] ?? 0) + 1;
  }
  return {
    countries: agg.countries.length,
    lots: agg.lots.length,
    alerts: agg.alerts.length,
    lotsByStatus,
  };
}
