import type { Country } from "./domain";

export interface LotFilter {
  countryId?: number;
  exploitationId?: number;
}

export interface CountrySummary extends Country {
  lots: number;
  alerts: number;
}

export interface Overview {
  countries: number;
  lots: number;
  alerts: number;
  lotsByStatus: Record<string, number>;
}
