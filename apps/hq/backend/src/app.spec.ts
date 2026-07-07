import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("./services/aggregate.service", () => ({
  getAggregate: vi.fn(),
  getWarehouseMeasures: vi.fn(),
}));

import { createApp } from "./app";
import { getAggregate } from "./services/aggregate.service";
import { live, scene } from "./testing/fixtures";

const getAgg = vi.mocked(getAggregate);
const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  getAgg.mockResolvedValue(live(scene()));
});

// Per-controller behaviour is covered in each *.controller.spec.ts; here we
// only assert the app wiring (health probe + routers mounted).
describe("app", () => {
  it("exposes a health probe", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("mounts the resource routers", async () => {
    expect((await request(app).get("/overview")).status).toBe(200);
  });
});
