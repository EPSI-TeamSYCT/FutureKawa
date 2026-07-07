import type { Cached } from "../lib/cache";
import type { Aggregate, Alert, Country, Lot } from "../types/domain";

export function country(over: Partial<Country> & Pick<Country, "id">): Country {
  return {
    name: "Brazil",
    isoCode: "BR",
    ideal: { temperature: 29, humidity: 55 },
    tolerance: { temperature: 3, humidity: 2 },
    ...over,
  };
}

export function lot(over: Partial<Lot> & Pick<Lot, "id" | "storageDate">): Lot {
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

export function alert(over: Partial<Alert> & Pick<Alert, "id" | "createdAt">): Alert {
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

// Shared scene: two countries, three lots (out of FIFO order), one alert.
export function scene(): Aggregate {
  return aggregate({
    countries: [
      country({ id: 1, name: "Brazil" }),
      country({ id: 2, name: "Colombia", isoCode: "CO" }),
    ],
    lots: [
      lot({ id: 2, storageDate: "2026-03-01T00:00:00.000Z", countryId: 1 }),
      lot({ id: 1, storageDate: "2026-01-01T00:00:00.000Z", countryId: 1 }),
      lot({ id: 3, storageDate: "2026-02-01T00:00:00.000Z", countryId: 2, country: "Colombia" }),
    ],
    alerts: [alert({ id: 5, createdAt: "2026-05-01T00:00:00.000Z", countryId: 2 })],
  });
}

export function live(data: Aggregate): Cached<Aggregate> {
  return {
    data,
    source: "live",
    stale: false,
    fetchedAt: "2026-07-07T10:00:00.000Z",
  };
}
