/**
 * Pure translation from the HQ backend shapes to the frontend domain types.
 * Reuses the frontend's own derivation logic (ageing, status) so nothing is
 * duplicated. Fields the backend/country API cannot provide are approximated:
 * per-lot live conditions are unavailable (null), so a lot's status is derived
 * from age and shipment only, not from a live drift.
 */
import { ageInDays, computeLotStatut } from "@/lib/conditions";
import type { CountryCode } from "@/lib/countries";
import type { BkAlert, BkCountry, BkLot, BkMeasure, BkWarehouse } from "./backend";
import type {
  Alerte,
  AlerteType,
  EmailStatut,
  EntrepotStatut,
  Lot,
  Mesure,
  Periode,
} from "./types";

const SHIPPED = /^(shipped|expedi|expéd)/i;

export function codeFromIso(isoCode: string): CountryCode {
  return isoCode.toLowerCase() as CountryCode;
}

export function indexCodeByCountryId(countries: BkCountry[]): Map<number, CountryCode> {
  return new Map(countries.map((c) => [c.id, codeFromIso(c.isoCode)]));
}

export function mapLot(l: BkLot, codeByCountryId: Map<number, CountryCode>): Lot {
  const age = ageInDays(l.storageDate);
  return {
    id: String(l.id),
    pays: (l.countryId != null ? codeByCountryId.get(l.countryId) : undefined) ?? "br",
    entrepotId: String(l.warehouseId),
    entrepotNom: l.warehouse ?? "",
    dateEntree: l.storageDate,
    ageJours: age,
    statut: computeLotStatut({ age, expedie: SHIPPED.test(l.status), drift: false }),
    conditions: null,
  };
}

function alerteType(type: string): AlerteType {
  return /perem|expir|age|365/i.test(type) ? "PEREMPTION" : "DERIVE";
}

export function mapAlerte(a: BkAlert, codeByCountryId: Map<number, CountryCode>): Alerte {
  return {
    id: String(a.id),
    type: alerteType(a.type),
    pays: (a.countryId != null ? codeByCountryId.get(a.countryId) : undefined) ?? "br",
    entrepotId: String(a.warehouseId),
    entrepotNom: a.warehouse ?? "",
    lotId: a.batchId != null ? String(a.batchId) : null,
    timestamp: a.createdAt,
    message: a.message,
    emailStatut: (a.emailSent ? "ENVOYE" : "EN_ATTENTE") satisfies EmailStatut,
    traitee: false,
  };
}

export function mapMesure(m: BkMeasure): Mesure | null {
  if (m.temperature == null || m.humidity == null) return null;
  return { timestamp: m.measuredAt, temp: m.temperature, humidity: m.humidity };
}

// A warehouse without a live reading can't be shown as a status card, so it maps
// to null and is filtered out. `ville` is not in the country API (stays empty).
export function mapEntrepot(w: BkWarehouse): EntrepotStatut | null {
  const derniereMesure = w.latestMeasure ? mapMesure(w.latestMeasure) : null;
  if (!derniereMesure) return null;
  return {
    id: String(w.id),
    nom: w.name,
    pays: w.isoCode ? codeFromIso(w.isoCode) : "br",
    ville: "",
    ideal: { temp: w.ideal?.temperature ?? 0, humidity: w.ideal?.humidity ?? 0 },
    tolerance: { temp: w.tolerance?.temperature ?? 0, humidity: w.tolerance?.humidity ?? 0 },
    derniereMesure,
    horsPlage: w.outOfRange,
    nbLots: w.lots,
  };
}

const PERIOD_HOURS: Record<Periode, number> = {
  "24h": 24,
  "7j": 168,
  "30j": 720,
  tout: Infinity,
};

/** Keep only the measures within the requested window (backend returns all). */
export function filterByPeriode(measures: Mesure[], periode: Periode): Mesure[] {
  const hours = PERIOD_HOURS[periode] ?? PERIOD_HOURS["30j"];
  if (!Number.isFinite(hours)) return measures;
  const cutoff = Date.now() - hours * 3_600_000;
  return measures.filter((m) => new Date(m.timestamp).getTime() >= cutoff);
}
