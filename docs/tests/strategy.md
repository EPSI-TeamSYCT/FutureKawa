# 🧪 Test strategy

How FutureKawa is tested, service by service. The goal is a **reproducible,
auditable** test base: every service owns its suite, every suite runs the exact
same commands locally and in CI, and coverage is **gated at 80 %**. This document
is livrable 4.3 (test plan); the copy-pasteable commands live in
[manual tests](./manual-tests.md) and the CI wiring in
[the CI/CD pipeline](../ci-cd/pipeline.md).

## Table of contents

- [Test levels](#test-levels)
- [Tooling per service](#tooling-per-service)
- [The 80% coverage gate](#the-80-coverage-gate)
- [Test cases](#test-cases)
- [Test data](#test-data)
- [Anomaly management](#anomaly-management)
- [How tests plug into CI](#how-tests-plug-into-ci)

## 🧭 Test levels

We test at five levels, matched to the distributed topology (per-country edge +
HQ). Not every service uses every level — a level exists where it removes risk.

| Level | What it proves | Where it lives |
|---|---|---|
| **Unit** | Pure business rules in isolation (thresholds, FIFO, drift, lot status) | `hq/frontend/src/lib`, `hq/backend` mappers/services, API entities, simulator generator/models |
| **Integration** | Layers wired together (service ↔ adapter, cache fallback, config parsing) | `hq/backend` services + `lib/cache`, simulator worker |
| **API / contract** | HTTP surface returns the right status/shape; wire format validated | `hq/backend` controllers via Supertest + zod schema tests |
| **UI** | Components render the right state (badges, gauges, filters) | `hq/frontend` React Testing Library + jsdom |
| **End-to-end** | A real worker publishes the real MQTT contract a real broker relays | simulator e2e spec-check against Mosquitto (see [manual tests](./manual-tests.md#-e2e-mqtt-check)) |

> 💡 The MQTT contract is the seam between IoT and the rest of the stack, so it is
> asserted end-to-end (payload keys, types, topic format, QoS) — not only in unit
> tests. The contract source of truth is
> [`packages/contracts`](../../packages/contracts/README.md).

## 🛠️ Tooling per service

Each service ships its own test tooling and a single command that mirrors CI.

| Service | Framework | Runner command | Notes |
|---|---|---|---|
| 🟩 HQ backend (Node/TS) | **Vitest + Supertest** | `npm run test:coverage` | Co-located `*.spec.ts`; controllers hit via Supertest; axios mocked at the boundary |
| ⚛️ HQ frontend (React/Vite) | **Vitest + React Testing Library** | `npm run test:coverage` | `jsdom` env, MSW mock layer; coverage scoped to `src/lib` |
| 🐘 Country API (Symfony) | **PHPUnit** | `composer test:coverage` | Unit tests today (no DB); `pcov` for coverage → `coverage.xml` |
| 🛰️ IoT simulator (Python) | **pytest + pytest-cov** | `uv run poe test` | Deterministic via `RANDOM_SEED`; e2e spec-check against a live broker |

Static quality (runs before tests in CI) uses the per-language toolchains:

| Service | Lint | Format | Types | Extra |
|---|---|---|---|---|
| HQ backend / frontend | `oxlint` | `oxfmt --check` | `tsc` | build must pass |
| Country API | `lint:yaml` + `lint:container` | `php-cs-fixer` (`@Symfony`) | **PHPStan (level 6)** | `composer validate --strict` |
| IoT simulator | `ruff check` | `ruff format --check` | `mypy` | `vulture` (dead code) |

## 📊 The 80% coverage gate

Coverage is a **hard gate**, enforced by the tooling itself (not a manual review),
so it fails the build the same way locally and in CI.

| Service | Threshold | Enforced by | Scope |
|---|---|---|---|
| HQ backend | **80 %** lines/statements/functions/branches | `vitest.config.ts` → `test.coverage.thresholds` | whole `src` |
| HQ frontend | **80 %** lines/statements/functions/branches | `vitest.config.ts` → `test.coverage.thresholds` | `src/lib` only (pure logic); UI is out of scope by design |
| IoT simulator | **80 %** | `pyproject.toml` → `--cov-fail-under=80` | `src` (entry-point `main.py` omitted, covered by e2e) |
| Country API | 80 % (target) | `composer test:coverage` emits `coverage.xml` | ⚠️ gate alignment in progress — see note |

> ⚠️ The country API already produces Clover coverage (`coverage.xml`) on every
> run; wiring the failing threshold to match the other three services is a tracked
> follow-up (`TODO(api): enforce an 80% coverage gate`). SonarCloud reports the
> number in the meantime.

## ✅ Test cases

Representative cases drawn from the **real** suites — they exercise the business
rules of the dossier (ideal band ±3 °C / ±2 %, alert on drift or on lot age > 365
days, FIFO rotation).

| # | Case | Input data | Expected result | Pass criteria |
|---|---|---|---|---|
| T1 | Reading inside band | temp 34 °C, ideal 31 ± 3 | `isOutOfRange = false` | no alert raised |
| T2 | Temperature drift | temp 36 °C, ideal 31 ± 3 | `conditionsDrift = true` | alert candidate |
| T3 | Humidity drift | humidity 64 %, ideal 60 ± 2 | `conditionsDrift = true` | alert candidate |
| T4 | Lot aged > 365 days | age 400 d, no drift, not shipped | status `EN_ALERTE` | alert on age |
| T5 | Lot expired | age 600 d | status `PERIME` | flagged expired |
| T6 | Shipped lot wins | age 900 d, shipped, drift | status `EXPEDIE` | shipped overrides all |
| T7 | FIFO ordering | 3 lots with different storage dates | oldest storage date first | `sortFifo` stable, input not mutated |
| T8 | MQTT payload contract | simulator run, country `peru` | keys = `{warehouse_id, country, temperature, humidity, timestamp}`, correct types | matches `packages/contracts` |
| T9 | Topic + multi-warehouse | 3 warehouses | topics `futurekawa/peru/wh-0N/measurements` | one topic per warehouse, QoS 1 |
| T10 | Anomaly injection | `ANOMALY_PROBABILITY=1` | reading pushed beyond tolerance | triggers the downstream alert rule |
| T11 | New country, zero code | env `COUNTRY=peru` | publishes correctly | evolutivity proven by config only |
| T12 | HQ upstream outage | country API unreachable, prior snapshot exists | serves last snapshot `source: cache` | no global crash (resilience) |
| T13 | HQ endpoint contract | `GET /lots?country=` | 200 + FIFO-sorted DTOs + `meta` freshness | Supertest assertion passes |

## 🗃️ Test data

Test data is **synthetic and deterministic** — no production data, no personal
data, reproducible on any machine.

| Source | Used by | Determinism |
|---|---|---|
| Fixtures in `src/testing/` | HQ backend | Static raw-API payloads (IRIs, camelCase) |
| MSW mock layer | HQ frontend | Offline handlers, no network |
| `RANDOM_SEED` env | IoT simulator | Same seed ⇒ same readings |
| `APP_ENV=test`, in-memory | Country API | Unit tests need no live DB today |

## 🔁 Anomaly management

Every defect follows the same closed loop, tied to the project audit trail
(issue → branch → commit → PR):

| Step | Action | Evidence |
|---|---|---|
| 1. **Constat** (observation) | A failing test, red CI check, or SonarCloud finding is logged as a **GitHub issue** | Issue with steps to reproduce + failing output |
| 2. **Correction** | A `fix/<#issue>-…` branch adds/adjusts a test that reproduces the bug **first**, then the fix | Commit `Refs #N`, PR `Closes #N` |
| 3. **Re-test** | The full per-service pipeline reruns on the PR; the new test must go green and coverage stay ≥ 80 % | Green CI run + SonarCloud Quality Gate pass |

> 💡 Regression rule: a bug is only "fixed" once a test exists that would have
> caught it. That test stays in the suite forever, so the anomaly cannot silently
> return.

## 🔗 How tests plug into CI

Tests are the **last gate** of each service pipeline. The `tests` job runs only
when the service code changed **and** both `quality` and `security` already
succeeded:

```yaml
tests:
  needs: [changes, quality, security]
  if: ${{ needs.changes.outputs.code == 'true'
        && needs.quality.result == 'success'
        && needs.security.result == 'success' }}
```

A broken build or failing lint therefore never wastes a test run, and a green
`tests` job is a strong signal: code changed, style/type/build passed, no
high-severity CVE, and coverage held at 80 %. The full gating logic — including
why security always runs — is documented in
[the CI/CD pipeline](../ci-cd/pipeline.md).
