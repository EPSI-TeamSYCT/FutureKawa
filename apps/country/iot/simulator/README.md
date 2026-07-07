# IoT Simulator 🛰️

Country-agnostic worker that publishes simulated temperature/humidity to MQTT,
exactly like the real ESP8266 firmware. One instance = one country, configured by
environment variables. See the design:
[`docs/superpowers/specs/2026-07-07-iot-simulator-worker-design.md`](../../../../docs/superpowers/specs/2026-07-07-iot-simulator-worker-design.md).

## Prerequisites

- **[uv](https://docs.astral.sh/uv/)** (it provisions Python 3.12 automatically).
- The **Mosquitto broker** — [`infra/docker/mosquitto`](../../../../infra/docker/mosquitto/README.md)
  (or use the compose file here, which starts its own).

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

Watch the messages:

```bash
docker exec -it futurekawa-mosquitto mosquitto_sub -t "futurekawa/#" -v
```

## Configuration (all env-driven)

| Variable | Default | Meaning |
|---|---|---|
| `MQTT_HOST` / `MQTT_PORT` | `localhost` / `1883` | Broker |
| `MQTT_QOS` | `1` | Publish QoS |
| `COUNTRY` | *(required)* | Country label |
| `WAREHOUSES` | `wh-01` | Comma-separated ids |
| `TEMP_THRESHOLD` / `HUMIDITY_THRESHOLD` | *(required)* | Country thresholds |
| `TEMP_TOLERANCE` / `HUMIDITY_TOLERANCE` | `3.0` / `2.0` | ± tolerances |
| `PUBLISH_INTERVAL` | `30` | Seconds between rounds |
| `ANOMALY_PROBABILITY` | `0.1` | Chance of an out-of-range reading |
| `RANDOM_SEED` | *(optional)* | Reproducible readings |

**Add a country** = add a service block in `docker-compose.yml` with its env. No code change.

## Tests

```bash
uv run pytest
```
