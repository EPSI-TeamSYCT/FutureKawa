# Headquarters Backend

## Overview

Central backend for FutureKawa. It is an **aggregator / BFF**: it queries the three
country backends (Brazil, Ecuador, Colombia) over HTTP, consolidates their data, and
exposes a clean API to the frontend. It holds **no business logic** of its own: no MQTT,
no IoT, no alerting. It only consumes and consolidates.

## Stack

- Express + TypeScript (strict, CommonJS)
- Prisma 7 + PostgreSQL, **only** to cache country snapshots
  (connection via the `@prisma/adapter-pg` driver adapter; CLI/Migrate URL in `prisma.config.ts`)
- axios (simple timeout, no retry) + zod (validates country responses)
- pino / pino-http (logs)
- vitest + supertest (tests)

## Setup

```bash
cp .env.example .env         # then adjust the COUNTRY_*_URL and DATABASE_URL
npm install
docker compose up -d postgres  # Postgres must run before migrate (host port 5433)
npm run prisma:generate
npm run prisma:migrate         # creates the CountrySnapshot table
```

## Run

Local (dev, hot reload):

```bash
npm run dev
```

Docker (backend + postgres):

```bash
docker compose up --build
```

The country backends and the frontend are **not** part of this compose file (other teams
own them). Point `COUNTRY_*_URL` at them once they run. See the commented block in
`docker-compose.yml`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe |
| GET | `/countries` | Per-country state: source, stale, lot/alert counts |
| GET | `/lots?country=` | Consolidated lots, sorted by `storageDate` ascending (FIFO). Optional country filter |
| GET | `/lots/:id` | Lot detail (searched across the three countries) |
| GET | `/lots/:id/measures` | Measures of the lot's warehouse (temperature/humidity curves) |
| GET | `/alerts?country=` | Consolidated alerts, most recent first. Optional country filter |
| GET | `/overview` | Dashboard: per-country summary + global counters + freshness |

Every consolidated response carries per-country freshness in `meta` (or `countries`):
`{ country, source, stale, fetchedAt }`.

## Resilience (cache & fallback)

A single function, `getCountryData(country)`, is the only path to country data and is
reused by every route:

1. **Live**: HTTP call within `COUNTRY_TIMEOUT_MS`. On success the snapshot is saved
   (`source: "live"`, `stale: false`).
2. **Cache**: on failure (timeout/error) it reads the last snapshot from PostgreSQL.
   If one exists, it is served with `source: "cache"` and `stale` = older than
   `SNAPSHOT_STALE_MS`.
3. **Unavailable**: if no snapshot exists at all, `source: "unavailable"` and `payload`
   is `null`; that country is skipped in the consolidation but still reported.

There is **no retry**: a slow country degrades to cache instead of blocking the response.
Cached JSON is re-validated with the same zod schemas before being served, so a corrupted
snapshot is rejected rather than returned.

## Tests

```bash
npm run test
```

- Pure consolidation functions (FIFO sort, multi-country merge, unavailable country).
- `getCountryData` resilience (live / fresh cache / stale cache / unavailable).
- API routes via supertest, mocking the data layer (no real HTTP, no DB).

## Local decisions

- **Single source of truth for config** (`src/config`): country list, URLs, timeouts.
- **One data path** (`getCountryData`) + **pure consolidation functions**: DRY, easy to test.
- Prisma/PostgreSQL is a cache, not a system of record: one table, `CountrySnapshot`.
- Prisma 7: the datasource `url` lives in `prisma.config.ts` (CLI/Migrate) and the runtime
  client uses a `pg` driver adapter. `DATABASE_URL` is read from `.env` for both.
