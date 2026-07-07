import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/clients/countryClient", () => ({ fetchCountry: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    countrySnapshot: { upsert: vi.fn(), findUnique: vi.fn() },
  },
}));

import { fetchCountry } from "../src/clients/countryClient";
import { prisma } from "../src/lib/prisma";
import { getCountryData } from "../src/services/countryData";
import type { CountryPayload } from "../src/types/domain";

const fetchCountryMock = vi.mocked(fetchCountry);
const upsert = vi.mocked(prisma.countrySnapshot.upsert);
const findUnique = vi.mocked(prisma.countrySnapshot.findUnique);

const payload: CountryPayload = {
  lots: [
    {
      id: "b1",
      country: "brazil",
      exploitation: "Fazenda A",
      warehouse: "WH-1",
      storageDate: "2026-01-01T00:00:00.000Z",
      status: "conforme",
    },
  ],
  measures: [],
  alerts: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCountryData", () => {
  it("returns live data and writes the snapshot on success", async () => {
    fetchCountryMock.mockResolvedValueOnce(payload);

    const result = await getCountryData("brazil");

    expect(result.freshness.source).toBe("live");
    expect(result.freshness.stale).toBe(false);
    expect(result.payload).toEqual(payload);
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("falls back to a fresh cache snapshot when the country is down", async () => {
    fetchCountryMock.mockRejectedValueOnce(new Error("timeout"));
    findUnique.mockResolvedValueOnce({
      country: "brazil",
      ...payload,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getCountryData("brazil");

    expect(result.freshness.source).toBe("cache");
    expect(result.freshness.stale).toBe(false);
    expect(result.payload?.lots[0]?.id).toBe("b1");
  });

  it("marks the cache stale when the snapshot is too old", async () => {
    fetchCountryMock.mockRejectedValueOnce(new Error("timeout"));
    findUnique.mockResolvedValueOnce({
      country: "brazil",
      ...payload,
      fetchedAt: new Date(Date.now() - 10 * 60 * 1000),
      updatedAt: new Date(),
    });

    const result = await getCountryData("brazil");

    expect(result.freshness.source).toBe("cache");
    expect(result.freshness.stale).toBe(true);
  });

  it("reports unavailable when there is no snapshot at all", async () => {
    fetchCountryMock.mockRejectedValueOnce(new Error("timeout"));
    findUnique.mockResolvedValueOnce(null);

    const result = await getCountryData("brazil");

    expect(result.freshness.source).toBe("unavailable");
    expect(result.payload).toBeNull();
  });
});
