# 🚀 Running the stack

How to run FutureKawa with Docker Compose. Two stacks mirror the topology:

- **HQ stack** — `docker-compose.yml` at the repo root (backend + frontend).
- **Country stack** — `apps/country/docker-compose.yml`, deployed **once per
  country** (broker + IoT publisher; API/DB/ingest as they land).

## Table of contents

- [Prerequisites](#prerequisites)
- [Authenticate to GHCR](#authenticate-to-ghcr)
- [HQ stack](#hq-stack)
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

## HQ stack

From the repo **root**:

```bash
cp .env.example .env       # optional: REGISTRY, IMAGE_TAG, COUNTRY_API_KEY…
docker compose up -d
```

| Service | Port | Notes |
|---|---|---|
| `backend` | `3000` | Aggregator/BFF. Reads `COUNTRY_API_URL` (single-URL today). |
| `frontend` | `8080` | React SPA (nginx). Runs on offline mocks by default. |

```bash
docker compose ps        # status
docker compose logs -f   # follow logs
docker compose down      # stop
```

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

Subscribe to the broker from inside the country's compose network:

```bash
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

Kept as commented, ready-to-enable blocks in the compose files:

- **`ingest-worker`** — the MQTT → DB consumer (not implemented).
- **`country-api` + `country-db`** — the Symfony API and its datastore (in progress).
- **Backend multi-URL** — the HQ backend currently reads a single
  `COUNTRY_API_URL`; true per-country aggregation needs it extended to query the
  three sovereign APIs and merge.

## Developer mode (per app)

To run a single service from source (hot reload) instead of its image, follow
its own README:

- [IoT simulator](../../apps/country/iot/simulator/README.md)
- [HQ backend](../../apps/hq/backend/README.md)
- [HQ frontend](../../apps/hq/frontend/README.md)
