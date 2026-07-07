import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/aggregate", () => ({
  getAggregate: vi.fn(),
  getWarehouseMeasures: vi.fn(),
}));

import { createApp } from "../src/app";
import { getAggregate, getWarehouseMeasures } from "../src/services/aggregate";
import { aggregate, alert, country, live, lot } from "./fixtures";

const getAgg = vi.mocked(getAggregate);
const getMeasures = vi.mocked(getWarehouseMeasures);
const app = createApp();

function scene() {
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
    alerts: [
      alert({ id: 5, createdAt: "2026-05-01T00:00:00.000Z", countryId: 2 }),
    ],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getAgg.mockResolvedValue(live(scene()));
});

describe("GET /countries", () => {
  it("lists countries with lot/alert counts and freshness meta", async () => {
    const res = await request(app).get("/countries");
    expect(res.status).toBe(200);
    expect(res.body.countries).toHaveLength(2);
    expect(res.body.countries.find((c: { id: number }) => c.id === 1)).toMatchObject({
      lots: 2,
      alerts: 0,
    });
    expect(res.body.meta.source).toBe("live");
  });
});

describe("GET /lots", () => {
  it("returns lots sorted FIFO", async () => {
    const res = await request(app).get("/lots");
    expect(res.status).toBe(200);
    expect(res.body.lots.map((l: { id: number }) => l.id)).toEqual([1, 3, 2]);
  });

  it("filters by country", async () => {
    const res = await request(app).get("/lots?country=1");
    expect(res.body.lots.map((l: { id: number }) => l.id)).toEqual([1, 2]);
  });

  it("rejects an unknown country with 400", async () => {
    expect((await request(app).get("/lots?country=99")).status).toBe(400);
  });

  it("rejects a non-numeric country with 400", async () => {
    expect((await request(app).get("/lots?country=abc")).status).toBe(400);
  });
});

describe("GET /lots/:id and measures", () => {
  it("returns a lot detail", async () => {
    const res = await request(app).get("/lots/3");
    expect(res.status).toBe(200);
    expect(res.body.lot.country).toBe("Colombia");
  });

  it("404s on an unknown lot", async () => {
    expect((await request(app).get("/lots/999")).status).toBe(404);
  });

  it("returns the lot measures", async () => {
    getMeasures.mockResolvedValueOnce([
      { id: 1, temperature: 21.4, humidity: 58.2, measuredAt: "2026-07-07T14:30:00.000Z" },
    ]);
    const res = await request(app).get("/lots/1/measures");
    expect(res.status).toBe(200);
    expect(res.body.warehouse).toBe("WH-1");
    expect(res.body.measures).toHaveLength(1);
    expect(getMeasures).toHaveBeenCalledWith(1);
  });
});

describe("GET /overview", () => {
  it("returns global counters and freshness", async () => {
    const res = await request(app).get("/overview");
    expect(res.status).toBe(200);
    expect(res.body.lots).toBe(3);
    expect(res.body.alerts).toBe(1);
    expect(res.body.countries).toBe(2);
    expect(res.body.meta.source).toBe("live");
  });
});
