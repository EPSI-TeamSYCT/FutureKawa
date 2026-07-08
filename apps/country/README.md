# 🌍 Country edge

The **per-country** stack of **FutureKawa**. One instance is deployed **per
country** (Brazil, Ecuador, Colombia): each country is sovereign and keeps its
own sensors, message bus, API and database. The HQ backend later aggregates
these APIs.

```
country/
├── iot/        📡  sensors + firmware + MQTT contract (+ Python simulator)
├── api/        🧩  country REST API (Symfony / API Platform) — owned by the API team
└── database/   🗄️  country datastore — owned by the API team
```

## Components

| Component | Path | Stack | Role |
|---|---|---|---|
| 📡 IoT | [`iot/`](iot/README.md) | ESP8266 + DHT11 · PlatformIO · MQTT · Python simulator ([`iot/simulator/`](iot/simulator/README.md)) | Reads temperature/humidity and **publishes** to MQTT (`futurekawa/<country>/<warehouse>/measurements`). The simulator replays this contract for the demo. |
| 🧩 API | [`api/`](api/README.md) | Symfony · API Platform | Country REST API: warehouses, lots, measures, alerts. Consumed by the HQ backend. |
| 🗄️ Database | [`database/`](database/README.md) | (per-country store) | Persists the country's measures & business data — data **stays in-country**. |

## Local pipeline (per country)

```
sensors/simulator ──MQTT──► broker (Mosquitto) ──► ingest worker ──► API + DB
```

> ℹ️ The **ingest worker** (MQTT → DB consumer) and the **API/DB** are still in
> progress. The IoT publisher + broker run today; see the compose below.

## Run

The per-country stack (broker + IoT publisher, with API/DB/ingest as they land)
comes up via [`docker-compose.yml`](docker-compose.yml) — one `.env` per country:

```bash
cp .env.example .env      # set COUNTRY, DEVICES, thresholds
docker compose up -d
```

Full instructions in the [deployment guide](../../docs/deployment/running-the-stack.md).
The MQTT message contract lives in
[`packages/contracts`](../../packages/contracts/README.md).
