import { describe, expect, it } from "vitest";
import {
  buildOverview,
  findLot,
  selectAlerts,
  selectLots,
  summarizeCountries,
} from "../src/services/views";
import { aggregate, alert, country, lot } from "./fixtures";

const scene = aggregate({
  countries: [
    country({ id: 1, name: "Brazil", isoCode: "BR" }),
    country({ id: 2, name: "Colombia", isoCode: "CO" }),
  ],
  lots: [
    lot({ id: 2, storageDate: "2026-03-01T00:00:00.000Z", countryId: 1 }),
    lot({ id: 1, storageDate: "2026-01-01T00:00:00.000Z", countryId: 1 }),
    lot({ id: 3, storageDate: "2026-02-01T00:00:00.000Z", countryId: 2, country: "Colombia" }),
  ],
  alerts: [
    alert({ id: 10, createdAt: "2026-01-01T00:00:00.000Z", countryId: 1 }),
    alert({ id: 11, createdAt: "2026-05-01T00:00:00.000Z", countryId: 2 }),
  ],
});

describe("selectLots", () => {
  it("sorts by storage date ascending (FIFO)", () => {
    expect(selectLots(scene).map((l) => l.id)).toEqual([1, 3, 2]);
  });

  it("filters by country", () => {
    expect(selectLots(scene, { countryId: 1 }).map((l) => l.id)).toEqual([1, 2]);
  });
});

describe("selectAlerts", () => {
  it("sorts most recent first, filtered by country", () => {
    expect(selectAlerts(scene, 2).map((a) => a.id)).toEqual([11]);
    expect(selectAlerts(scene).map((a) => a.id)).toEqual([11, 10]);
  });
});

describe("findLot", () => {
  it("returns the lot or null", () => {
    expect(findLot(scene, 3)?.country).toBe("Colombia");
    expect(findLot(scene, 999)).toBeNull();
  });
});

describe("countrySummaries", () => {
  it("attaches per-country lot and alert counts", () => {
    const brazil = summarizeCountries(scene).find((c) => c.id === 1);
    expect(brazil).toMatchObject({ lots: 2, alerts: 1 });
  });
});

describe("buildOverview", () => {
  it("aggregates totals and lot status breakdown", () => {
    const withStatuses = aggregate({
      ...scene,
      lots: [
        lot({ id: 1, storageDate: "2026-01-01T00:00:00.000Z", status: "conforme" }),
        lot({ id: 2, storageDate: "2026-01-02T00:00:00.000Z", status: "perime" }),
      ],
    });
    const overview = buildOverview(withStatuses);
    expect(overview.lots).toBe(2);
    expect(overview.alerts).toBe(2);
    expect(overview.countries).toBe(2);
    expect(overview.lotsByStatus).toEqual({ conforme: 1, perime: 1 });
  });
});
