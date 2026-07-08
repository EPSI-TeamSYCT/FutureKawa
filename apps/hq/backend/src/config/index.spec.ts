import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The config module reads env at import time, so each case resets the module
// registry and rebuilds the environment before importing it.
const BASE = { COUNTRY_API_KEY: "test-key" };

function withEnv(env: Record<string, string>) {
  vi.resetModules();
  vi.stubEnv("COUNTRY_API_URL_BRAZIL", "");
  vi.stubEnv("COUNTRY_API_URL_ECUADOR", "");
  vi.stubEnv("COUNTRY_API_URL_COLOMBIA", "");
  vi.stubEnv("COUNTRY_API_URL", "");
  for (const [k, v] of Object.entries({ ...BASE, ...env })) vi.stubEnv(k, v);
}

const modulePath = "./index";
const load = (): Promise<typeof import("./index")> =>
  import(modulePath) as Promise<typeof import("./index")>;

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

describe("config.countries", () => {
  it("reads the per-country URLs in a stable order", async () => {
    withEnv({
      COUNTRY_API_URL_BRAZIL: "http://brazil",
      COUNTRY_API_URL_ECUADOR: "http://ecuador",
      COUNTRY_API_URL_COLOMBIA: "http://colombia",
    });
    const { config } = await load();
    expect(config.countries.map((c: { code: string }) => c.code)).toEqual([
      "BRAZIL",
      "ECUADOR",
      "COLOMBIA",
    ]);
  });

  it("works with a subset of countries configured", async () => {
    withEnv({ COUNTRY_API_URL_BRAZIL: "http://brazil" });
    const { config } = await load();
    expect(config.countries).toEqual([{ code: "BRAZIL", url: "http://brazil" }]);
  });

  it("falls back to the legacy single COUNTRY_API_URL", async () => {
    withEnv({ COUNTRY_API_URL: "http://legacy" });
    const { config } = await load();
    expect(config.countries).toEqual([{ code: "COUNTRY", url: "http://legacy" }]);
  });

  it("throws when no country URL is configured", async () => {
    withEnv({});
    await expect(load()).rejects.toThrow(/Missing country API URLs/);
  });
});
