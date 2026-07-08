import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../services/aggregate.service", () => ({
  getAggregate: vi.fn(),
  enrichWarehouses: vi.fn(),
  getWarehouseMeasures: vi.fn(),
}));

import { warehousesRouter } from "./warehouses.controller";
import {
  enrichWarehouses,
  getAggregate,
  getWarehouseMeasures,
} from "../services/aggregate.service";
import { live, scene, warehouse } from "../testing/fixtures";
import { testApp } from "../testing/app";
import type { WarehouseStatus } from "../types/domain";

const getAgg = vi.mocked(getAggregate);
const enrich = vi.mocked(enrichWarehouses);
const getMeasures = vi.mocked(getWarehouseMeasures);
const app = testApp(warehousesRouter);

const status = (id: number): WarehouseStatus => ({
  ...warehouse({ id }),
  latestMeasure: null,
  outOfRange: false,
});

beforeEach(() => {
  vi.clearAllMocks();
  getAgg.mockResolvedValue(live(scene()));
  enrich.mockImplementation((warehouses) => Promise.resolve(warehouses.map((w) => status(w.id))));
});

describe("GET /warehouses", () => {
  it("returns enriched warehouses with freshness meta", async () => {
    const res = await request(app).get("/warehouses");
    expect(res.status).toBe(200);
    expect(res.body.warehouses.map((w: { id: number }) => w.id)).toEqual([1, 2]);
    expect(res.body.meta.source).toBe("live");
  });

  it("filters by country", async () => {
    const res = await request(app).get("/warehouses?country=2");
    expect(res.body.warehouses.map((w: { id: number }) => w.id)).toEqual([2]);
  });

  it("rejects an unknown country with 400", async () => {
    expect((await request(app).get("/warehouses?country=99")).status).toBe(400);
  });
});

describe("GET /warehouses/:id", () => {
  it("returns a single enriched warehouse", async () => {
    const res = await request(app).get("/warehouses/1");
    expect(res.status).toBe(200);
    expect(res.body.warehouse.id).toBe(1);
  });

  it("404s on an unknown warehouse", async () => {
    expect((await request(app).get("/warehouses/999")).status).toBe(404);
  });
});

describe("GET /warehouses/:id/measures", () => {
  it("returns the warehouse measures", async () => {
    getMeasures.mockResolvedValueOnce([
      { id: 1, temperature: 21, humidity: 58, measuredAt: "2026-07-07T14:30:00.000Z" },
    ]);
    const res = await request(app).get("/warehouses/1/measures");
    expect(res.status).toBe(200);
    expect(res.body.warehouseId).toBe(1);
    expect(res.body.measures).toHaveLength(1);
    expect(getMeasures).toHaveBeenCalledWith(1);
  });
});
