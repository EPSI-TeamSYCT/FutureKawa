import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../adapters/country-api.adapter", () => ({
  countryClient: {
    fetchCountries: vi.fn(),
    fetchExploitations: vi.fn(),
    fetchWarehouses: vi.fn(),
    fetchBatches: vi.fn(),
    fetchAlerts: vi.fn(),
    fetchWarehouseMeasures: vi.fn(),
  },
}));

import { countryClient } from "../adapters/country-api.adapter";
import { enrichWarehouses, getAggregate, getWarehouseMeasures } from "./aggregate.service";

const c = vi.mocked(countryClient);

beforeEach(() => {
  vi.clearAllMocks();
  c.fetchCountries.mockResolvedValue([
    {
      id: 1,
      name: "Colombia",
      isoCode: "CO",
      idealTemp: 26,
      idealHumidity: 80,
      toleranceTemp: 3,
      toleranceHumidity: 2,
    },
  ]);
  c.fetchExploitations.mockResolvedValue([
    { id: 7, name: "Ferme Nord", country: "/api/countries/1" },
  ]);
  c.fetchWarehouses.mockResolvedValue([
    { id: 3, name: "Warehouse A", country: "/api/countries/1" },
  ]);
  c.fetchBatches.mockResolvedValue([
    {
      id: 10,
      ref: "LOT-1",
      storageDate: "2026-01-01T00:00:00.000Z",
      status: "stored",
      exploitation: "/api/exploitations/7",
      warehouse: "/api/warehouses/3",
    },
  ]);
  c.fetchAlerts.mockResolvedValue([
    {
      id: 5,
      type: "temperature",
      message: "out of range",
      createdAt: "2026-01-01T00:00:00.000Z",
      emailSent: true,
      warehouse: "/api/warehouses/3",
      batch: "/api/batches/10",
    },
  ]);
});

describe("getAggregate", () => {
  it("normalizes countries, lots and alerts with resolved relations", async () => {
    const { data, source } = await getAggregate();

    expect(source).toBe("live");
    expect(data.countries[0]).toMatchObject({
      id: 1,
      name: "Colombia",
      ideal: { temperature: 26, humidity: 80 },
    });
    expect(data.lots[0]).toMatchObject({
      id: 10,
      reference: "LOT-1",
      country: "Colombia",
      exploitation: "Ferme Nord",
      warehouse: "Warehouse A",
    });
    expect(data.alerts[0]).toMatchObject({ id: 5, country: "Colombia", batchId: 10 });
  });

  it("builds warehouses enriched with their country and lot count", async () => {
    const { data } = await getAggregate();
    expect(data.warehouses[0]).toMatchObject({
      id: 3,
      name: "Warehouse A",
      country: "Colombia",
      isoCode: "CO",
      ideal: { temperature: 26, humidity: 80 },
      lots: 1,
    });
  });
});

describe("enrichWarehouses", () => {
  it("attaches the latest reading and flags out-of-range", async () => {
    const { data } = await getAggregate();
    c.fetchWarehouseMeasures.mockResolvedValueOnce([
      { id: 1, temperature: 26, humidity: 80, measuredAt: "2026-01-01T00:00:00.000Z" },
      { id: 2, temperature: 40, humidity: 80, measuredAt: "2026-01-02T00:00:00.000Z" },
    ]);

    const [status] = await enrichWarehouses(data.warehouses);

    expect(status?.latestMeasure).toMatchObject({ id: 2, temperature: 40 });
    expect(status?.outOfRange).toBe(true); // 40°C is far past 26 ± 3
  });

  it("has no reading and is in range when the warehouse has no measures", async () => {
    const { data } = await getAggregate();
    c.fetchWarehouseMeasures.mockResolvedValueOnce([]);

    const [status] = await enrichWarehouses(data.warehouses);

    expect(status?.latestMeasure).toBeNull();
    expect(status?.outOfRange).toBe(false);
  });
});

describe("getWarehouseMeasures", () => {
  it("maps and sorts measures ascending by measuredAt", async () => {
    c.fetchWarehouseMeasures.mockResolvedValueOnce([
      { id: 2, temperature: 20, humidity: 50, measuredAt: "2026-01-02T00:00:00.000Z" },
      { id: 1, temperature: 21, humidity: 55, measuredAt: "2026-01-01T00:00:00.000Z" },
    ]);

    const measures = await getWarehouseMeasures(3);

    expect(measures.map((m) => m.id)).toEqual([1, 2]);
    expect(c.fetchWarehouseMeasures).toHaveBeenCalledWith(3);
  });
});
