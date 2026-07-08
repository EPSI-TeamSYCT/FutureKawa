# 🚀 Running the stack

How to run FutureKawa with Docker Compose. Two entry points mirror the topology:

- **Full stack (one command)** — `docker-compose.yml` at the repo root runs the
  **whole project** end-to-end for a demo/jury: the **three sovereign country
  edges** (Brazil, Ecuador, Colombia) **plus** the HQ (backend + frontend), all
  wired on one network.
- **Country stack** — `apps/country/docker-compose.yml`, a **single** country
  edge (broker + simulator + API + DB + ingest), the artifact deployed per
  country in production.

## Table of contents

- [Prerequisites](#prerequisites)
- [Authenticate to GHCR](#authenticate-to-ghcr)
- [Full stack (one command)](#full-stack-one-command)
- [Migration & seed](#migration--seed)
- [Smoke test](#smoke-test)
- [Verify the MQTT feed](#verify-the-mqtt-feed)
- [Frontend ↔ backend](#frontend--backend)
- [Country stack (single country)](#country-stack-single-country)
- [Developer mode (per app)](#developer-mode-per-app)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2
- Access to the `EPSI-TeamSYCT` GHCR packages (or make them public for a demo)

## Authenticate to GHCR

Images are **private** GHCR packages, so log in first with a token that has the
`read:packages` scope:

```bash
gh auth refresh -h github.com -s read:packages
gh auth token | docker login ghcr.io -u <your-github-user> --password-stdin
# or a classic PAT: docker login ghcr.io -u <your-github-user>
```

> 💡 For the jury demo you can instead make each package **public** (Package →
> _Package settings_ → _Change visibility_) and skip the login entirely.

## Full stack (one command)

The repo-root `docker-compose.yml` brings the **complete system** online — three
country edges + HQ — with a single command. All custom images are **pulled** from
GHCR (built once by the CD); nothing is built here.

```bash
docker login ghcr.io       # images are private GHCR packages
cp .env.example .env        # set APP_SECRET, DB_PASSWORD, COUNTRY_API_KEY
docker compose up -d
```

Everything shares one Docker network (`futurekawa_default`), so services reach
each other by name — the HQ backend calls `http://brazil-api:8000`,
`http://ecuador-api:8000` and `http://colombia-api:8000` directly.

Per country `<c>` (`brazil` · `ecuador` · `colombia`):

| Service | Host port | Role |
|---|---|---|
| `<c>-broker` | — | MQTT broker (the country's local bus) |
| `<c>-db` | — | Postgres 16 (internal, data sovereignty) |
| `<c>-migrate` | — | one-shot: `doctrine:migrations:migrate` + `app:seed`, then exits |
| `<c>-api` | `8001/8002/8003` | Symfony / API Platform (optional direct access) |
| `<c>-worker` | — | MQTT → DB consumer (`app:mqtt:subscribe`) |
| `<c>-sim` | — | IoT simulator (publishes `futurekawa/<c>/…/measurements`) |

HQ:

| Service | Host port | Role |
|---|---|---|
| `backend` | `3000` | aggregator/BFF — queries the three country APIs and merges |
| `frontend` | `8080` | React SPA (nginx) — offline mocks by default (see below) |

```bash
docker compose ps        # status
docker compose logs -f   # follow logs
docker compose down      # stop (add -v to also drop the DB volumes)
```

> ⚠️ **Pre-merge only.** This branch adds code that is not yet in the published
> images: `app:seed` (country-api) and the 3-country aggregation (hq-backend).
> Until the branch merges and the CD republishes them, build both locally so the
> pull-only `:latest` tags carry the new code:
>
> ```bash
> docker build -t ghcr.io/epsi-teamsyct/futurekawa-country-api:latest apps/country/api
> docker build -t ghcr.io/epsi-teamsyct/futurekawa-hq-backend:latest apps/hq/backend
> docker compose up -d
> ```

## Migration & seed

Each country DB starts empty. Its `<c>-migrate` one-shot waits for the DB to be
healthy, runs `doctrine:migrations:migrate` (schema), then `app:seed` (demo data
for that country — real warehouses like *Santos-01*, *Guayaquil-02*,
*Medellín-01*, with sensors whose `hardware_id` matches the simulator). Both are
**idempotent**. The `<c>-api` and `<c>-worker` services wait for it via
`depends_on: { condition: service_completed_successfully }`, so they only start
once the schema + seed are in place.

```bash
docker compose logs brazil-migrate   # [OK] migrated … then "seeded brazil"
```

## Smoke test

```bash
# each sovereign country API is up (returns the API Platform entrypoint)
curl -fsS localhost:8001/api >/dev/null && echo "brazil ok"
curl -fsS localhost:8002/api >/dev/null && echo "ecuador ok"
curl -fsS localhost:8003/api >/dev/null && echo "colombia ok"

# HQ backend consolidates the three countries
curl -fsS localhost:3000/health                       # {"status":"ok"}
curl -fsS localhost:3000/overview | grep -o '"country":"[^"]*"' | sort -u   # 3 countries

# frontend
curl -fsS -o /dev/null -w '%{http_code}\n' localhost:8080   # 200
```

## Verify the MQTT feed

Each country has its own broker. Subscribe from inside the compose network
(`futurekawa_default`):

```bash
docker run --rm -it --network futurekawa_default eclipse-mosquitto:2 \
  mosquitto_sub -h brazil-broker -t 'futurekawa/#' -v      # or ecuador-broker / colombia-broker
```

Expected (one line per device, every `PUBLISH_INTERVAL` seconds):

```
futurekawa/brazil/SAN-01/measurements {"warehouse_id":"SAN-01","country":"brazil","model":"DHT11","hardware_id":"br-san-01","temperature":24.3,"humidity":49.9,"timestamp":1783454596}
```

The payload contract lives in
[`packages/contracts`](../../packages/contracts/README.md).

## Frontend ↔ backend

The SPA reaches the HQ backend through its built-in **`/hq` reverse proxy**
(nginx → `central-backend:3000`), so it stays **same-origin** (no CORS). The
offline MSW mock layer was removed, so the frontend **always** talks to the real
backend — the published image works as-is, nothing to rebuild. It only needs the
backend reachable under the **`central-backend`** network alias (set on the
`backend` service in the compose).

> ⚠️ The API base path `/hq` is baked into the SPA (`const HQ = "/hq"`). Do **not**
> also set `VITE_API_URL=/hq` at build time — that double-prefixes to `/hq/hq/…`
> and every call 404s. Leave `VITE_API_URL` empty for the proxy setup.

## Country stack (single country)

`apps/country/docker-compose.yml` runs **one** country edge — the artifact
deployed per country in production. Configuration is a per-country `.env`:

```bash
cd apps/country
cp .env.example .env      # set COUNTRY, DEVICES, thresholds, DB_PASSWORD, APP_SECRET
docker compose up -d
```

Key variables (see `.env.example`):

| Variable | Example | Meaning |
|---|---|---|
| `COUNTRY` | `brazil` | Country id (drives the MQTT topic + which data `app:seed` loads) |
| `DEVICES` | `[{"warehouse":"SAN-01","hardware_id":"br-san-01"}]` | One JSON object per IoT device |
| `TEMP_THRESHOLD` / `HUMIDITY_THRESHOLD` | `29` / `55` | Ideal band (BR 29/55 · EC 31/60 · CO 26/80) |
| `PUBLISH_INTERVAL` | `30` | Seconds between publications |
| `REGISTRY` / `IMAGE_TAG` | `ghcr.io/epsi-teamsyct` / `latest` | Image source |

Like the full stack, it runs a `migrate` one-shot (schema + seed) before the API
and worker start.

## Developer mode (per app)

To run a single service from source (hot reload) instead of its image, follow
its own README:

- [IoT simulator](../../apps/country/iot/simulator/README.md)
- [HQ backend](../../apps/hq/backend/README.md)
- [HQ frontend](../../apps/hq/frontend/README.md)
