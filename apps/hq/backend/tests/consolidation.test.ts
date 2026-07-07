import { describe, expect, it } from "vitest";
import {
  buildOverview,
  consolidateAlerts,
  consolidateLots,
  findLot,
  measuresForWarehouse,
} from "../src/services/consolidation";
import { alert, live, lot, measure, unavailable } from "./fixtures";

describe("consolidateLots", () => {
  it("merges countries and sorts by storageDate ascending (FIFO)", () => {
    const results = [
      live("brazil", {
        lots: [
          lot({
            id: "b2",
            country: "brazil",
            storageDate: "2026-03-01T00:00:00.000Z",
          }),
          lot({
            id: "b1",
            country: "brazil",
            storageDate: "2026-01-01T00:00:00.000Z",
          }),
        ],
        measures: [],
        alerts: [],
      }),
      live("colombia", {
        lots: [
          lot({
            id: "c1",
            country: "colombia",
            storageDate: "2026-02-01T00:00:00.000Z",
          }),
        ],
        measures: [],
        alerts: [],
      }),
    ];

    const { data } = consolidateLots(results);
    expect(data.map((l) => l.id)).toEqual(["b1", "c1", "b2"]);
  });

  it("ignores unavailable countries but still reports their freshness", () => {
    const results = [
      live("brazil", {
        lots: [
          lot({
            id: "b1",
            country: "brazil",
            storageDate: "2026-01-01T00:00:00.000Z",
          }),
        ],
        measures: [],
        alerts: [],
      }),
      unavailable("ecuador"),
    ];

    const { data, meta } = consolidateLots(results);
    expect(data.map((l) => l.id)).toEqual(["b1"]);
    expect(meta.find((m) => m.country === "ecuador")?.source).toBe(
      "unavailable",
    );
  });
});

describe("consolidateAlerts", () => {
  it("merges and sorts by timestamp descending (most recent first)", () => {
    const results = [
      live("brazil", {
        lots: [],
        measures: [],
        alerts: [
          alert({
            id: "a1",
            country: "brazil",
            timestamp: "2026-01-01T00:00:00.000Z",
          }),
        ],
      }),
      live("ecuador", {
        lots: [],
        measures: [],
        alerts: [
          alert({
            id: "a2",
            country: "ecuador",
            timestamp: "2026-05-01T00:00:00.000Z",
          }),
        ],
      }),
    ];
    expect(consolidateAlerts(results).data.map((a) => a.id)).toEqual([
      "a2",
      "a1",
    ]);
  });
});

describe("findLot & measuresForWarehouse", () => {
  const results = [
    live("brazil", {
      lots: [
        lot({
          id: "b1",
          country: "brazil",
          warehouse: "WH-BR",
          storageDate: "2026-01-01T00:00:00.000Z",
        }),
      ],
      measures: [
        measure({
          id: "m2",
          warehouse: "WH-BR",
          timestamp: "2026-01-02T00:00:00.000Z",
        }),
        measure({
          id: "m1",
          warehouse: "WH-BR",
          timestamp: "2026-01-01T00:00:00.000Z",
        }),
        measure({
          id: "mx",
          warehouse: "WH-OTHER",
          timestamp: "2026-01-01T00:00:00.000Z",
        }),
      ],
      alerts: [],
    }),
  ];

  it("finds a lot across countries", () => {
    expect(findLot(results, "b1")?.id).toBe("b1");
    expect(findLot(results, "nope")).toBeNull();
  });

  it("returns only the warehouse measures, sorted ascending", () => {
    expect(measuresForWarehouse(results, "WH-BR").map((m) => m.id)).toEqual([
      "m1",
      "m2",
    ]);
  });
});

describe("buildOverview", () => {
  it("aggregates counters and freshness across countries", () => {
    const results = [
      live("brazil", {
        lots: [
          lot({
            id: "b1",
            country: "brazil",
            status: "conforme",
            storageDate: "2026-01-01T00:00:00.000Z",
          }),
          lot({
            id: "b2",
            country: "brazil",
            status: "perime",
            storageDate: "2026-01-02T00:00:00.000Z",
          }),
        ],
        measures: [],
        alerts: [
          alert({
            id: "a1",
            country: "brazil",
            timestamp: "2026-01-01T00:00:00.000Z",
          }),
        ],
      }),
      unavailable("colombia"),
    ];

    const overview = buildOverview(results);
    expect(overview.totals.lots).toBe(2);
    expect(overview.totals.alerts).toBe(1);
    expect(overview.totals.lotsByStatus).toEqual({
      conforme: 1,
      en_alerte: 0,
      perime: 1,
    });
    expect(overview.totals.countriesLive).toBe(1);
    expect(overview.totals.countriesUnavailable).toBe(1);
  });
});
