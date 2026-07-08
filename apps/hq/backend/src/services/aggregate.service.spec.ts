import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CountryClient } from "../adapters/country-api.adapter";

// A country client whose bulk resources are backed by simple, per-country data.
// Every country API starts its own id space at the same low numbers, which is
// exactly what the aggregate service must de-collide via its id offset.
function stubClient(over: Partial<CountryClient> = {}): CountryClient {
  return {
    fetchCountries: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: "Country",
        isoCode: "XX",
        idealTemp: 26,
        idealHumidity: 80,
        toleranceTemp: 3,
        toleranceHumidity: 2,
      },
    ]),
    fetchExploitations: vi
      .fn()
      .mockResolvedValue([{ id: 1, name: "Exploitation", country: "/api/countries/1" }]),
    fetchWarehouses: vi
      .fn()
      .mockResolvedValue([{ id: 1, name: "Warehouse", country: "/api/countries/1" }]),
    fetchBatches: vi.fn().mockResolvedValue([
      {
        id: 1,
        ref: "LOT-1",
        storageDate: "2026-01-01T00:00:00.000Z",
        status: "stored",
        exploitation: "/api/exploitations/1",
        warehouse: "/api/warehouses/1",
      },
    ]),
    fetchAlerts: vi.fn().mockResolvedValue([
      {
        id: 1,
        type: "temperature",
        message: "out of range",
        createdAt: "2026-01-01T00:00:00.000Z",
        emailSent: true,
        warehouse: "/api/warehouses/1",
        batch: "/api/batches/1",
      },
    ]),
    fetchWarehouseMeasures: vi.fn().mockResolvedValue([]),
    ...over,
  };
}

// Load the service with a controlled set of country clients. Fresh module
// registry each time so the per-country fallback caches start empty.
type AggregateModule = typeof import("./aggregate.service");
const modulePath = "./aggregate.service";

async function loadService(clients: Map<string, CountryClient>): Promise<AggregateModule> {
  vi.resetModules();
  vi.doMock("../adapters/country-api.adapter", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    countryClients: clients,
  }));
  vi.doMock("../config", async (importOriginal) => ({
    ...(await importOriginal<object>()),
    config: {
      port: 3000,
      logLevel: "silent",
      countryApiKey: "test-key",
      countries: [...clients.keys()].map((code) => ({ code, url: `http://${code}.test` })),
      countryTimeoutMs: 4000,
      cacheStaleMs: 300000,
    },
  }));
  return (await import(modulePath)) as AggregateModule;
}

beforeEach(() => vi.clearAllMocks());

describe("getAggregate — fan out and merge", () => {
  it("queries every configured country and merges the results", async () => {
    const clients = new Map<string, CountryClient>([
      ["BRAZIL", stubClient()],
      ["ECUADOR", stubClient()],
      ["COLOMBIA", stubClient()],
    ]);
    const { getAggregate } = await loadService(clients);

    const { data, meta } = await getAggregate();

    expect(data.countries).toHaveLength(3);
    expect(data.lots).toHaveLength(3);
    expect(data.alerts).toHaveLength(3);
    expect(data.countries.map((c) => c.source).sort()).toEqual(["BRAZIL", "COLOMBIA", "ECUADOR"]);
    for (const client of clients.values()) {
      expect(client.fetchBatches).toHaveBeenCalledOnce();
    }
    expect(meta.source).toBe("live");
    expect(meta.countries).toHaveLength(3);
  });

  it("de-collides ids across countries with a per-country offset", async () => {
    const clients = new Map<string, CountryClient>([
      ["BRAZIL", stubClient()],
      ["ECUADOR", stubClient()],
      ["COLOMBIA", stubClient()],
    ]);
    const { getAggregate } = await loadService(clients);

    const { data } = await getAggregate();

    // All three lots share local id 1 upstream; after offsetting they are unique.
    const ids = data.lots.map((l) => l.id);
    expect(new Set(ids).size).toBe(3);
    // Each lot resolves its own country and keeps a local warehouse id for routing.
    for (const lot of data.lots) {
      expect(lot.countryId).not.toBeNull();
      expect(lot.localWarehouseId).toBe(1);
    }
  });
});

describe("getAggregate — per-country resilience", () => {
  it("degrades a country with no snapshot to an empty slice without failing", async () => {
    const failing = stubClient({
      fetchCountries: vi.fn().mockRejectedValue(new Error("down")),
      fetchExploitations: vi.fn().mockRejectedValue(new Error("down")),
      fetchWarehouses: vi.fn().mockRejectedValue(new Error("down")),
      fetchBatches: vi.fn().mockRejectedValue(new Error("down")),
      fetchAlerts: vi.fn().mockRejectedValue(new Error("down")),
    });
    const clients = new Map<string, CountryClient>([
      ["BRAZIL", stubClient()],
      ["ECUADOR", failing],
    ]);
    const { getAggregate } = await loadService(clients);

    const { data, meta } = await getAggregate();

    // Brazil still contributes; Ecuador is empty but flagged.
    expect(data.countries).toHaveLength(1);
    expect(data.lots).toHaveLength(1);
    expect(meta.source).toBe("cache");
    expect(meta.stale).toBe(true);
    const ecuador = meta.countries.find((c) => c.code === "ECUADOR");
    expect(ecuador).toMatchObject({ source: "cache", stale: true });
  });

  it("serves a country's last-known-good snapshot when it later fails", async () => {
    const flaky = stubClient();
    const clients = new Map<string, CountryClient>([["BRAZIL", flaky]]);
    const { getAggregate } = await loadService(clients);

    // First call succeeds and warms the per-country cache.
    await getAggregate();
    (flaky.fetchCountries as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("down"));

    const { data, meta } = await getAggregate();
    expect(data.lots).toHaveLength(1);
    expect(meta.countries[0]).toMatchObject({ code: "BRAZIL", source: "cache", stale: false });
  });
});

describe("getWarehouseMeasures", () => {
  it("routes to the owning country's client and sorts ascending", async () => {
    const brazil = stubClient({
      fetchWarehouseMeasures: vi.fn().mockResolvedValue([
        { id: 2, temperature: 20, humidity: 50, measuredAt: "2026-01-02T00:00:00.000Z" },
        { id: 1, temperature: 21, humidity: 55, measuredAt: "2026-01-01T00:00:00.000Z" },
      ]),
    });
    const clients = new Map<string, CountryClient>([["BRAZIL", brazil]]);
    const { getWarehouseMeasures } = await loadService(clients);

    const measures = await getWarehouseMeasures("BRAZIL", 3);

    expect(measures.map((m) => m.id)).toEqual([1, 2]);
    expect(brazil.fetchWarehouseMeasures).toHaveBeenCalledWith(3);
  });

  it("throws when the source country is not configured", async () => {
    const clients = new Map<string, CountryClient>([["BRAZIL", stubClient()]]);
    const { getWarehouseMeasures } = await loadService(clients);
    await expect(getWarehouseMeasures("MARS", 1)).rejects.toThrow();
  });
});
