import { logger } from "./logger";

type Source = "live" | "cache";

export interface Cached<T> {
  data: T;
  source: Source;
  stale: boolean;
  fetchedAt: string;
}

// Freshness of one sovereign country API within a merged response.
export interface CountryMeta {
  code: string;
  source: Source;
  stale: boolean;
  fetchedAt: string;
}

// Response-level freshness. `source`/`stale`/`fetchedAt` summarize the whole
// merged snapshot (backward-compatible with the single-country shape);
// `countries` breaks it down per sovereign API.
export interface Meta {
  source: Source;
  stale: boolean;
  fetchedAt: string;
  countries: CountryMeta[];
}

// Last-known-good fallback cache. Every call refetches live; on failure it
// serves the previous value (flagged `stale` once older than `staleMs`). This
// keeps HQ responsive when the country API is briefly down, without any
// database. If nothing has ever been fetched, the error propagates.
export class FallbackCache<T> {
  private last: { data: T; at: number } | null = null;

  constructor(
    private readonly loader: () => Promise<T>,
    private readonly staleMs: number,
  ) {}

  async get(): Promise<Cached<T>> {
    try {
      const data = await this.loader();
      this.last = { data, at: Date.now() };
      return {
        data,
        source: "live",
        stale: false,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (!this.last) throw err;
      logger.warn({ err }, "country API unreachable, serving cached snapshot");
      return {
        data: this.last.data,
        source: "cache",
        stale: Date.now() - this.last.at > this.staleMs,
        fetchedAt: new Date(this.last.at).toISOString(),
      };
    }
  }
}

// Roll per-country freshness up into the response-level summary: the merged
// snapshot is "cache" if any country degraded to its cache, and "stale" if any
// served country is stale. `fetchedAt` is the oldest contributing snapshot.
export function summarizeMeta(countries: CountryMeta[]): Meta {
  const source: Source = countries.some((c) => c.source === "cache") ? "cache" : "live";
  const stale = countries.some((c) => c.stale);
  const fetchedAt = countries.reduce(
    (oldest, c) => (c.fetchedAt < oldest ? c.fetchedAt : oldest),
    countries[0]?.fetchedAt ?? new Date().toISOString(),
  );
  return { source, stale, fetchedAt, countries };
}
