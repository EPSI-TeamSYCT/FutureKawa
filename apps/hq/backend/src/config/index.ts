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

// A configured sovereign country API: a stable code (used to tag every entity
// and to build globally-unique ids across the merged snapshots) and its base URL.
export interface CountryEndpoint {
  code: string;
  url: string;
}

// The three sovereign country APIs. Each country now runs its own API, so HQ
// reads a per-country base URL. Order is stable — it drives the id offset that
// keeps entity ids unique once the three snapshots are merged.
const COUNTRY_CODES = ["BRAZIL", "ECUADOR", "COLOMBIA"] as const;

// Resolve the configured endpoints. Per-country URLs take precedence; if none
// is set we fall back to the legacy single `COUNTRY_API_URL` (backward-tolerant
// with a one-country deployment). At least one endpoint must be configured.
function resolveCountries(): CountryEndpoint[] {
  const endpoints: CountryEndpoint[] = [];
  for (const code of COUNTRY_CODES) {
    const url = process.env[`COUNTRY_API_URL_${code}`];
    if (url) endpoints.push({ code, url });
  }

  if (endpoints.length > 0) return endpoints;

  const legacy = process.env.COUNTRY_API_URL;
  if (legacy) return [{ code: "COUNTRY", url: legacy }];

  throw new Error(
    "Missing country API URLs: set COUNTRY_API_URL_BRAZIL / _ECUADOR / _COLOMBIA (or legacy COUNTRY_API_URL)",
  );
}

export const config = {
  port: intEnv("PORT", 3000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  // One shared API key authenticates every sovereign country API.
  countryApiKey: requireEnv("COUNTRY_API_KEY"),
  countries: resolveCountries(),
  countryTimeoutMs: intEnv("COUNTRY_TIMEOUT_MS", 4000),
  cacheStaleMs: intEnv("CACHE_STALE_MS", 5 * 60 * 1000),
} as const;
