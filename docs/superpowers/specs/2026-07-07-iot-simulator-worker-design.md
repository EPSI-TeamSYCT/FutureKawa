# IoT Simulator Worker — Design

Status: approved (design) · Date: 2026-07-07 · Scope: `apps/country/iot/simulator`

## Purpose

Replace the throwaway single-file simulator with a proper, country-agnostic
**worker** that publishes fake temperature/humidity measurements to the MQTT
broker, exactly like the real ESP8266 firmware. It lets the whole backend be
developed and demoed without physical hardware, and drives a reliable jury demo.

## Requirements & decisions

1. **One instance = one country.** The worker is country-agnostic; everything comes
   from environment variables. Three countries = three instances. Adding a country
   means new env config + a new instance — **no code change** (same model as the API).
2. **Multiple warehouses per worker**, listed in env (`WAREHOUSES=wh-01,wh-02`).
   Each warehouse has its own drifting reading state.
3. **Constants variabilized via env** — thresholds and tolerances are env vars, not
   hardcoded per country.
4. **Tooling: `uv`** for project + dependencies.
5. **Multi-file package**, one responsibility per module (no monolithic script).
6. **Config layer: `pydantic-settings`** — typed, validated, fail-fast, `.env`
   support; the same pattern the API will use (monorepo consistency).
7. Publishes the existing MQTT contract:
   [`packages/contracts/mqtt/measurements.md`](../../../packages/contracts/mqtt/measurements.md).

## File structure

Modules live flat in `src/` (no nested package folder). Imports are flat
(e.g. `from config import Settings`); `pytest` is configured with
`pythonpath = ["src"]`; entry point is `src/main.py`, run via `uv run`.

```
apps/country/iot/simulator/
├── pyproject.toml            # uv project + deps (paho-mqtt, pydantic-settings; dev: pytest)
├── .env.example             # documented env template
├── Dockerfile               # worker image (python-slim + uv)
├── docker-compose.yml       # broker + 3 country services (self-contained demo)
├── README.md
├── src/
│   ├── main.py              # entry point: build config, run the worker loop
│   ├── config.py            # Settings (pydantic-settings): env -> typed, validated config
│   ├── models.py            # Measurement + JSON serialization matching the contract
│   ├── generator.py         # reading generation (random walk + anomalies), per-warehouse state
│   ├── publisher.py         # MQTT client wrapper (connect / publish / reconnect / disconnect)
│   └── worker.py            # orchestration loop (config + generators + publisher)
└── tests/
    ├── test_config.py
    ├── test_generator.py
    └── test_models.py
```

## Configuration surface (all env-driven)

| Variable | Default | Meaning |
|---|---|---|
| `MQTT_HOST` | `localhost` | Broker host |
| `MQTT_PORT` | `1883` | Broker port |
| `MQTT_QOS` | `1` | Publish QoS |
| `COUNTRY` | *(required)* | Country label (`brazil` / `ecuador` / `colombia`) |
| `WAREHOUSES` | `wh-01` | Comma-separated warehouse ids |
| `TEMP_THRESHOLD` | *(required)* | Country temperature threshold (°C) |
| `HUMIDITY_THRESHOLD` | *(required)* | Country humidity threshold (%) |
| `TEMP_TOLERANCE` | `3.0` | ± °C |
| `HUMIDITY_TOLERANCE` | `2.0` | ± % |
| `PUBLISH_INTERVAL` | `30` | Seconds between publish rounds |
| `ANOMALY_PROBABILITY` | `0.1` | Probability [0-1] of an out-of-range reading |
| `RANDOM_SEED` | *(optional)* | Reproducible readings for demo/tests |

Adding a country = set these variables and deploy. Zero code change.

`COUNTRY` is a **free-form non-empty string**, not a hardcoded enum — otherwise
adding a country would require editing the enum (i.e. a code change).

## Data flow

1. `config.py` loads and validates the environment into a `Settings` object.
2. `worker.py` creates one generator per warehouse (each holds its own drift state).
3. Every `PUBLISH_INTERVAL` seconds, each warehouse produces a `Measurement`; the
   publisher sends its JSON to `futurekawa/<country>/<warehouse>/measurements`
   (QoS from config, retain false).
4. The loop runs until `SIGINT`/`SIGTERM`, then disconnects cleanly.

## Generation logic

- Smooth **random walk** around the country threshold with gentle mean reversion
  (produces natural Chart.js curves rather than pure noise).
- With `ANOMALY_PROBABILITY`, push a reading **beyond tolerance** to trigger the
  backend alert rule.
- Humidity clamped to `[0, 100]`. `RANDOM_SEED` makes runs reproducible.

## Error handling

- **Invalid/missing env** → pydantic raises → clear message, non-zero exit (fail fast).
- **Broker unreachable** → retry with backoff at startup (survives a broker that
  starts slightly later in compose) + automatic reconnect on drop.
- **Publish failure** → log and continue (telemetry is best-effort; QoS 1 handles delivery).
- **`SIGINT`/`SIGTERM`** → stop the loop and disconnect cleanly.

## Deployment

- **Dockerfile**: `python-slim` + `uv`, runs `uv run python src/main.py`.
- **docker-compose.yml**: Mosquitto + three services (`brazil`, `ecuador`,
  `colombia`), same image, different env per service (reusing
  `infra/docker/mosquitto/mosquitto.conf`). One `docker compose up` publishes the
  full three-country fleet to the broker. Adding a country = one service block.

## Testing (`uv run pytest`)

- **`test_config`** — valid env → `Settings`; missing required var → error;
  `WAREHOUSES` CSV parsing; tolerance/interval defaults.
- **`test_generator`** — with `RANDOM_SEED`, readings are deterministic; normal
  readings fall within `threshold ± tolerance`; an anomaly forces an out-of-range
  value; humidity stays within `[0, 100]`.
- **`test_models`** — the serialized payload has exactly the keys and types of the
  MQTT contract.

## Out of scope (YAGNI)

- No multi-country-per-instance mode.
- No pluggable "real device" data source — this is a simulator.
- No TLS/auth on MQTT (the broker is dev-only; production hardening is separate).
