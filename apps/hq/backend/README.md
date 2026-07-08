# Headquarters Backend

## Overview

Central backend for FutureKawa. It is a **BFF / aggregator**: each country
(Brazil, Ecuador, Colombia) runs its **own** sovereign API Platform service, and
HQ **fans out to all of them in parallel, merges the results**, and exposes a
clean, frontend-friendly API. Every entity is tagged with the country it came
from. HQ holds **no business logic** of its own: no MQTT, no IoT, no alerting,
no database. It only consumes, normalizes and consolidates.

## Stack

- Express + TypeScript (strict, CommonJS)
- axios (single client, shared API key, timeout, no retry)
- zod (validates the country API responses at the boundary)
- pino / pino-http (logs)
- vitest + supertest (tests)

## Architecture

Layered, with hexagonal influences. A request flows top → bottom, and the
service layer fans out to **one adapter per country** and merges:

```
controller (HTTP)  →  service (logic)  →  adapter × N countries (country API I/O)
                                       ↘  mapper (raw → DTO, per-country id offset)
```

**Multi-country merge.** Each country API owns an independent id space (all
three start at `1`). To keep ids unique once merged, the service offsets every
emitted DTO id by a per-country factor (`slotIndex × 1_000_000`) and tags each
entity with its `source` (country code). A lot also keeps its `localWarehouseId`
(the id inside the owning API) so `/lots/:id/measures` can route the measures
call back to the right country API.

| Layer | Folder | Responsibility |
|---|---|---|
| Controllers | `src/controllers/*.controller.ts` | Express routers: input parsing/validation, HTTP status codes |
| Services | `src/services/*.service.ts` | Orchestration & business logic (aggregate, views) |
| Adapters | `src/adapters/*.adapter.ts` | Outbound gateway to the country API (HTTP, API key, IRIs) |
| Mappers | `src/mappers/*.mapper.ts` | Pure raw-API → normalized DTO transforms (anti-corruption) |
| Schemas | `src/schemas/*.schema.ts` | zod validators for the country API wire format |
| Types | `src/types/` | Domain types & interfaces (`domain.ts`, `views.ts`) and enums (`*.enum.ts`) |
| Infra | `src/lib`, `src/middleware`, `src/config` | Fallback cache, logger, error handling, config |

Tests are **co-located** as `*.spec.ts` next to the code they cover; shared test
fixtures live in `src/testing/`.

## Setup

```bash
cp .env.example .env          # then set the per-country URLs + COUNTRY_API_KEY
npm install
```

## Run

Local (dev, hot reload):

```bash
npm run dev
```

Docker:

```bash
docker compose up --build
```

The country APIs and the frontend are **not** part of this compose file (other
teams own them). Point the per-country URLs / `COUNTRY_API_KEY` at the country
APIs once they run.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `LOG_LEVEL` | `info` | pino level |
| `COUNTRY_API_URL_BRAZIL` | — | Base URL of Brazil's country API (paths add `/api/...`) |
| `COUNTRY_API_URL_ECUADOR` | — | Base URL of Ecuador's country API |
| `COUNTRY_API_URL_COLOMBIA` | — | Base URL of Colombia's country API |
| `COUNTRY_API_URL` | — | **Legacy fallback**: single URL used as one country if no per-country URL is set |
| `COUNTRY_API_KEY` | — (required) | Shared key sent as `X-API-KEY` to every country API |
| `COUNTRY_TIMEOUT_MS` | `4000` | Per-request timeout to each country API |
| `CACHE_STALE_MS` | `300000` | Age above which a country's fallback snapshot is flagged `stale` |

At least one country URL must be configured. Per-country URLs take precedence;
if none is set, HQ falls back to the legacy single `COUNTRY_API_URL` (so a
one-country deployment still works). Only the countries you configure are
queried.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe |
| GET | `/countries` | Countries with their ideal conditions + lot/alert counts |
| GET | `/lots?country=&exploitation=` | Lots sorted by `storageDate` ascending (FIFO). Optional `country`/`exploitation` id filters |
| GET | `/lots/:id` | Lot detail |
| GET | `/lots/:id/measures` | Temperature/humidity measures of the lot's warehouse (time series, ascending) |
| GET | `/alerts?country=` | Alerts, most recent first. Optional `country` id filter |
| GET | `/overview` | Dashboard: totals + lot status breakdown |

Every aggregated response carries upstream freshness in `meta`. The top-level
fields summarize the whole merged snapshot and the `countries` array breaks it
down per sovereign API:
`{ source: "live" | "cache", stale, fetchedAt, countries: [{ code, source, stale, fetchedAt }] }`.
The summary is `cache`/`stale` if **any** contributing country is.

## Country API integration

Each country API is API Platform (Symfony): camelCase fields, relations
expressed as IRIs (e.g. `"/api/countries/1"`), authenticated with `X-API-KEY`.
The client requests `Accept: application/json` to receive plain arrays. HQ
builds **one client per configured country** (`createCountryClient` /
`countryClients`) so it can fan out across the sovereign APIs in parallel.

The HQ backend consumes, per country: `/api/countries`, `/api/exploitations`,
`/api/warehouses`, `/api/batches`, `/api/alerts`, and
`/api/measures?sensor.warehouse=:id` for a lot's readings. The **only** place
coupled to that wire format is the raw zod schemas in
`src/schemas/country-api.schema.ts`; if a field is renamed upstream, change it
there (and its inferred type in `src/types/domain.ts`) and the rest of the
backend follows.

Lots and alerts are enriched with their country by resolving
`batch/alert → warehouse → country`. A lot's country is the country of the
warehouse where it is physically stored (what the IoT sensors monitor). Measures
belong to sensors, so a lot's readings are the measures of its warehouse,
fetched via the `sensor.warehouse` filter.

## Resilience (per-country fallback cache)

Each country has its **own** in-memory `FallbackCache`, so one failing API never
drags the others down. For each country, per request:

1. **Live**: refetch that country API within `COUNTRY_TIMEOUT_MS` and store the
   result (`source: "live"`).
2. **Cache**: on failure serve that country's last successful snapshot
   (`source: "cache"`, `stale` = older than `CACHE_STALE_MS`).
3. **Empty**: if a country has **never** answered, its slice degrades to empty
   and is flagged (`source: "cache"`, `stale: true`) in its per-country meta —
   the merged response still succeeds.

The service fans out over the caches in parallel, merges the slices, and rolls
the per-country freshness up into `meta`. There is **no retry** and **no
database**: a brief outage of any country degrades to its last-known-good
snapshot instead of blocking the whole response. Cached data was already
validated by zod when first fetched.

## Tests

```bash
npm run test           # vitest (run once)
npm run test:coverage  # vitest + coverage (fails under 80%)
npm run typecheck      # tsc --noEmit
```

Tests are **co-located** as `*.spec.ts` next to the code they cover; shared
fixtures/harness live in `src/testing/`.

- `config/index.spec` — per-country URL resolution, subset, legacy fallback, missing-config error.
- `mappers/domain.mapper.spec` — IRI parsing, relational mapping, per-country id offset + source tag.
- `schemas` via `adapters/country-api.adapter.spec` — HTTP calls + zod validation, per-country clients (axios mocked).
- `services/aggregate.service.spec` — fan-out, merge, id de-collision, per-country partial failure + measure routing (clients mocked).
- `services/views.service.spec` — FIFO sort, filters, per-country counts, overview (pure functions).
- `lib/cache.spec` — live / fresh-cache / stale-cache / no-cache fallback.
- `controllers/*.controller.spec` — each router in isolation via supertest (service layer mocked).
- `app.spec` — app wiring (health probe + routers mounted).

Coverage is enforced at **80%** (lines/statements/functions/branches) in
`vitest.config.ts`; the suite currently sits around **98%** lines.

## Lint & format

Powered by the [oxc](https://oxc.rs) toolchain (Rust-based, fast):

```bash
npm run lint           # oxlint (static analysis)
npm run format         # oxfmt --write (format in place)
npm run format:check   # oxfmt --check (CI: fails if unformatted)
```

Formatting uses oxfmt defaults, pinned via `.oxfmtrc.json`. CI runs `lint` +
`format:check` in the quality stage, so keep the tree formatted before pushing.

## Local decisions

- **Single source of truth for config** (`src/config`): API URL, key, timeouts.
- **Anti-corruption layer**: the wire format (`schemas/`, IRIs) → domain types
  (`types/`) → mapping (`mappers/`) are kept in separate layers, so the frontend
  contract is decoupled from the country API.
- **One data path** (`getAggregate` in `services/aggregate.service`) + **pure view
  functions** (`services/views.service`): DRY and easy to unit-test.
- **One adapter per country** (`createCountryClient`): the service fans out over
  the configured countries in parallel and merges. Adding/removing a country is
  a config change, not a code change.
- **Global-unique ids via a per-country offset**: each sovereign API reuses the
  same low ids, so HQ offsets emitted ids by `slotIndex × 1_000_000` and tags
  every entity with its `source`. Lots keep `localWarehouseId` for measure routing.
- **No database**: HQ is a stateless aggregator; resilience is a per-country
  in-memory fallback cache. A store will be reintroduced only when auth needs it.
