<div align="center">

# ☕ FutureKawa

**Supervision of green-coffee storage conditions across a sovereign, multi-country IoT platform.**

Real-time temperature & humidity monitoring of coffee warehouses in 🇧🇷 Brazil,
🇪🇨 Ecuador and 🇨🇴 Colombia — from the sensor on the shelf to a consolidated HQ dashboard.

[![CI](https://github.com/EPSI-TeamSYCT/FutureKawa/actions/workflows/ci.yml/badge.svg)](https://github.com/EPSI-TeamSYCT/FutureKawa/actions/workflows/ci.yml)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-fe5196?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org)
[![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-GHCR-2496ED?logo=docker&logoColor=white)](#)

</div>

## Table of contents

- [What is FutureKawa?](#what-is-futurekawa)
- [Architecture](#architecture)
- [Monorepo layout](#monorepo-layout)
- [Quickstart](#quickstart)
- [Tech stack](#tech-stack)
- [CI/CD](#cicd)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Team](#team)

## What is FutureKawa?

Green coffee is stored for months before roasting, and **out-of-range
temperature or humidity ruins a lot**. FutureKawa monitors storage conditions
across warehouses in three producing countries and gives headquarters a single,
live view: which lots are at risk, which warehouses drift out of their ideal
band, and when to act (FIFO on lots, alerts on drift).

Each country's ideal band differs (Brazil `29°C / 55%`, Ecuador `31°C / 60%`,
Colombia `26°C / 80%`), and — by design — **each country keeps its own data**.

> Academic context: EPSI M1 **MSPR2** project, team **SYCT**.

## Architecture

Two layers: a **sovereign country edge** (replicated per country) and a central
**HQ** that aggregates them.

```
        ┌──────────────────────── Country edge (×3, sovereign) ────────────────────────┐
        │                                                                               │
        │   📡 IoT sensor ──MQTT──► 🦟 Mosquitto ──► ⚙️ ingest worker ──► 🧩 Country API ─┼──┐
        │      (ESP8266 / simulator)     broker         (MQTT→DB)          + 🗄️ DB        │  │
        └───────────────────────────────────────────────────────────────────────────────┘  │
                                                                              HTTP (per country)
                                                                                             │
                        ┌──────────────────── Headquarters ─────────────────────┐           │
                        │   🔌 Backend (BFF / aggregator) ◄──────────────────────┼───────────┘
                        │        │                                               │
                        │        ▼                                               │
                        │   🖥️ Frontend (React dashboard)                        │
                        └────────────────────────────────────────────────────────┘
```

- **IoT → MQTT**: sensors publish `futurekawa/<country>/<warehouse>/measurements`
  (QoS 1). Contract in [`packages/contracts`](packages/contracts/README.md).
- **Country API**: per-country REST API (Symfony / API Platform) over the
  country's own database.
- **HQ backend**: aggregates the country APIs, normalizes, and exposes one clean
  API. Stateless (in-memory fallback cache, no DB).
- **HQ frontend**: consolidated dashboard (lots, warehouses, charts, alerts).

Full details in [`docs/architecture`](docs/architecture/overview.md).

## Monorepo layout

| Path | Purpose |
|---|---|
| [`apps/country/iot`](apps/country/iot/README.md) | IoT layer: firmware, MQTT contract, [Python simulator](apps/country/iot/simulator/README.md) |
| [`apps/country/api`](apps/country/api/README.md) | Country REST API (Symfony) |
| [`apps/country/database`](apps/country/database/README.md) | Country datastore |
| [`apps/hq/backend`](apps/hq/backend/README.md) | HQ backend — aggregator / BFF (Express + TS) |
| [`apps/hq/frontend`](apps/hq/frontend/README.md) | HQ frontend — supervision SPA (React) |
| [`packages/`](packages) | Shared `auth` · `config` · `contracts` · `types` |
| [`infra/`](infra) | `docker` · `k8s` · `terraform` deployment assets |
| [`docs/`](docs/README.md) | Cross-cutting & jury-facing documentation |
| `docs-site/` | Optional Docusaurus site aggregating the docs |

## Quickstart

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) + Docker Compose,
and a `docker login ghcr.io` (images are private GHCR packages).

**HQ stack** (backend + frontend) — from the repo root:

```bash
cp .env.example .env
docker compose up -d          # backend → :3000 · frontend → :8080
```

**Country stack** (broker + IoT publisher) — one per country:

```bash
cd apps/country
cp .env.example .env          # set COUNTRY, DEVICES, thresholds
docker compose up -d          # MQTT broker → :1883
```

Watch the live feed:

```bash
docker run --rm -it --network futurekawa-brazil_default eclipse-mosquitto:2 \
  mosquitto_sub -h mosquitto -t 'futurekawa/#' -v
```

Full instructions, `.env` reference and dev-mode (per app) in the
[deployment guide](docs/deployment/running-the-stack.md).

## Tech stack

| Domain | Choices |
|---|---|
| IoT | ESP8266 + DHT11 · PlatformIO/Arduino · MQTT (Mosquitto) · Python simulator (uv, paho-mqtt) |
| Country API | Symfony · API Platform |
| HQ backend | Node 22 · Express · TypeScript · axios · zod · pino |
| HQ frontend | React 18 · Vite · TypeScript · Chart.js · MSW |
| Quality (JS/TS) | [oxc](https://oxc.rs) — oxlint + oxfmt |
| Quality (Python) | ruff · mypy · pytest |
| CI/CD | GitHub Actions (reusable workflows) · GHCR · Docker |
| Conventions | Conventional Commits · commitlint + husky · SonarCloud |

## CI/CD

**Hybrid**: **CI on GitHub Actions** (build + push images to GHCR), **CD on
Jenkins** (deploy to the VPS) — see
[ADR-001](docs/architecture/adr-001-ci-github-actions-cd-jenkins.md).

Every service has an **identical CI pipeline shape**, run on pull requests only:

```
changes → quality → security → tests
```

- **Path-based change detection** — `quality` & `tests` are skipped when a
  service's code didn't change; **`security` (CVE audit) always runs**.
- **Coverage-gated tests** (80%) on every service.
- On merge to `main`, changed services are **built and pushed to GHCR** with
  **branch-based SemVer** (`feat/`→minor, `fix/`→patch) plus `:sha` and `:latest`.
- All GitHub Actions are **pinned to commit SHAs**.
- **CD**: Jenkins pulls the GHCR images and rolls the stack on the VPS
  (`docker compose up -d`) — [`Jenkinsfile`](Jenkinsfile) · [`infra/deploy/`](infra/deploy/README.md).

Details in [`docs/ci-cd/pipeline.md`](docs/ci-cd/pipeline.md).

## Documentation

- 📚 [Documentation hub](docs/README.md) — architecture, security, tests, CI/CD, phase 2
- 🚀 [Deployment / run guide](docs/deployment/running-the-stack.md)
- 🔀 [CI/CD pipeline](docs/ci-cd/pipeline.md)
- 📜 [MQTT contract](packages/contracts/README.md)
- 🤝 [Contributing](CONTRIBUTING.md)

## Contributing

Small, incremental **Conventional Commits**, one issue per change, PRs kept
focused. Run `npm install` once at the root to activate the git hooks (husky +
commitlint). Full workflow in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Team

**SYCT** — EPSI M1 MSPR2.

| Area | Scope |
|---|---|
| IoT · CI/CD · Infra | IoT tranche, simulator, pipelines, Docker/compose |
| Country API · Database | Symfony API + per-country datastore |
| HQ Backend | Express aggregator/BFF |
| HQ Frontend | React supervision dashboard |
