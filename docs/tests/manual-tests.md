# 🧑‍🔬 Running the tests manually

This is livrable 6: how to run **each service's tests by hand**, with exact,
copy-pasteable commands. Every command below is the same one CI runs, so a green
local run predicts a green pipeline. For the strategy behind the suites see the
[test strategy](./strategy.md); for the pipeline itself see
[the CI/CD pipeline](../ci-cd/pipeline.md).

## Table of contents

- [Prerequisites](#prerequisites)
- [HQ backend (Node / TypeScript)](#hq-backend-node--typescript)
- [HQ frontend (React / Vite)](#hq-frontend-react--vite)
- [Country API (Symfony / PHP)](#country-api-symfony--php)
- [IoT simulator (Python)](#iot-simulator-python)
- [End-to-end MQTT check](#-e2e-mqtt-check)
- [Where to read results & logs](#where-to-read-results--logs)

## Prerequisites

Install only what you need for the service you are testing.

| Service | Toolchain | Version |
|---|---|---|
| HQ backend / frontend | **Node** + npm | Node 22 |
| Country API | **PHP** + Composer 2 (+ `pcov` for coverage) | PHP 8.4 |
| IoT simulator | **[uv](https://docs.astral.sh/uv/)** (provisions Python) | Python ≥ 3.10 |
| E2E MQTT | **Docker** + Docker Compose v2 | — |

> 💡 No cloud access is required. Tests use synthetic data (fixtures, MSW mocks,
> seeded random) — no country database and no live broker needed, except the
> optional [end-to-end MQTT check](#-e2e-mqtt-check).

## HQ backend (Node / TypeScript)

```bash
cd apps/hq/backend
npm install               # once
npm run test              # vitest, run once
npm run test:coverage     # vitest + coverage (fails under 80%)
npm run typecheck         # tsc --noEmit
```

- **Env vars:** none required for tests — the country API is mocked (axios stubbed
  in `*.spec.ts`). `COUNTRY_API_URL` / `COUNTRY_API_KEY` matter only when you *run*
  the service, not when you test it.
- **Data set:** static fixtures in `src/testing/`.
- **What is covered:** mappers (IRI parsing), adapter + zod schemas (HTTP mocked),
  aggregate/views services, `lib/cache` fallback (live / fresh / stale / no-cache),
  each controller in isolation via Supertest, and app wiring (`/health` + routers).

## HQ frontend (React / Vite)

```bash
cd apps/hq/frontend
npm install               # once
npm test                  # vitest, run once
npm run test:coverage     # vitest + coverage (80% gate on src/lib)
npm run test:ui           # optional: interactive Vitest UI
```

- **Env vars:** none — tests run in `jsdom` against the MSW mock layer, fully
  offline.
- **Data set:** MSW handlers + in-test fixtures.
- **What is covered:** the pure business logic in `src/lib` (thresholds, FIFO,
  drift, lot status, formatting, country lookup) plus a few component tests
  (`ConditionsGauge`, `LotStatusBadge`) and the `useCountryFilter` hook. The 80 %
  gate applies to `src/lib` only — UI rendering is intentionally out of scope.

## Country API (Symfony / PHP)

```bash
cd apps/country/api
composer install                              # once
APP_ENV=test APP_SECRET=ci composer quality   # lint:yaml + lint:container + php-cs-fixer + phpstan
composer security                             # composer audit (CVE)
APP_ENV=test APP_SECRET=ci composer test      # phpunit
APP_ENV=test APP_SECRET=ci composer test:coverage  # phpunit + coverage.xml (needs pcov/xdebug)
```

- **Env vars:** `APP_ENV=test`, `APP_SECRET=ci` (any non-empty value). Coverage
  needs a coverage driver enabled (`pcov` in CI).
- **Data set:** current tests are **unit tests with no database**. When DB-backed
  functional tests land, add a Postgres service + `doctrine:database:create` +
  `migrate` (see the note in `ci-country-api.yml`).
- **One-shot pipeline:** `composer ci` runs `quality → security → test:coverage`
  in order, exactly like CI.

## IoT simulator (Python)

```bash
cd apps/country/iot/simulator
uv sync                   # once: provisions Python + deps
uv run pytest             # tests + coverage (fails under 80%)
uv run poe test           # same, via the task runner
uv run poe ci             # full local pipeline: quality → security → test
```

Individual stages, if you want to isolate a failure:

```bash
uv run poe quality        # ruff (lint + format check) · mypy · vulture
uv run poe security       # pip-audit (CVE)
uv run poe lint           # ruff check only
uv run poe format         # auto-fix formatting
```

- **Env vars:** none for the unit suite. For reproducible readings across runs,
  set `RANDOM_SEED`.
- **Data set:** generated in-process (seeded random walk); no broker needed for
  the unit suite.

## 📡 E2E MQTT check

To confirm the worker really speaks the MQTT contract end-to-end, run it against a
**live broker** and watch the topic. Start the broker + simulator fleet, then
subscribe:

```bash
cd apps/country/iot/simulator
docker compose up --build                                   # broker + simulated countries
docker exec -it futurekawa-mosquitto mosquitto_sub -t "futurekawa/#" -v
```

Expected — one line per device, every `PUBLISH_INTERVAL` seconds:

```
futurekawa/brazil/wh-01/measurements {"warehouse_id":"wh-01","country":"brazil","model":"DHT11","hardware_id":"br-wh-01","temperature":24.3,"humidity":49.9,"timestamp":1783454596}
```

> 💡 A scripted spec-verification helper (`e2e_sim.py`) drives real worker
> instances against a real broker and asserts the contract claims (topic format,
> payload keys/types, threshold band, anomaly injection, per-country isolation,
> new-country-zero-code). It is an engineering aid; the canonical, always-run tests
> are the `uv run pytest` suite above. See also
> [Verify the MQTT feed](../deployment/running-the-stack.md#verify-the-mqtt-feed).

## Where to read results & logs

| Output | Location |
|---|---|
| Pass/fail + failing assertions | Terminal (Vitest / PHPUnit / pytest reporter) |
| Coverage summary | Terminal (v8 / `--coverage-text` / `term-missing`) |
| Coverage report files | `apps/*/coverage/` (JS), `apps/country/api/coverage.xml` (Clover) |
| Country API coverage detail | `composer test:coverage` prints per-line misses |
| CI results | GitHub Actions **Checks** tab on the PR (per-service jobs) |
| Quality Gate | SonarCloud project dashboard (blocks the merge on failure) |

> ⚠️ If `composer test:coverage` reports "no code coverage driver available",
> enable **pcov** or **Xdebug** — the plain `composer test` runs without it.
