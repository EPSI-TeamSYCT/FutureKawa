# IoT Simulator 🛰️

![Python](https://img.shields.io/badge/Python-3.12-3776AB)
![Managed by](https://img.shields.io/badge/managed%20by-uv-DE5FE9)
![MQTT](https://img.shields.io/badge/MQTT-QoS%201-660066)
![Tests](https://img.shields.io/badge/tests-13%20passing-brightgreen)

> Country-agnostic worker that publishes simulated temperature/humidity to MQTT,
> exactly like the real ESP8266 firmware. **One instance = one country**, configured
> entirely by environment variables — add a country with **no code change**.

## 📑 Table of contents

- 🧭 [Overview](#overview)
- 📦 [Prerequisites](#prerequisites)
- ⚙️ [Configuration](#configuration)
- ▶️ [Run locally (one country)](#run-locally-one-country)
- 🚀 [Run the full fleet (broker + 3 countries)](#run-the-full-fleet-broker--3-countries)
- 🔧 [How it works](#how-it-works)
- ✅ [Tests](#tests)
- 🔁 [CI (local pipeline)](#ci-local-pipeline)

## Overview

The worker reads its whole configuration from the environment and publishes JSON
measurements to `futurekawa/<country>/<warehouse>/measurements`, using the same
[MQTT contract](../../../../packages/contracts/mqtt/measurements.md) as the firmware —
so the backend can't tell the simulator from a real device. Design:
[spec](../../../../docs/superpowers/specs/2026-07-07-iot-simulator-worker-design.md).

## Prerequisites

- 📥 **[uv](https://docs.astral.sh/uv/)** — it provisions Python 3.12 automatically.
- 🐳 The **Mosquitto broker** — [`infra/docker/mosquitto`](../../../../infra/docker/mosquitto/README.md)
  (or use the compose file here, which starts its own).

## Configuration

All env-driven. Required vars have no default.

| Variable | Default | Meaning |
|---|---|---|
| `MQTT_HOST` / `MQTT_PORT` | `localhost` / `1883` | Broker |
| `MQTT_QOS` | `1` | Publish QoS |
| `COUNTRY` | *(required)* | Country label (free-form) |
| `WAREHOUSES` | `wh-01` | Comma-separated ids |
| `TEMP_THRESHOLD` / `HUMIDITY_THRESHOLD` | *(required)* | Country thresholds |
| `TEMP_TOLERANCE` / `HUMIDITY_TOLERANCE` | `3.0` / `2.0` | ± tolerances |
| `PUBLISH_INTERVAL` | `30` | Seconds between rounds |
| `ANOMALY_PROBABILITY` | `0.1` | Chance of an out-of-range reading |
| `RANDOM_SEED` | *(optional)* | Reproducible readings |

➕ **Add a country** = add a service block in `docker-compose.yml` with its env. No code change.

## Run locally (one country)

```bash
cd apps/country/iot/simulator
uv sync
cp .env.example .env        # then edit COUNTRY / thresholds / MQTT_HOST
uv run python src/main.py
```

## Run the full fleet (broker + 3 countries)

```bash
docker compose up --build
```

👀 Watch the messages:

```bash
docker exec -it futurekawa-mosquitto mosquitto_sub -t "futurekawa/#" -v
```

## How it works

- 📈 Each warehouse follows a smooth **random walk** around its country threshold
  (natural-looking Chart.js curves), with gentle mean reversion.
- ⚠️ With `ANOMALY_PROBABILITY`, a reading is pushed **beyond tolerance** to trigger
  the backend's alert rule.
- 🔁 One instance publishes for every warehouse in `WAREHOUSES`, every
  `PUBLISH_INTERVAL` seconds, until `Ctrl+C` (clean shutdown).
- 🎲 `RANDOM_SEED` makes runs reproducible for demos and tests.

## Tests

```bash
uv run pytest        # 18 tests, coverage gate at 80% (currently ~98%)
```

## CI (local pipeline)

The CI stages are plain, runnable commands — the **same ones the CI server calls** —
so the whole pipeline runs locally in one command:

```bash
uv run poe ci        # quality -> security -> tests
```

| Stage | Command | Tools |
|---|---|---|
| 🎨 Quality | `uv run poe quality` | `ruff` (lint + format), `mypy`, `vulture` |
| 🔒 Security | `uv run poe security` | `pip-audit` |
| ✅ Tests | `uv run poe test` | `pytest` + coverage (fails under **80 %**) |

Individual tasks: `uv run poe lint | format | typecheck | deadcode | audit | test`.
Auto-fix formatting with `uv run poe format`.
