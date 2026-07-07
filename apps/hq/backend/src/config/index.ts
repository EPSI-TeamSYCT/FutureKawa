import "dotenv/config";

export const COUNTRIES = ["brazil", "ecuador", "colombia"] as const;
export type Country = (typeof COUNTRIES)[number];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: intEnv("PORT", 3000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  databaseUrl: requireEnv("DATABASE_URL"),
  countryTimeoutMs: intEnv("COUNTRY_TIMEOUT_MS", 4000),
  snapshotStaleMs: intEnv("SNAPSHOT_STALE_MS", 5 * 60 * 1000),

  countryUrls: {
    brazil: requireEnv("COUNTRY_BRAZIL_URL"),
    ecuador: requireEnv("COUNTRY_ECUADOR_URL"),
    colombia: requireEnv("COUNTRY_COLOMBIA_URL"),
  } satisfies Record<Country, string>,
} as const;
