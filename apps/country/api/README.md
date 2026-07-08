# 🌡️ FutureKawa — Country API

![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php&logoColor=white)
![Symfony](https://img.shields.io/badge/Symfony-7-000000?logo=symfony&logoColor=white)
![API Platform](https://img.shields.io/badge/API%20Platform-4-38A9DB)
![Postgres](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

Per-country REST API (Symfony / API Platform) plus the MQTT ingestion worker and
the automatic **alerting** subsystem for the FutureKawa cold-chain solution.

## 📑 Table of contents

- [Overview](#-overview)
- [Getting started](#-getting-started)
- [Console commands](#-console-commands)
- [Automatic alerting & email](#-automatic-alerting--email)
  - [When an alert is raised](#when-an-alert-is-raised)
  - [Thresholds & tolerances](#thresholds--tolerances)
  - [Deduplication](#deduplication)
  - [Email notification](#email-notification)
  - [Scheduling](#scheduling)
  - [Configuration](#configuration)
- [Testing & quality](#-testing--quality)

## 🔎 Overview

The API models the country-level domain: `Country → Exploitation / Warehouse →
Sensor → Measure`, plus `Batch` (stored lots), `Responsible` (responsable
d'exploitation) and `Alert`. Sensor readings arrive over MQTT and are persisted
as `Measure` rows by the ingestion worker.

## 🚀 Getting started

```bash
composer install
# configure DATABASE_URL / MQTT_* / MAILER_DSN in .env.local
php bin/console doctrine:migrations:migrate
symfony serve            # or your preferred web server
```

Environment variables (see [`.env`](.env) for the committed defaults):

| Variable | Purpose | Safe default |
|---|---|---|
| `DATABASE_URL` | Postgres connection | local passwordless |
| `MQTT_*` | Broker host/port/credentials for the worker | localhost |
| `MAILER_DSN` | Symfony Mailer transport for alert e-mails | `null://null` |
| `ALERT_MAIL_FROM` | From address on alert notifications | `alerts@futurekawa.example` |

> Real secrets live in `.env.local` / the deployment environment — never commit them.

## ⌨️ Console commands

| Command | Description |
|---|---|
| `app:mqtt:subscribe` | Listens to the broker and stores incoming measures |
| `app:alerts:check` | Detects out-of-range measures & stale batches, raises alerts, e-mails responsibles |
| `app:create-admin` | Creates an admin user |

## 🚨 Automatic alerting & email

`app:alerts:check` scans recent data and, for each problem it finds, **persists an
`Alert`** and **e-mails the country's `Responsible`** (responsable d'exploitation).

```bash
php bin/console app:alerts:check                     # scan last 24h of measures
php bin/console app:alerts:check --lookback-hours=48 # widen the measure window
```

### When an alert is raised

1. **Out-of-range conditions** (`type = out_of_range`) — a `Measure`'s
   temperature or humidity falls outside the country's ideal band widened by the
   tolerance. The scan covers measures recorded within `--lookback-hours`
   (default 24h).
2. **Stale batch** (`type = stale_batch`) — a `Batch` whose `storageDate` is more
   than **365 days** in the past (i.e. the lot has been stored for over a year).

### Thresholds & tolerances

Ideal values come from the `Country` entity when set; otherwise the provider
falls back to the MSPR brief defaults (keyed by ISO code). Tolerances are shared:

| Country (ISO) | Ideal temp | Ideal humidity |
|---|---|---|
| Brazil (BR) | 29 °C | 55 % |
| Ecuador (EC) | 31 °C | 60 % |
| Colombia (CO) | 26 °C | 80 % |

| Tolerance | Value |
|---|---|
| Temperature | ± 3 °C |
| Humidity | ± 2 % |
| Stale-batch max age | 365 days |

A reading is **in range** while `ideal − tolerance ≤ value ≤ ideal + tolerance`
(boundaries inclusive). The policy lives in a single place —
`App\Alerting\CountryThresholdProvider` — so there are no magic numbers scattered
across the code, and per-country values remain tunable via the `Country` rows.

### Deduplication

The command is **idempotent** — a still-open condition is not re-raised or
re-e-mailed on the next run:

- **Stale batch** — at most one alert per `Batch`, ever (a lot stays stale until
  it is moved out).
- **Out-of-range** — at most one alert per `Warehouse` within a **24 h cooldown**,
  so a persistently bad warehouse is not spammed every run.

### Email notification

Sent with **Symfony Mailer** to the first `Responsible` of the country that has an
e-mail address. The message includes the country, warehouse, the offending
values vs. their allowed range (or the batch reference + age for a stale lot) and
the timestamp. `Alert::emailSent` records whether delivery succeeded. With the
default `MAILER_DSN=null://null` the mail is swallowed, so demos and CI run
without an SMTP server.

### Scheduling

Run it periodically — e.g. an hourly cron:

```cron
0 * * * * php /path/to/app/bin/console app:alerts:check >> /var/log/futurekawa-alerts.log 2>&1
```

### Configuration

| Setting | Where |
|---|---|
| Country ideals / tolerances | `Country` entity, fallback in `CountryThresholdProvider` |
| Stale-batch max age (365 d) | `CountryThresholdProvider::STALE_BATCH_MAX_AGE_DAYS` |
| Out-of-range cooldown (24 h) | `AlertChecker::OUT_OF_RANGE_COOLDOWN_HOURS` |
| Mailer transport | `MAILER_DSN` env var |
| From address | `ALERT_MAIL_FROM` env var |

## 🧪 Testing & quality

```bash
composer quality   # lint:yaml + lint:container + php-cs-fixer + phpstan (level 6)
composer test      # phpunit (unit tests, no DB)
```

The out-of-range / stale-batch logic is covered by pure unit tests in
`tests/Alerting/` (no database required).
