import { describe, expect, it, vi } from "vitest";
import { FallbackCache } from "./cache";

describe("FallbackCache", () => {
  it("returns live data on success", async () => {
    const cache = new FallbackCache(async () => 42, 1000);
    expect(await cache.get()).toMatchObject({ data: 42, source: "live", stale: false });
  });

  it("serves the last good value when the loader fails", async () => {
    const loader = vi.fn().mockResolvedValueOnce(42).mockRejectedValue(new Error("down"));
    const cache = new FallbackCache(loader, 60_000);
    await cache.get();

    const result = await cache.get();
    expect(result).toMatchObject({ data: 42, source: "cache", stale: false });
  });

  it("flags the cached value stale once older than the threshold", async () => {
    const loader = vi.fn().mockResolvedValueOnce(42).mockRejectedValue(new Error("down"));
    const cache = new FallbackCache(loader, -1);
    await cache.get();

    expect((await cache.get()).stale).toBe(true);
  });

  it("propagates the error when nothing was ever cached", async () => {
    const cache = new FallbackCache(async () => {
      throw new Error("down");
    }, 1000);
    await expect(cache.get()).rejects.toThrow("down");
  });
});
