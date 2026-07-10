# 🏢 Headquarters (HQ)

The central layer of **FutureKawa**. It owns **no business data** of its own: it
**aggregates** the sovereign country APIs and presents a single, consolidated
view of the three countries (Brazil, Ecuador, Colombia).

```
hq/
├── backend/    🔌  aggregator / BFF over the country APIs (Express + TypeScript)
└── frontend/   🖥️  supervision SPA (React + Vite + TypeScript)
```

## Services

| Service | Path | Stack | Role |
|---|---|---|---|
| 🔌 Backend | [`backend/`](backend/README.md) | Express · TypeScript · axios · zod · pino | BFF/aggregator: queries the country APIs, normalizes, exposes a clean frontend-facing API. Stateless (in-memory fallback cache, no DB). |
| 🖥️ Frontend | [`frontend/`](frontend/README.md) | React 18 · Vite · TypeScript · Chart.js | Dashboard: lots (FIFO), warehouses, temperature/humidity charts, alerts. Talks to the backend through its `/hq` nginx proxy (same-origin, no CORS). |

## Data flow

```
country APIs (×3) ──HTTP──► backend (aggregate + cache) ──REST──► frontend
```

The frontend talks **only** to the HQ backend, never directly to the country
APIs — the backend is the single anti-corruption boundary.

## Run

Both services ship as container images (built & pushed by the CD workflows) and
come up together via the root [`docker-compose.yml`](../../docker-compose.yml)
for the all-in-one demo. See the
[deployment guide](../../docs/deployment/running-the-stack.md).

## Deploy the HQ ("siège") edge in production

[`docker-compose.yml`](docker-compose.yml) is the standalone **prod artifact**
for the central layer — the analogue of the per-country edge. It pulls the two
images and publishes the SPA under one subdomain via Traefik; the backend stays
internal and reaches the three sovereign country APIs over public HTTPS.

```bash
cp .env.example .env      # set REGISTRY, SIEGE_DOMAIN, COUNTRY_API_URL_*, COUNTRY_API_KEY
docker compose pull
docker compose up -d
```

- **Public URL** — `https://siege.futurekawa.thom-it.fr/` (Traefik → `frontend:8080`).
- **Country APIs** — `COUNTRY_API_URL_{BRAZIL,ECUADOR,COLOMBIA}` are **base URLs
  only** (e.g. `https://api.brazil.futurekawa.thom-it.fr`); the backend appends
  `/api/...` itself. `COUNTRY_API_KEY` must match each country deployment's key.
- **Traefik** — expects an external `web` network and a `websecure` entrypoint
  with an ACME `le` certresolver (override via `.env` to match your setup).
