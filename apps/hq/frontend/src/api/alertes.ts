import { fetchAlerts, fetchCountries } from "./backend";
import { indexCodeByCountryId, mapAlerte } from "./mappers";
import type { CountryScope } from "@/lib/countries";
import type { Alerte } from "./types";

export interface AlerteFilters {
  scope?: CountryScope;
}

export async function getAlertes(
  filters: AlerteFilters = {},
  signal?: AbortSignal,
): Promise<Alerte[]> {
  const [countries, alerts] = await Promise.all([
    fetchCountries(signal),
    fetchAlerts(undefined, signal),
  ]);
  const codeById = indexCodeByCountryId(countries);
  const scope = filters.scope && filters.scope !== "siege" ? filters.scope : undefined;
  const mapped = alerts.map((a) => mapAlerte(a, codeById));
  return scope ? mapped.filter((a) => a.pays === scope) : mapped;
}
