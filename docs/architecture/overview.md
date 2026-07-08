# Architecture Overview

High-level view of the FutureKawa platform: what it does, how it splits into two
layers, and why the key technologies were chosen.

## Table of contents

- [What the system does](#what-the-system-does)
- [Two layers](#two-layers)
- [Component diagram](#component-diagram)
- [Main flows](#main-flows)
- [Technology choices](#technology-choices)
- [Related docs](#related-docs)

## What the system does

FutureKawa supervises **green-coffee storage conditions** across warehouses in
three producing countries — Brazil, Ecuador and Colombia. Sensors read
temperature and humidity, the readings flow to a per-country store, and
headquarters gets one consolidated, live view: which lots are at risk, which
warehouses drift out of their ideal band, and when to act.

Each country has its own ideal band and, **by design, keeps its own data**:

| Country | Ideal temp | Ideal humidity | Tolerance |
|---|---|---|---|
| 🇧🇷 Brazil | 29 °C | 55 % | ±3 °C / ±2 % |
| 🇪🇨 Ecuador | 31 °C | 60 % | ±3 °C / ±2 % |
| 🇨🇴 Colombia | 26 °C | 80 % | ±3 °C / ±2 % |

Lots are consumed **FIFO** (first stored, first out); alerts fire on out-of-range
conditions or on lots stored longer than 365 days.

## Two layers

| Layer | Role | Replication |
|---|---|---|
| **Country edge** | Owns the sensors, the message bus, ingestion and the country database, exposed by a REST API. | One sovereign instance **per country** |
| **Headquarters (HQ)** | Aggregates the country APIs and presents a single dashboard. Holds no business data of its own. | One central instance |

The country edge is the source of truth; HQ is a read-only consolidator.

## Component diagram

```
   ┌─────────────────── Country edge (×3, sovereign) ───────────────────┐
   │                                                                     │
   │  📡 Sensor ──MQTT──► 🦟 Mosquitto ──► ⚙️ Ingest worker ──► 🗄️ Postgres │
   │  ESP8266+DHT11 /       broker         app:mqtt:subscribe     │      │
   │  Python simulator      QoS 1                                 ▼      │
   │                                            🧩 Country API (Symfony)  │
   │                                               API Platform · REST    │
   └──────────────────────────────────────────────────────┬──────────────┘
                                                           │ HTTP + X-API-KEY
                                                           │ (per country)
              ┌──────────────── Headquarters ──────────────┴──┐
              │  🔌 HQ backend (Express/TS BFF, aggregator)    │
              │        stateless · in-memory fallback cache    │
              │                     │                          │
              │                     ▼                          │
              │  🖥️ HQ frontend (React/Vite dashboard)         │
              └────────────────────────────────────────────────┘
```

## Main flows

### 1. Measurement ingestion (per country)

1. A sensor (ESP8266 + DHT11, or the [Python simulator](../../apps/country/iot/simulator/README.md))
   publishes a JSON reading every 30 s to
   `futurekawa/<country>/<warehouse_id>/measurements` (QoS 1).
2. The **Mosquitto** broker relays it inside the country network.
3. The **ingest worker** — the Symfony command `app:mqtt:subscribe` — subscribes
   to `futurekawa/<country>/+/measurements`, matches the payload's `hardware_id`
   to a `Sensor`, and persists a `Measure` into **Postgres**.
4. The **country API** (Symfony / API Platform) serves that data over REST,
   authenticated with `X-API-KEY`.

The device is **publish-only**; alert evaluation lives in the country layer, not
on the device. See the [MQTT contract](../../packages/contracts/mqtt/measurements.md).

### 2. HQ consolidation

1. The **HQ backend** queries the country API(s) over HTTP (`/api/countries`,
   `/api/exploitations`, `/api/warehouses`, `/api/batches`, `/api/alerts`,
   `/api/measures`), validates each response at the boundary, and normalizes it.
2. It resolves cross-cutting views — a lot's country via
   `batch → warehouse → country`, FIFO ordering, per-country counts — and exposes
   a clean, frontend-friendly API.
3. The **HQ frontend** (React) renders the dashboard: lots, warehouses,
   temperature/humidity charts and alerts.

Every aggregated response carries upstream freshness in `meta`
(`source: "live" | "cache"`, `stale`, `fetchedAt`).

## Technology choices

| Choice | Why |
|---|---|
| **MQTT (Mosquitto)** | Lightweight publish/subscribe built for constrained IoT devices; QoS 1 gives at-least-once delivery over flaky field networks. Decouples sensors from ingestion. |
| **Per-country SQL (Postgres)** | Data sovereignty: each country stores and owns its own relational data. Postgres fits the strongly relational domain (country → exploitation → warehouse → batch/sensor → measure). |
| **Symfony / API Platform** | Generates a consistent REST API from the domain entities with minimal boilerplate; Doctrine models the relations cleanly and the same image runs both the API and the ingest worker. |
| **Express BFF (HQ backend)** | A thin, stateless aggregator with an anti-corruption layer over the country wire format. No DB, which keeps it easy to scale and redeploy. |
| **React / Vite (HQ frontend)** | Fast SPA tooling; Chart.js renders the time-series supervisors need. Ships with an MSW mock layer for offline demos. |

## Related docs

- [Distributed system](distributed-system.md) — topology, sovereignty, resilience, deployment.
- [Data model](data-model.md) — entities and relationships.
- App READMEs: [country/iot](../../apps/country/iot/README.md) ·
  [hq/backend](../../apps/hq/backend/README.md) ·
  [hq/frontend](../../apps/hq/frontend/README.md).
