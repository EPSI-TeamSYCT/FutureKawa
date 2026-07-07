import type { CountryCode } from "./countries";

/** The six named warehouses across the three countries. */
export interface Warehouse {
  id: string;
  name: string;
  country: CountryCode;
  city: string;
}

export const WAREHOUSES: Warehouse[] = [
  { id: "SAN-01", name: "Santos-01", country: "br", city: "Santos" },
  { id: "VAR-02", name: "Varginha-02", country: "br", city: "Varginha" },
  { id: "GUA-02", name: "Guayaquil-02", country: "ec", city: "Guayaquil" },
  { id: "MAN-01", name: "Manta-01", country: "ec", city: "Manta" },
  { id: "MED-01", name: "Medellín-01", country: "co", city: "Medellín" },
  { id: "BOG-01", name: "Bogotá-01", country: "co", city: "Bogotá" },
];

export function warehousesByCountry(country: CountryCode): Warehouse[] {
  return WAREHOUSES.filter((w) => w.country === country);
}

export function getWarehouse(id: string): Warehouse | undefined {
  return WAREHOUSES.find((w) => w.id === id);
}
