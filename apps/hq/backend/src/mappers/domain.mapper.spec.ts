import { describe, expect, it } from "vitest";
import { iriId, toAlert, toCountry, toLot, toRef } from "./domain.mapper";
import type { Lookups, RawAlert, RawBatch, RawCountry } from "../types/domain";

const rawCountry: RawCountry = {
  id: 1,
  name: "Colombia",
  isoCode: "CO",
  idealTemp: 26,
  idealHumidity: 80,
  toleranceTemp: 3,
  toleranceHumidity: 2,
};

// Lookups are keyed by local id; the country holds the mapped DTO (offset 0 here).
const lookups: Lookups = {
  countries: new Map([[1, toCountry(rawCountry, "COLOMBIA")]]),
  exploitations: new Map([[7, toRef({ id: 7, name: "Ferme Nord", country: "/api/countries/1" })]]),
  warehouses: new Map([[3, toRef({ id: 3, name: "Warehouse A", country: "/api/countries/1" })]]),
};

describe("iriId", () => {
  it("extracts the trailing id from an IRI", () => {
    expect(iriId("/api/countries/1")).toBe(1);
  });

  it("throws on a malformed IRI", () => {
    expect(() => iriId("/api/countries/x")).toThrow();
  });
});

describe("toCountry", () => {
  it("tags the source and leaves ids untouched with no offset", () => {
    expect(toCountry(rawCountry, "COLOMBIA")).toMatchObject({ id: 1, source: "COLOMBIA" });
  });

  it("offsets the id to stay unique across merged snapshots", () => {
    expect(toCountry(rawCountry, "COLOMBIA", 1_000_000).id).toBe(1_000_001);
  });
});

describe("toLot", () => {
  it("resolves country via the warehouse and names via lookups", () => {
    const raw: RawBatch = {
      id: 10,
      ref: "LOT-2026-001",
      storageDate: "2026-07-07T00:00:00.000Z",
      status: "stored",
      exploitation: "/api/exploitations/7",
      warehouse: "/api/warehouses/3",
    };
    expect(toLot(raw, lookups, "COLOMBIA")).toMatchObject({
      id: 10,
      reference: "LOT-2026-001",
      source: "COLOMBIA",
      countryId: 1,
      country: "Colombia",
      exploitation: "Ferme Nord",
      warehouse: "Warehouse A",
      warehouseId: 3,
      localWarehouseId: 3,
    });
  });

  it("offsets emitted ids but keeps localWarehouseId local for routing", () => {
    const offsetLookups: Lookups = {
      countries: new Map([[1, toCountry(rawCountry, "COLOMBIA", 1_000_000)]]),
      exploitations: lookups.exploitations,
      warehouses: lookups.warehouses,
    };
    const raw: RawBatch = {
      id: 10,
      ref: "LOT-2026-001",
      storageDate: "2026-07-07T00:00:00.000Z",
      status: "stored",
      exploitation: "/api/exploitations/7",
      warehouse: "/api/warehouses/3",
    };
    expect(toLot(raw, offsetLookups, "COLOMBIA", 1_000_000)).toMatchObject({
      id: 1_000_010,
      countryId: 1_000_001,
      exploitationId: 1_000_007,
      warehouseId: 1_000_003,
      localWarehouseId: 3,
    });
  });

  it("leaves names null when a relation is unknown", () => {
    const raw: RawBatch = {
      id: 11,
      ref: "LOT-2",
      storageDate: "2026-07-07T00:00:00.000Z",
      status: "stored",
      exploitation: "/api/exploitations/99",
      warehouse: "/api/warehouses/99",
    };
    expect(toLot(raw, lookups, "COLOMBIA")).toMatchObject({
      countryId: null,
      country: null,
      exploitation: null,
      warehouse: null,
    });
  });
});

describe("toAlert", () => {
  it("resolves the warehouse country and nullable batch", () => {
    const raw: RawAlert = {
      id: 4,
      type: "temperature",
      message: "out of range",
      createdAt: "2026-07-07T14:35:00.000Z",
      emailSent: true,
      warehouse: "/api/warehouses/3",
      batch: "/api/batches/10",
    };
    expect(toAlert(raw, lookups, "COLOMBIA")).toMatchObject({
      source: "COLOMBIA",
      country: "Colombia",
      warehouse: "Warehouse A",
      batchId: 10,
    });

    expect(toAlert({ ...raw, batch: null }, lookups, "COLOMBIA").batchId).toBeNull();
  });

  it("offsets ids across the merged set", () => {
    const offsetLookups: Lookups = {
      countries: new Map([[1, toCountry(rawCountry, "COLOMBIA", 1_000_000)]]),
      exploitations: lookups.exploitations,
      warehouses: lookups.warehouses,
    };
    const raw: RawAlert = {
      id: 4,
      type: "temperature",
      message: "out of range",
      createdAt: "2026-07-07T14:35:00.000Z",
      emailSent: true,
      warehouse: "/api/warehouses/3",
      batch: "/api/batches/10",
    };
    expect(toAlert(raw, offsetLookups, "COLOMBIA", 1_000_000)).toMatchObject({
      id: 1_000_004,
      countryId: 1_000_001,
      warehouseId: 1_000_003,
      batchId: 1_000_010,
    });
  });
});
