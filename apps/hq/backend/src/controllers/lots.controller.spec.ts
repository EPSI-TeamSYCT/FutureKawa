import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../services/aggregate.service", () => ({
  getAggregate: vi.fn(),
  getWarehouseMeasures: vi.fn(),
}));

import { lotsRouter } from "./lots.controller";
import { getAggregate, getWarehouseMeasures } from "../services/aggregate.service";
import { live, scene } from "../testing/fixtures";
import { testApp } from "../testing/app";

const getAgg = vi.mocked(getAggregate);
const getMeasures = vi.mocked(getWarehouseMeasures);
const app = testApp(lotsRouter);

beforeEach(() => {
  vi.clearAllMocks();
  getAgg.mockResolvedValue(live(scene()));
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

describe("GET /lots/:id", () => {
  it("returns a lot detail", async () => {
    const res = await request(app).get("/lots/3");
    expect(res.status).toBe(200);
    expect(res.body.lot.country).toBe("Colombia");
  });

  it("404s on an unknown lot", async () => {
    expect((await request(app).get("/lots/999")).status).toBe(404);
  });
});

describe("GET /lots/:id/measures", () => {
  it("returns the lot's warehouse measures", async () => {
    getMeasures.mockResolvedValueOnce([
      { id: 1, temperature: 21.4, humidity: 58.2, measuredAt: "2026-07-07T14:30:00.000Z" },
    ]);
    const res = await request(app).get("/lots/1/measures");
    expect(res.status).toBe(200);
    expect(res.body.warehouse).toBe("WH-1");
    expect(res.body.measures).toHaveLength(1);
    expect(getMeasures).toHaveBeenCalledWith("BRAZIL", 1);
  });

  it("404s on an unknown lot before fetching measures", async () => {
    expect((await request(app).get("/lots/999/measures")).status).toBe(404);
    expect(getMeasures).not.toHaveBeenCalled();
  });
});
