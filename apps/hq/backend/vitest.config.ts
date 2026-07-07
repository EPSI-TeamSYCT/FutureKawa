import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      COUNTRY_API_URL: "http://country.test",
      COUNTRY_API_KEY: "test-key",
      CACHE_STALE_MS: "300000",
      LOG_LEVEL: "silent",
    },
  },
});
