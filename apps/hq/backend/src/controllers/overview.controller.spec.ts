import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../services/aggregate.service", () => ({ getAggregate: vi.fn() }));

import { overviewRouter } from "./overview.controller";
import { getAggregate } from "../services/aggregate.service";
import { live, scene } from "../testing/fixtures";
import { testApp } from "../testing/app";

const getAgg = vi.mocked(getAggregate);
const app = testApp(overviewRouter);

beforeEach(() => {
  vi.clearAllMocks();
  getAgg.mockResolvedValue(live(scene()));
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

  it("returns 500 on an unexpected upstream failure", async () => {
    getAgg.mockRejectedValueOnce(new Error("boom"));
    const res = await request(app).get("/overview");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("internal_error");
  });
});
