import { config, COUNTRIES, type Country } from "../config";
import { fetchCountry } from "../clients/countryClient";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import {
  alertsResponseSchema,
  lotsResponseSchema,
  measuresResponseSchema,
  type CountryPayload,
} from "../types/domain";

export type DataSource = "live" | "cache" | "unavailable";

export interface Freshness {
  country: Country;
  source: DataSource;
  stale: boolean;
  fetchedAt: string | null;
}

export interface CountryData {
  country: Country;
  payload: CountryPayload | null;
  freshness: Freshness;
}

// Seule fonction de récupération des données pays, réutilisée par toutes les routes.
// 1. Appel live → on écrit le snapshot et on sert la donnée fraîche.
// 2. Échec → on retombe sur le dernier snapshot (stale si trop vieux).
// 3. Aucun snapshot → pays indisponible, payload null.
export async function getCountryData(country: Country): Promise<CountryData> {
  try {
    const payload = await fetchCountry(country);
    const fetchedAt = new Date();
    await prisma.countrySnapshot.upsert({
      where: { country },
      create: { country, ...payload, fetchedAt },
      update: { ...payload, fetchedAt },
    });
    return {
      country,
      payload,
      freshness: {
        country,
        source: "live",
        stale: false,
        fetchedAt: fetchedAt.toISOString(),
      },
    };
  } catch (err) {
    logger.warn(
      { country, err },
      "country fetch failed, falling back to cache",
    );
    return readCache(country);
  }
}

export function getAllCountryData(): Promise<CountryData[]> {
  return Promise.all(COUNTRIES.map(getCountryData));
}

async function readCache(country: Country): Promise<CountryData> {
  const snapshot = await prisma.countrySnapshot.findUnique({
    where: { country },
  });
  if (!snapshot) {
    return {
      country,
      payload: null,
      freshness: {
        country,
        source: "unavailable",
        stale: true,
        fetchedAt: null,
      },
    };
  }

  const stale =
    Date.now() - snapshot.fetchedAt.getTime() > config.snapshotStaleMs;
  return {
    country,
    payload: {
      lots: lotsResponseSchema.parse(snapshot.lots),
      measures: measuresResponseSchema.parse(snapshot.measures),
      alerts: alertsResponseSchema.parse(snapshot.alerts),
    },
    freshness: {
      country,
      source: "cache",
      stale,
      fetchedAt: snapshot.fetchedAt.toISOString(),
    },
  };
}
