import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/testing/**",
        "src/types/**", // type/interface declarations: no runtime code
        "src/index.ts", // bootstrap (app.listen)
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
    env: {
      COUNTRY_API_URL: "http://country.test",
      COUNTRY_API_KEY: "test-key",
      CACHE_STALE_MS: "300000",
      LOG_LEVEL: "silent",
    },
  },
});
