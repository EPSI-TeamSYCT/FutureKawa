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
| 🖥️ Frontend | [`frontend/`](frontend/README.md) | React 18 · Vite · TypeScript · Chart.js · MSW | Dashboard: lots (FIFO), warehouses, temperature/humidity charts, alerts. Runs offline on MSW mocks for the demo. |

## Data flow

```
country APIs (×3) ──HTTP──► backend (aggregate + cache) ──REST──► frontend
```

The frontend talks **only** to the HQ backend, never directly to the country
APIs — the backend is the single anti-corruption boundary.

## Run

Both services ship as container images on GHCR and come up via the root
[`docker-compose.yml`](../../docker-compose.yml). See the
[deployment guide](../../docs/deployment/running-the-stack.md).
