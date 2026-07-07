import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../services/aggregate.service", () => ({ getAggregate: vi.fn() }));

import { countriesRouter } from "./countries.controller";
import { getAggregate } from "../services/aggregate.service";
import { live, scene } from "../testing/fixtures";
import { testApp } from "../testing/app";

const getAgg = vi.mocked(getAggregate);
const app = testApp(countriesRouter);

beforeEach(() => {
  vi.clearAllMocks();
  getAgg.mockResolvedValue(live(scene()));
});

describe("GET /countries", () => {
  it("returns countries with lot/alert counts and freshness meta", async () => {
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
