import type { Country } from "../src/config";
import type { Alert, Lot, Measure } from "../src/types/domain";
import type { CountryData, Freshness } from "../src/services/countryData";

export function lot(
  over: Partial<Lot> & Pick<Lot, "id" | "country" | "storageDate">,
): Lot {
  return {
    exploitation: "Fazenda A",
    warehouse: "WH-1",
    status: "conforme",
    ...over,
  };
}

export function measure(
  over: Partial<Measure> & Pick<Measure, "id" | "warehouse" | "timestamp">,
): Measure {
  return { temperature: 20, humidity: 55, ...over };
}

export function alert(
  over: Partial<Alert> & Pick<Alert, "id" | "country" | "timestamp">,
): Alert {
  return { type: "conditions", message: "check", ...over };
}

export function live(
  country: Country,
  payload: CountryData["payload"],
  fetchedAt = "2026-07-06T10:00:00.000Z",
): CountryData {
  const freshness: Freshness = {
    country,
    source: "live",
    stale: false,
    fetchedAt,
  };
  return { country, payload, freshness };
}

export function unavailable(country: Country): CountryData {
  return {
    country,
    payload: null,
    freshness: { country, source: "unavailable", stale: true, fetchedAt: null },
  };
}
