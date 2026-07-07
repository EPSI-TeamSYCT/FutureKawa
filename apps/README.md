# 📦 Applications

The deployable applications of **FutureKawa**, split into two layers that mirror
the real topology: sovereign **country** edges and a central **HQ**.

```
apps/
├── country/   🌍  per-country edge (sensors, broker, API, DB) — one deployment per country
└── hq/        🏢  headquarters (aggregator backend + supervision frontend)
```

## Layers

| Layer | Path | What it is | Owner |
|---|---|---|---|
| 🌍 Country | [`country/`](country/README.md) | IoT sensors + MQTT broker + country REST API + database. Deployed **once per country** (Brazil, Ecuador, Colombia). | — |
| 🏢 HQ | [`hq/`](hq/README.md) | Backend that **aggregates** the country APIs + the React frontend that supervises everything. | — |

## How they fit together

```
[ Country edge (×3) ]                         [ Headquarters ]
 sensors → MQTT broker → ingest → API+DB  ──►  backend (BFF) ──► frontend
                                    (HTTP, per-country, sovereign data)
```

Each country keeps its own data (**sovereignty**); the HQ backend queries the
country APIs over HTTP and consolidates the three countries into one view.

See the [architecture docs](../docs/architecture/overview.md) for the full
picture and the [deployment guide](../docs/deployment/running-the-stack.md) to
run the stacks.
