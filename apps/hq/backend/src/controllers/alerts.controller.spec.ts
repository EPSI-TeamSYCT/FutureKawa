import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../services/aggregate.service", () => ({ getAggregate: vi.fn() }));

import { alertsRouter } from "./alerts.controller";
import { getAggregate } from "../services/aggregate.service";
import { live, scene } from "../testing/fixtures";
import { testApp } from "../testing/app";

const getAgg = vi.mocked(getAggregate);
const app = testApp(alertsRouter);

beforeEach(() => {
  vi.clearAllMocks();
  getAgg.mockResolvedValue(live(scene()));
});

describe("GET /alerts", () => {
  it("returns alerts with freshness meta", async () => {
    const res = await request(app).get("/alerts");
    expect(res.status).toBe(200);
    expect(res.body.alerts.map((a: { id: number }) => a.id)).toEqual([5]);
    expect(res.body.meta.source).toBe("live");
  });

  it("filters by country and rejects an unknown one", async () => {
    expect((await request(app).get("/alerts?country=2")).status).toBe(200);
    expect((await request(app).get("/alerts?country=99")).status).toBe(400);
  });
});
