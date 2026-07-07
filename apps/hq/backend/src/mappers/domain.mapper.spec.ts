import { describe, expect, it } from "vitest";
import { iriId, toAlert, toCountry, toLot, toRef } from "./domain.mapper";
import type {
  Lookups,
  RawAlert,
  RawBatch,
  RawCountry,
} from "../types/domain";

const rawCountry: RawCountry = {
  id: 1,
  name: "Colombia",
  isoCode: "CO",
  idealTemp: 26,
  idealHumidity: 80,
  toleranceTemp: 3,
  toleranceHumidity: 2,
};

const lookups: Lookups = {
  countries: new Map([[1, toCountry(rawCountry)]]),
  exploitations: new Map([
    [7, toRef({ id: 7, name: "Ferme Nord", country: "/api/countries/1" })],
  ]),
  warehouses: new Map([
    [3, toRef({ id: 3, name: "Warehouse A", country: "/api/countries/1" })],
  ]),
};

describe("iriId", () => {
  it("extracts the trailing id from an IRI", () => {
    expect(iriId("/api/countries/1")).toBe(1);
  });

  it("throws on a malformed IRI", () => {
    expect(() => iriId("/api/countries/x")).toThrow();
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
    expect(toLot(raw, lookups)).toMatchObject({
      id: 10,
      reference: "LOT-2026-001",
      countryId: 1,
      country: "Colombia",
      exploitation: "Ferme Nord",
      warehouse: "Warehouse A",
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
    expect(toLot(raw, lookups)).toMatchObject({
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
    expect(toAlert(raw, lookups)).toMatchObject({
      country: "Colombia",
      warehouse: "Warehouse A",
      batchId: 10,
    });

    expect(toAlert({ ...raw, batch: null }, lookups).batchId).toBeNull();
  });
});
