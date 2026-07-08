# Data Model

The domain model behind each **country** database and REST API. It mirrors the
Symfony / Doctrine entities in
[`apps/country/api/src/Entity`](../../apps/country/api/src/Entity).

## Table of contents

- [Entities](#entities)
- [Relationships](#relationships)
- [ER sketch](#er-sketch)
- [From measure to country](#from-measure-to-country)
- [Alerts](#alerts)
- [Storage decisions](#storage-decisions)
- [Related docs](#related-docs)

## Entities

| Entity | Purpose | Key fields |
|---|---|---|
| **Country** | The country the stack serves, with its ideal band | `name`, `isoCode`, `idealTemp`, `idealHumidity`, `toleranceTemp`, `toleranceHumidity` |
| **Exploitation** | A coffee farm / producer supplying lots | `name`, `country` |
| **Warehouse** | A physical storage site the sensors monitor | `name`, `country` |
| **Batch** | A stored lot of green coffee (FIFO unit) | `ref`, `storageDate`, `status`, `exploitation`, `warehouse` |
| **Sensor** | A physical IoT device in a warehouse | `hardwareId`, `model`, `status`, `lastCom`, `warehouse` |
| **Measure** | One temperature/humidity reading from a sensor | `temperature`, `humidity`, `measuredAt`, `sensor` |
| **Alert** | A raised condition (drift or aged lot) | `type`, `message`, `createdAt`, `emailSent`, `warehouse`, `batch?` |
| **Responsible** | Business contact for a country (alert recipient) | `name`, `email`, `country` |
| **User** | API/back-office account (auth) | `email`, `roles`, `password` |

## Relationships

| From | Relation | To | Notes |
|---|---|---|---|
| Country | 1 → N | Exploitation | a country has many farms |
| Country | 1 → N | Warehouse | a country has many storage sites |
| Country | 1 → N | Responsible | contacts for the country |
| Exploitation | 1 → N | Batch | a farm supplies many lots |
| Warehouse | 1 → N | Batch | a site stores many lots |
| Warehouse | 1 → N | Sensor | a site hosts many devices |
| Warehouse | 1 → N | Alert | alerts are anchored to a site |
| Sensor | 1 → N | Measure | a device emits many readings |
| Batch | 1 → N | Alert | a lot may raise alerts (optional link) |

A `Batch` therefore has **two** required parents: the `Exploitation` it came from
and the `Warehouse` it is stored in. `User` stands alone (authentication only)
and is not exposed as an API Platform resource.

## ER sketch

```
                 ┌───────────┐
                 │  Country  │  idealTemp / idealHumidity / tolerances
                 └─────┬─────┘
        ┌──────────────┼───────────────┬───────────────┐
        ▼              ▼               ▼               ▼
 ┌────────────┐  ┌───────────┐   ┌────────────┐  ┌──────────────┐
 │Exploitation│  │ Warehouse │   │Responsible │  │  (per-country│
 └─────┬──────┘  └──┬─────┬──┘   └────────────┘  │   scope)     │
       │            │     │                       └──────────────┘
       │            │     ▼
       │            │  ┌────────┐        ┌──────────┐
       │            │  │ Sensor │──1:N──►│ Measure  │  temperature / humidity / measuredAt
       │            │  └────────┘        └──────────┘
       │            ▼
       │       ┌──────────┐
       └──1:N─►│  Batch   │  ref / storageDate / status   (FIFO by storageDate)
               └────┬─────┘
                    │
                    ▼
               ┌──────────┐
               │  Alert   │◄──1:N── Warehouse
               └──────────┘   type / message / createdAt / emailSent
```

## From measure to country

A `Measure` carries **no** country or warehouse column. It ties back through its
sensor:

```
Measure ── sensor ──► Sensor ── warehouse ──► Warehouse ── country ──► Country
```

This is exactly how ingestion and HQ resolve location:

- **Ingest worker** (`app:mqtt:subscribe`) receives an MQTT payload, looks up the
  `Sensor` by the payload's `hardware_id`, and attaches the new `Measure` to it —
  so the warehouse/country are implied by the sensor, never trusted from the wire.
- **HQ backend** fetches a lot's readings with
  `/api/measures?sensor.warehouse=<id>`, i.e. the measures of the warehouse where
  the lot is stored.

## Alerts

An `Alert` is always anchored to a `Warehouse` and **optionally** to a `Batch`:

- **Condition alerts** — a reading outside the country's `ideal ± tolerance` band;
  anchored to the warehouse.
- **Aged-lot alerts** — a `Batch` stored longer than 365 days (FIFO discipline);
  anchored to the warehouse and to that batch.

`emailSent` tracks whether the country's `Responsible` has been notified.

## Storage decisions

- **Relational Postgres per country.** The domain is strongly relational
  (five levels from country down to measure) and each country owns its own store
  — see [distributed system](distributed-system.md#data-sovereignty).
- **Doctrine + API Platform.** Entities are annotated `#[ApiResource]`, so the
  REST API (relations exposed as IRIs, camelCase fields) is generated from the
  same classes that define the schema. `User` is intentionally **not** an
  `ApiResource`.
- **Immutable timestamps.** `measuredAt`, `storageDate` and `createdAt` are
  `DateTimeImmutable`; the device stamps UTC epoch and the worker may re-stamp on
  receipt.
- **Nullable readings.** `Measure.temperature` / `humidity` are nullable to
  tolerate a partial sensor reading without dropping the record.

## Related docs

- [Overview](overview.md) — where this model sits in the system.
- [Distributed system](distributed-system.md) — per-country sovereignty.
- [MQTT contract](../../packages/contracts/mqtt/measurements.md) — the payload
  that becomes a `Measure`.
