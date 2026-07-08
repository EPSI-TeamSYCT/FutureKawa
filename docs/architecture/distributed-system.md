# Distributed System

How FutureKawa is distributed across countries and headquarters: the topology,
data sovereignty, fan-out, resilience, scaling and the deployment shape.

## Table of contents

- [Topology](#topology)
- [Data sovereignty](#data-sovereignty)
- [HQ fan-out](#hq-fan-out)
- [Resilience & fault tolerance](#resilience--fault-tolerance)
- [Scaling](#scaling)
- [Deployment shape](#deployment-shape)
- [Related docs](#related-docs)

## Topology

FutureKawa is a **hub-and-spoke** system:

- **Spokes** — one sovereign **country edge** per country (Brazil, Ecuador,
  Colombia). Each is self-contained: broker + sensors + ingest worker + database
  + REST API. A country runs and stores data independently of the others.
- **Hub** — a single **headquarters** layer that reads the country APIs over HTTP
  and consolidates them for the dashboard.

Communication crosses a boundary only **once**, HQ → country, over authenticated
HTTP. Countries never talk to each other, and the hub holds no country data of
its own — so there is no cross-country consistency problem to solve.

```
 Brazil edge ─┐
 Ecuador edge ─┼── HTTP (X-API-KEY) ──► HQ backend ──► HQ frontend
 Colombia edge ┘        (read-only fan-out)
```

## Data sovereignty

Each country **keeps its own data** in its own Postgres database, inside its own
stack. This is a first-class design constraint, not an accident of deployment:

- One `docker-compose.yml` under [`apps/country`](../../apps/country/docker-compose.yml)
  is deployed **once per country**, parameterised by an `.env` (`COUNTRY`,
  thresholds, DB credentials). The same image ships everywhere; no code fork.
- The country database is only ever written by that country's ingest worker and
  read by that country's API. HQ receives a **projection** over HTTP, never a
  direct database connection.
- The country API gates every `/api/*` route with a shared **`X-API-KEY`**
  (constant-time compared), so only trusted callers (HQ) read the data.

## HQ fan-out

The HQ backend is a **BFF / aggregator** with **no database of its own**. Per
request it fans out to the country API(s), validates the responses at the
boundary (zod), maps the wire format to clean domain types, and derives views:

| Concern | How HQ resolves it |
|---|---|
| A lot's country | `batch → warehouse → country` (a lot's country is where it is physically stored) |
| A lot's readings | `measures` filtered by `sensor.warehouse` of the lot's warehouse |
| FIFO ordering | lots sorted by `storageDate` ascending |
| Per-country counts | grouped over the normalized aggregate |

> **Current vs. target.** The backend today reads a single `COUNTRY_API_URL`.
> The 3-country target — one URL per country, merged — is wired as env in the
> [HQ compose file](../../docker-compose.yml)
> (`COUNTRY_API_URL_BRAZIL/ECUADOR/COLOMBIA`) and needs a small backend evolution
> to merge multiple upstreams. The topology above is the target contract.

See the [HQ backend README](../../apps/hq/backend/README.md) for the layer
breakdown (controllers → services → adapters → mappers).

## Resilience & fault tolerance

Failure is expected at every hop; each layer degrades gracefully instead of
cascading:

| Hop | Mechanism |
|---|---|
| **Sensor → broker** | MQTT **QoS 1** (at-least-once). The worker reconnects with a keep-alive of 60 s and registers a **last-will** message (`futurekawa/<country>/worker/status = offline`) so its death is observable. |
| **Broker → worker** | The worker validates each payload against the MQTT contract and **skips** malformed or unknown-sensor messages instead of crashing. On a database error it resets the Doctrine connection and keeps looping. |
| **Country → HQ** | The HQ backend uses a per-request **timeout** (`COUNTRY_TIMEOUT_MS`, default 4 s) and an in-memory **fallback cache**: on upstream failure it serves the last successful snapshot (`source: "cache"`, flagged `stale` past `CACHE_STALE_MS`). No retry, no queue — a brief outage degrades to last-known-good. |
| **HQ statelessness** | The backend holds no persistent state beyond the volatile cache, so any instance can serve any request and a restart loses nothing durable. |

A country edge stays fully operational (ingesting and storing) even when HQ is
down; HQ stays useful (serving cached data) even when a country is briefly
unreachable.

## Scaling

- **Add a country** — deploy one more copy of the country stack with a new
  `.env`. No shared state to reshard; sovereignty makes horizontal growth linear.
- **Country layer** — Postgres and the API scale independently; a warehouse may
  host several devices, all publishing to the same topic and told apart by
  `hardware_id`, so sensor density grows without topic changes.
- **HQ layer** — the backend is stateless, so it scales out behind a load
  balancer; the frontend is static assets served by nginx.
- **Ingestion** — the worker is a single long-lived subscriber per country,
  sized for a 30 s publish cadence; ingestion load scales with device count, not
  with HQ traffic.

## Deployment shape

- **Containers everywhere.** Two compose files define the two layers:
  the [HQ stack](../../docker-compose.yml) (backend + frontend) and the
  per-country [edge stack](../../apps/country/docker-compose.yml)
  (broker + IoT publisher + database + API + ingest worker).
- **Images from GHCR.** Services are published to
  `ghcr.io/epsi-teamsyct/futurekawa-<service>` and pulled at deploy time. The
  country API and its ingest worker share **one image**, run with different
  commands (`app:mqtt:subscribe` for the worker).
- **Broker** — `eclipse-mosquitto:2`; **database** — `postgres:16-alpine` with a
  named volume and a `pg_isready` healthcheck the API/worker wait on.
- **CI/CD** builds and pushes those images on merge to `main`; see the
  [pipeline doc](../ci-cd/pipeline.md).

## Related docs

- [Overview](overview.md) — the two layers and the main flows.
- [Data model](data-model.md) — the entities behind the country API.
- [MQTT contract](../../packages/contracts/mqtt/measurements.md) — the
  sensor → worker wire format.
