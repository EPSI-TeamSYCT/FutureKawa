import { fetchCountries } from "./backend";
import { mapPays } from "./mappers";
import type { PaysInfo } from "./types";

export function getPays(signal?: AbortSignal): Promise<PaysInfo[]> {
  return fetchCountries(signal).then((countries) => countries.map(mapPays));
}
