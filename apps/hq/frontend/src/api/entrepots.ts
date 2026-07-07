import { apiGet } from "./client";
import type { CountryScope } from "@/lib/countries";
import type { EntrepotStatut } from "./types";

export function getEntrepots(
  scope?: CountryScope,
  signal?: AbortSignal,
): Promise<EntrepotStatut[]> {
  const pays = scope && scope !== "siege" ? scope : undefined;
  return apiGet<EntrepotStatut[]>("/api/entrepots", { pays }, signal);
}

export function getEntrepot(id: string, signal?: AbortSignal): Promise<EntrepotStatut> {
  return apiGet<EntrepotStatut>(`/api/entrepots/${encodeURIComponent(id)}`, undefined, signal);
}
