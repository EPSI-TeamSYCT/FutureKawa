import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock axios so `axios.create()` returns a controllable `get`. Hoisted so the
// mock exists before the adapter module builds its client at import time.
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("axios", () => ({ default: { create: () => ({ get }) } }));

import { countryClient } from "./country-api.adapter";

beforeEach(() => vi.clearAllMocks());

describe("countryClient", () => {
  it("fetches and validates a resource", async () => {
    get.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          name: "Colombia",
          isoCode: "CO",
          idealTemp: 26,
          idealHumidity: 80,
          toleranceTemp: 3,
          toleranceHumidity: 2,
        },
      ],
    });

    const countries = await countryClient.fetchCountries();

    expect(countries[0]?.isoCode).toBe("CO");
    expect(get).toHaveBeenCalledWith("/api/countries", { params: undefined });
  });

  it("filters measures by the sensor's warehouse", async () => {
    get.mockResolvedValueOnce({
      data: [
        { id: 1, temperature: 21.4, humidity: 58, measuredAt: "2026-07-07T14:30:00.000Z" },
      ],
    });

    await countryClient.fetchWarehouseMeasures(3);

    expect(get).toHaveBeenCalledWith("/api/measures", {
      params: { "sensor.warehouse": 3 },
    });
  });

  it("rejects a payload that violates the schema", async () => {
    get.mockResolvedValueOnce({ data: [{ id: "not-a-number" }] });
    await expect(countryClient.fetchBatches()).rejects.toThrow();
  });
});
