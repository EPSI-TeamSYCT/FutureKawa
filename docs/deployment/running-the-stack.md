# 🚀 Running the stack

How to run FutureKawa with Docker Compose. Three entry points mirror the topology:

- **Full stack (one command)** — `docker-compose.yml` at the repo root runs the
  **whole project** end-to-end for a demo/jury: one country's edge (broker +
  simulator + API + DB + ingest) **plus** the HQ (backend + frontend), all wired.
- **Country stack** — `apps/country/docker-compose.yml`, the per-country edge,
  deployed **once per country** (broker + IoT publisher + API + DB + ingest).
- **HQ-only** — the HQ half in isolation (see the full-stack file's HQ services).

## Table of contents

- [Prerequisites](#prerequisites)
- [Authenticate to GHCR](#authenticate-to-ghcr)
- [Full stack (one command)](#full-stack-one-command)
- [Country stack](#country-stack)
- [Verify the MQTT feed](#verify-the-mqtt-feed)
- [Frontend: mocks vs real backend](#frontend-mocks-vs-real-backend)
- [What is not wired yet](#what-is-not-wired-yet)
- [Developer mode (per app)](#developer-mode-per-app)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2
- Access to the `EPSI-TeamSYCT` GHCR packages (or make them public for a demo)

## Authenticate to GHCR

Images are **private** GHCR packages, so log in first with a token that has the
`read:packages` scope:

```bash
# with the GitHub CLI
gh auth refresh -h github.com -s read:packages
gh auth token | docker login ghcr.io -u <your-github-user> --password-stdin

# or with a classic PAT (read:packages)
docker login ghcr.io -u <your-github-user>
```

> 💡 For the jury demo you can instead make each package **public** (Package →
> _Package settings_ → _Change visibility_) and skip the login entirely.

## Full stack (one command)

The repo-root `docker-compose.yml` is the project's **main** compose. It reuses
the per-country edge stack (via Compose `include:` of
`apps/country/docker-compose.yml`, **not** duplicated) for one country (Brazil)
and adds the HQ layer, so a single `up` brings the whole system online:

```bash
docker login ghcr.io       # images are private GHCR packages (see below)
cp .env.example .env        # set APP_SECRET, DB_PASSWORD, COUNTRY_API_KEY…
docker compose up -d --build
```

Everything shares one Docker network (`futurekawa_default`), so services reach
each other by name — the HQ backend calls `http://country-api:8000` directly.

| Service | Port | Notes |
|---|---|---|
| `mosquitto` | `1883` | MQTT broker (the country's local bus). |
| `iot-simulator` | — | Publishes `futurekawa/brazil/<wh>/measurements`. |
| `country-db` | — | Postgres 16 (internal only). |
| `migrate` | — | One-shot Doctrine migration, then exits (creates tables). |
| `country-api` | `8000` | Symfony / API Platform. Reachable at `/api`. |
| `ingest-worker` | — | MQTT → DB consumer (`app:mqtt:subscribe`). |
| `backend` | `3000` | HQ aggregator/BFF. Reads `COUNTRY_API_URL` (single-URL today). |
| `frontend` | `8080` | React SPA (nginx). Runs on offline mocks by default. |

```bash
docker compose ps        # status
docker compose logs -f   # follow logs
docker compose down      # stop (add -v to also drop the DB volume)
```

### Database initialisation (migration)

The country DB starts empty; the `migrate` service runs
`doctrine:migrations:migrate` once the DB is healthy, creating the schema before
the API serves data. It is idempotent (re-running against a migrated DB is a
no-op). Compose `include:` seals the imported `country-api`/`ingest-worker`, so
they cannot be given an extra `depends_on: migrate`; the migration is quick, so
in practice the schema lands within a second or two of the API booting. For a
**strictly ordered** start, run the migration first, then the rest:

```bash
docker compose up -d migrate   # waits for the DB, migrates, exits
docker compose up -d           # brings up everything else
```

Watch it succeed with `docker compose logs migrate` — expect
`[OK] Successfully migrated to version: …`.

### Smoke test

```bash
curl -fsS localhost:8000/api            # country API up
curl -fsS localhost:3000/health         # HQ backend → {"status":"ok"}
curl -fsS -o /dev/null -w '%{http_code}\n' localhost:8080   # frontend → 200
```

> ⚠️ **Known issue (owned by the country-api image).** The published
> `futurekawa-country-api` prod image ships **without an `/app/.env`** file, but
> the Symfony runtime still probes for one, so `country-api` and `ingest-worker`
> crash on boot (`Unable to read the "/app/.env" environment file`) and the
> worker crash-loops. The full-stack `migrate` service works around this locally
> (it creates an empty `.env` and passes `?serverVersion=16` in `DATABASE_URL`),
> but the fix belongs in `apps/country/api/Dockerfile` (e.g. `composer dump-env
> prod` or committing a minimal `.env`). Until then, the **MQTT publish path**
> (simulator → broker) works end-to-end; the **persist/read path**
> (worker → DB → API → backend) needs that image fix.

## HQ services in isolation

To run only the HQ half, target its two services from the root compose:

```bash
docker compose up -d backend frontend
```

(They still expect a reachable `country-api`; point `COUNTRY_API_URL` at an
external one in `.env` if the edge is not running.)

## Country stack

Deployed **once per country**. Configuration is a per-country `.env`:

```bash
cd apps/country
cp .env.example .env      # set COUNTRY, DEVICES, thresholds
docker compose up -d
```

Key variables (see `.env.example`):

| Variable | Example | Meaning |
|---|---|---|
| `COUNTRY` | `brazil` | Country id (drives the MQTT topic) |
| `DEVICES` | `[{"warehouse":"wh-01","hardware_id":"br-wh-01"}]` | One JSON object per IoT device |
| `TEMP_THRESHOLD` / `HUMIDITY_THRESHOLD` | `29` / `55` | Ideal band (BR 29/55 · EC 31/60 · CO 26/80) |
| `PUBLISH_INTERVAL` | `30` | Seconds between publications |
| `REGISTRY` / `IMAGE_TAG` | `ghcr.io/epsi-teamsyct` / `latest` | Image source |

To run all three countries on one host, use a separate `.env` + project name per
country (the compose `name:` already includes `${COUNTRY}`), e.g.:

```bash
COUNTRY=ecuador docker compose --env-file .env.ecuador up -d
```

## Verify the MQTT feed

Subscribe to the broker from inside the compose network. The network name is
`<project>_default` — `futurekawa_default` for the full stack, or
`futurekawa-<country>_default` for a standalone country stack:

```bash
# full stack (repo root)
docker run --rm -it --network futurekawa_default eclipse-mosquitto:2 \
  mosquitto_sub -h mosquitto -t 'futurekawa/#' -v

# standalone country stack (apps/country)
docker run --rm -it --network futurekawa-brazil_default eclipse-mosquitto:2 \
  mosquitto_sub -h mosquitto -t 'futurekawa/#' -v
```

Expected (one line per device, every `PUBLISH_INTERVAL` seconds):

```
futurekawa/brazil/wh-01/measurements {"warehouse_id":"wh-01","country":"brazil","model":"DHT11","hardware_id":"br-wh-01","temperature":24.3,"humidity":49.9,"timestamp":1783454596}
```

The payload contract lives in
[`packages/contracts`](../../packages/contracts/README.md).

## Frontend: mocks vs real backend

The published frontend image is built with `VITE_USE_MOCKS=true`, so it serves a
**fully offline** demo (MSW mock layer) — ideal for the jury, but it **ignores
the backend**. Vite inlines `VITE_*` at build time, so switching to a real
backend means **rebuilding** the image:

```bash
docker build \
  --build-arg VITE_USE_MOCKS=false \
  --build-arg VITE_API_URL=http://localhost:3000 \
  -t ghcr.io/epsi-teamsyct/futurekawa-hq-frontend:local \
  apps/hq/frontend
```

## What is not wired yet

- **Multi-country edge** — the full stack runs **one** country (Brazil). Ecuador
  and Colombia edges are kept as commented placeholders; add them once the
  backend merges multiple APIs.
- **Backend multi-URL** — the HQ backend currently reads a single
  `COUNTRY_API_URL`; true per-country aggregation needs it extended to query the
  three sovereign APIs and merge. The 3-country target vars are present but
  commented in the root compose and `.env.example`.
- **country-api `/app/.env` boot crash** — see the Known issue above; the
  persist/read path is blocked on an image fix in `apps/country/api/Dockerfile`.

## Developer mode (per app)

To run a single service from source (hot reload) instead of its image, follow
its own README:

- [IoT simulator](../../apps/country/iot/simulator/README.md)
- [HQ backend](../../apps/hq/backend/README.md)
- [HQ frontend](../../apps/hq/frontend/README.md)
