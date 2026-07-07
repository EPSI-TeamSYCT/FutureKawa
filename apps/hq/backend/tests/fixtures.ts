import type { Cached } from "../src/lib/cache";
import type { Aggregate } from "../src/services/aggregate";
import type { Alert, Country, Lot } from "../src/types/domain";

export function country(over: Partial<Country> & Pick<Country, "id">): Country {
  return {
    name: "Brazil",
    isoCode: "BR",
    ideal: { temperature: 29, humidity: 55 },
    tolerance: { temperature: 3, humidity: 2 },
    ...over,
  };
}

export function lot(
  over: Partial<Lot> & Pick<Lot, "id" | "storageDate">,
): Lot {
  return {
    reference: `LOT-${over.id}`,
    status: "conforme",
    countryId: 1,
    country: "Brazil",
    exploitationId: 1,
    exploitation: "Fazenda A",
    warehouseId: 1,
    warehouse: "WH-1",
    ...over,
  };
}

export function alert(
  over: Partial<Alert> & Pick<Alert, "id" | "createdAt">,
): Alert {
  return {
    type: "conditions",
    message: "check",
    emailSent: false,
    countryId: 1,
    country: "Brazil",
    warehouseId: 1,
    warehouse: "WH-1",
    batchId: null,
    ...over,
  };
}

export function aggregate(over: Partial<Aggregate> = {}): Aggregate {
  return { countries: [], lots: [], alerts: [], ...over };
}

export function live(data: Aggregate): Cached<Aggregate> {
  return {
    data,
    source: "live",
    stale: false,
    fetchedAt: "2026-07-07T10:00:00.000Z",
  };
}
