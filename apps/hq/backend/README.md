# Headquarters Backend

## Overview

Central backend for FutureKawa. It is a **BFF / aggregator**: it queries the
country API (a single shared API Platform service that already holds the three
countries) over HTTP, resolves its relational data, and exposes a clean,
frontend-friendly API. It holds **no business logic** of its own: no MQTT, no
IoT, no alerting, no database. It only consumes, normalizes and consolidates.

## Stack

- Express + TypeScript (strict, CommonJS)
- axios (single client, shared API key, timeout, no retry)
- zod (validates the country API responses at the boundary)
- pino / pino-http (logs)
- vitest + supertest (tests)

## Architecture

Layered, with hexagonal influences. A request flows top → bottom:

```
controller (HTTP)  →  service (logic)  →  adapter (country API I/O)
                                       ↘  mapper (raw → DTO)
```

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
cp .env.example .env          # then set COUNTRY_API_URL and COUNTRY_API_KEY
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

The country API and the frontend are **not** part of this compose file (other
teams own them). Point `COUNTRY_API_URL` / `COUNTRY_API_KEY` at the country API
once it runs.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `LOG_LEVEL` | `info` | pino level |
| `COUNTRY_API_URL` | — (required) | Base URL of the country API (paths add `/api/...`) |
| `COUNTRY_API_KEY` | — (required) | Shared key sent as `X-API-KEY` |
| `COUNTRY_TIMEOUT_MS` | `4000` | Per-request timeout to the country API |
| `CACHE_STALE_MS` | `300000` | Age above which the fallback snapshot is flagged `stale` |

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

Every aggregated response carries upstream freshness in `meta`:
`{ source: "live" | "cache", stale, fetchedAt }`.

## Country API integration

The country API is API Platform (Symfony): camelCase fields, relations expressed
as IRIs (e.g. `"/api/countries/1"`), authenticated with `X-API-KEY`. The client
requests `Accept: application/json` to receive plain arrays.

The HQ backend consumes: `/api/countries`, `/api/exploitations`,
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

## Resilience (fallback cache)

A single in-memory `FallbackCache` fronts the aggregate:

1. **Live**: every request refetches the country API within `COUNTRY_TIMEOUT_MS`
   and stores the result (`source: "live"`).
2. **Cache**: on failure it serves the last successful snapshot (`source:
   "cache"`, `stale` = older than `CACHE_STALE_MS`).
3. If the country API has **never** answered, the error propagates (5xx).

There is **no retry** and **no database**: a brief upstream outage degrades to
the last-known-good snapshot instead of blocking. Cached data was already
validated by zod when first fetched.

## Tests

```bash
npm run test        # vitest
npm run typecheck   # tsc --noEmit
```

Co-located `*.spec.ts` files:

- `mappers/domain.mapper.spec` — IRI parsing and relational mapping (country resolved via warehouse).
- `services/views.service.spec` — FIFO sort, filters, per-country counts, overview (pure functions).
- `lib/cache.spec` — live / fresh-cache / stale-cache / no-cache fallback.
- `app.spec` — API routes via supertest, mocking the aggregate layer (no real HTTP).

## Local decisions

- **Single source of truth for config** (`src/config`): API URL, key, timeouts.
- **Anti-corruption layer**: the wire format (`schemas/`, IRIs) → domain types
  (`types/`) → mapping (`mappers/`) are kept in separate layers, so the frontend
  contract is decoupled from the country API.
- **One data path** (`getAggregate` in `services/aggregate.service`) + **pure view
  functions** (`services/views.service`): DRY and easy to unit-test.
- **No database**: HQ is a stateless aggregator; resilience is an in-memory
  fallback cache. A store will be reintroduced only when authentication needs it.
