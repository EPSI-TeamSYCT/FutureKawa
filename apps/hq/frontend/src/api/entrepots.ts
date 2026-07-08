import { ApiError } from "./client";
import { fetchWarehouse, fetchWarehouses } from "./backend";
import { mapEntrepot } from "./mappers";
import type { CountryScope } from "@/lib/countries";
import type { EntrepotStatut } from "./types";

export async function getEntrepots(
  scope?: CountryScope,
  signal?: AbortSignal,
): Promise<EntrepotStatut[]> {
  const warehouses = await fetchWarehouses(signal);
  const pays = scope && scope !== "siege" ? scope : undefined;
  return warehouses
    .map(mapEntrepot)
    .filter((e): e is EntrepotStatut => e !== null)
    .filter((e) => (pays ? e.pays === pays : true));
}

export async function getEntrepot(id: string, signal?: AbortSignal): Promise<EntrepotStatut> {
  const entrepot = mapEntrepot(await fetchWarehouse(id, signal));
  if (!entrepot) throw new ApiError(404, "Entrepôt sans relevé disponible.");
  return entrepot;
}
