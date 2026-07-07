import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/countryData", () => ({
  getCountryData: vi.fn(),
  getAllCountryData: vi.fn(),
}));

import { createApp } from "../src/app";
import { getAllCountryData, getCountryData } from "../src/services/countryData";
import { live, lot, measure, unavailable } from "./fixtures";

const getAll = vi.mocked(getAllCountryData);
const getOne = vi.mocked(getCountryData);
const app = createApp();

function scene() {
  return [
    live("brazil", {
      lots: [
        lot({
          id: "b2",
          country: "brazil",
          warehouse: "WH-BR",
          storageDate: "2026-03-01T00:00:00.000Z",
        }),
        lot({
          id: "b1",
          country: "brazil",
          warehouse: "WH-BR",
          storageDate: "2026-01-01T00:00:00.000Z",
        }),
      ],
      measures: [
        measure({
          id: "m1",
          warehouse: "WH-BR",
          timestamp: "2026-01-01T00:00:00.000Z",
        }),
      ],
      alerts: [],
    }),
    unavailable("ecuador"),
    live("colombia", {
      lots: [
        lot({
          id: "c1",
          country: "colombia",
          warehouse: "WH-CO",
          storageDate: "2026-02-01T00:00:00.000Z",
        }),
      ],
      measures: [],
      alerts: [],
    }),
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  getAll.mockResolvedValue(scene());
});

describe("GET /countries", () => {
  it("lists each country with its state", async () => {
    const res = await request(app).get("/countries");
    expect(res.status).toBe(200);
    expect(res.body.countries).toHaveLength(3);
    expect(
      res.body.countries.find(
        (c: { country: string }) => c.country === "ecuador",
      ).source,
    ).toBe("unavailable");
  });
});

describe("GET /lots", () => {
  it("returns consolidated lots sorted FIFO with freshness meta", async () => {
    const res = await request(app).get("/lots");
    expect(res.status).toBe(200);
    expect(res.body.lots.map((l: { id: string }) => l.id)).toEqual([
      "b1",
      "c1",
      "b2",
    ]);
    expect(res.body.meta).toHaveLength(3);
  });

  it("filters by a single country", async () => {
    getOne.mockResolvedValueOnce(scene()[0]!);
    const res = await request(app).get("/lots?country=brazil");
    expect(res.status).toBe(200);
    expect(res.body.lots.map((l: { id: string }) => l.id)).toEqual([
      "b1",
      "b2",
    ]);
    expect(getOne).toHaveBeenCalledWith("brazil");
  });

  it("rejects an unknown country with 400", async () => {
    const res = await request(app).get("/lots?country=france");
    expect(res.status).toBe(400);
  });
});

describe("GET /lots/:id and measures", () => {
  it("returns a lot detail", async () => {
    const res = await request(app).get("/lots/c1");
    expect(res.status).toBe(200);
    expect(res.body.lot.country).toBe("colombia");
  });

  it("404s on an unknown lot", async () => {
    const res = await request(app).get("/lots/nope");
    expect(res.status).toBe(404);
  });

  it("returns the warehouse measures of a lot", async () => {
    const res = await request(app).get("/lots/b1/measures");
    expect(res.status).toBe(200);
    expect(res.body.warehouse).toBe("WH-BR");
    expect(res.body.measures.map((m: { id: string }) => m.id)).toEqual(["m1"]);
  });
});

describe("GET /overview", () => {
  it("returns global counters and per-country freshness", async () => {
    const res = await request(app).get("/overview");
    expect(res.status).toBe(200);
    expect(res.body.totals.lots).toBe(3);
    expect(res.body.totals.countriesUnavailable).toBe(1);
    expect(res.body.countries).toHaveLength(3);
  });
});
