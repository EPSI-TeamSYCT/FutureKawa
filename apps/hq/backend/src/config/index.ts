import "dotenv/config";

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
  countryApiUrl: requireEnv("COUNTRY_API_URL"),
  countryApiKey: requireEnv("COUNTRY_API_KEY"),
  countryTimeoutMs: intEnv("COUNTRY_TIMEOUT_MS", 4000),
  cacheStaleMs: intEnv("CACHE_STALE_MS", 5 * 60 * 1000),
} as const;
