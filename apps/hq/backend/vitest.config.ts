import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      COUNTRY_BRAZIL_URL: "http://brazil.test",
      COUNTRY_ECUADOR_URL: "http://ecuador.test",
      COUNTRY_COLOMBIA_URL: "http://colombia.test",
      DATABASE_URL: "postgresql://test",
      SNAPSHOT_STALE_MS: "300000",
      LOG_LEVEL: "silent",
    },
  },
});
