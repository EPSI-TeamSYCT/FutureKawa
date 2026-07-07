import { logger } from "./logger";

export type Source = "live" | "cache";

export interface Cached<T> {
  data: T;
  source: Source;
  stale: boolean;
  fetchedAt: string;
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
