import { describe, expect, it } from "vitest";
import { getWarehouse, warehousesByCountry, WAREHOUSES } from "./warehouses";

describe("warehousesByCountry", () => {
  it("returns the warehouses of a country", () => {
    expect(warehousesByCountry("br").map((w) => w.id)).toEqual(["SAN-01", "VAR-02"]);
    expect(warehousesByCountry("ec")).toHaveLength(2);
    expect(warehousesByCountry("co")).toHaveLength(2);
  });

  it("covers every warehouse across the three countries", () => {
    const total =
      warehousesByCountry("br").length +
      warehousesByCountry("ec").length +
      warehousesByCountry("co").length;
    expect(total).toBe(WAREHOUSES.length);
  });
});

describe("getWarehouse", () => {
  it("finds a warehouse by id", () => {
    expect(getWarehouse("MED-01")?.city).toBe("Medellín");
  });

  it("returns undefined for an unknown id", () => {
    expect(getWarehouse("NOPE")).toBeUndefined();
  });
});
