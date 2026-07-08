import { fetchCountries, fetchLot, fetchLots } from "./backend";
import { codeFromIso, indexCodeByCountryId, mapLot } from "./mappers";
import { sortFifo } from "@/lib/conditions";
import type { CountryScope } from "@/lib/countries";
import type { Lot, LotStatut } from "./types";

export interface LotFilters {
  scope?: CountryScope;
  entrepot?: string;
  statut?: LotStatut;
}

function paysParam(scope?: CountryScope): string | undefined {
  return scope && scope !== "siege" ? scope : undefined;
}

/** Lots sorted FIFO (oldest first). */
export async function getLots(filters: LotFilters = {}, signal?: AbortSignal): Promise<Lot[]> {
  const countries = await fetchCountries(signal);
  const codeById = indexCodeByCountryId(countries);
  const scope = paysParam(filters.scope);
  const countryId = scope ? countries.find((c) => codeFromIso(c.isoCode) === scope)?.id : undefined;

  const lots = await fetchLots(countryId != null ? { country: countryId } : undefined, signal);
  let mapped = lots.map((l) => mapLot(l, codeById));
  if (filters.entrepot) mapped = mapped.filter((l) => l.entrepotId === filters.entrepot);
  if (filters.statut) mapped = mapped.filter((l) => l.statut === filters.statut);
  return sortFifo(mapped);
}

export function getLot(id: string, signal?: AbortSignal): Promise<Lot> {
  return Promise.all([fetchCountries(signal), fetchLot(id, signal)]).then(([countries, lot]) =>
    mapLot(lot, indexCodeByCountryId(countries)),
  );
}
