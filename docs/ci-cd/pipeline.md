# 🔀 CI/CD Pipeline

FutureKawa runs its CI/CD on **GitHub Actions**, with images published to the
**GitHub Container Registry (GHCR)**. Every service follows the **same pipeline
shape**, so the whole team shares one mental model.

## Table of contents

- [Principles](#principles)
- [Workflows at a glance](#workflows-at-a-glance)
- [CI — the job chain](#ci--the-job-chain)
- [Gating rules](#gating-rules)
- [Release — build, push & versioning](#release--build-push--versioning)
- [Security hardening](#security-hardening)
- [Running the pipeline locally](#running-the-pipeline-locally)
- [Adding a service](#adding-a-service)

## Principles

- 💸 **Cheap** — CI runs on **pull requests only** (no push trigger), and skips
  work for services whose code didn't change.
- 🧩 **Uniform** — one reusable workflow per service, all with identical gating.
- 🔒 **Safe by default** — the CVE audit runs on **every** PR, even when nothing
  else does; all actions are pinned to commit SHAs.
- 🏷️ **Traceable** — every image carries an immutable `:sha-<commit>` tag, and
  releases are versioned per service.

## Workflows at a glance

| File | Trigger | Role |
|---|---|---|
| `ci.yml` | `pull_request` | 🎯 **CI orchestrator** — calls each service's reusable CI |
| `ci-<service>.yml` | `workflow_call` | ♻️ **Per-service CI** — the job chain below |
| `release.yml` | `pull_request` `closed` (merged) | 🏷️ **Release orchestrator** — derives the bump + calls each changed service's build/push |
| `cd-<service>.yml` | `workflow_call` | 📦 **Per-service build & push** to GHCR |

Services wired today: `iot-simulator`, `hq-backend`, `hq-frontend`
(country API to follow).

## CI — the job chain

Jobs run **sequentially**, each depending on the previous:

```
changes ──► quality ──► security ──► tests
```

| Job | Runs | Does |
|---|---|---|
| `changes` | always (first) | detects whether the service **code** changed (path filter) |
| `quality` | code changed | lint · format · typecheck · build |
| `security` | quality passed **or was skipped** | dependency **CVE audit** |
| `tests` | code changed **and** quality + security passed | unit tests + **80% coverage gate** |

Per-service commands:

| Service | Lint / Format / Build | Tests + coverage |
|---|---|---|
| `iot-simulator` | ruff · mypy · vulture (`poe quality`) | `pytest --cov-fail-under=80` |
| `hq-backend` | oxlint · oxfmt · tsc · build | `vitest --coverage` (80% thresholds) |
| `hq-frontend` | oxlint · oxfmt · tsc · vite build | `vitest --coverage` (80% on `src/lib` business logic) |
| `country-api` *(prepared, pending merge)* | `composer validate` · `lint:yaml` · `lint:container` (+ phpstan/cs-fixer) · `composer audit` | `phpunit` (+ 80% gate to add) |

## Gating rules

The gating is **identical** across services and matters for cost + safety:

- **`quality` / `tests` are skippable** — `if: needs.changes.outputs.code == 'true'`.
  No code change ⇒ these are skipped, saving runner minutes.
- **`security` always runs** — `if: ${{ !failure() && !cancelled() }}`. This is
  deliberate: a PR that only touches docs must still get its dependency **CVE
  audit**, so a new advisory never slips through.

  > ⚠️ A naive `needs.quality.result == 'skipped'` does **not** work: GitHub
  > prepends an implicit `success()` that skips any job whose dependency was
  > skipped. Only status functions (`!failure()` / `!cancelled()`) lift that.

## Release — build, push & versioning

On merge to `main`, `release.yml` derives the version bump from the **source
branch name** (read from the PR event, so it works with squash-merges) and
builds/pushes only the services with image-relevant changes.

| Branch prefix | Bump | Image tags |
|---|---|---|
| `feat/` · `feature/` | **minor** (`1.2.0`→`1.3.0`) | `:1.3.0` + `:sha-xxxxxxx` + `:latest` |
| `fix/` | **patch** (`1.2.0`→`1.2.1`) | `:1.2.1` + `:sha-xxxxxxx` + `:latest` |
| anything else (`docs/`, `ci/`, `chore/`…) | **none** | `:sha-xxxxxxx` + `:latest` |
| **major** | **manual** — create `<service>-vX.0.0` by hand; automation continues | |

- **Registry:** `ghcr.io/epsi-teamsyct/futurekawa-<service>`, authenticated with
  the built-in `GITHUB_TOKEN` — **no secrets to configure**.
- **Per service:** each keeps its own version line via git tags `<service>-vX.Y.Z`.
- **Traceability:** the `:sha-<commit>` tag ties every image to its exact commit.

## Security hardening

- 📌 **Actions pinned to full commit SHAs** (SonarCloud rule S7637) — no floating
  `@v4` tags.
- 🛡️ **No shell injection** — attacker-controllable values (e.g. `github.head_ref`)
  are passed as environment variables, never interpolated into `run:` scripts.
- 🔎 **SonarCloud** auto-analysis runs on every PR and gates the merge.

## Running the pipeline locally

The CI commands **are** the local commands — no surprises:

```bash
# iot-simulator (uv + poethepoet)
cd apps/country/iot/simulator && uv run poe ci     # quality + security + test

# hq-backend / hq-frontend (npm)
cd apps/hq/backend   # or apps/hq/frontend
npm run lint && npm run format:check && npm run typecheck && npm run build
npm audit --omit=dev --audit-level=high
npm run test:coverage
```

## Adding a service

1. **CI:** copy `ci-<existing>.yml` → `ci-<service>.yml`, adapt the path filter +
   commands (keep the gating verbatim), add a job in `ci.yml`.
2. **CD:** copy `cd-<existing>.yml` → `cd-<service>.yml`, adapt `SERVICE` / `IMAGE`
   / `CONTEXT`, add a `paths-filter` entry + a job in `release.yml`.

> `pull_request`-triggered workflows only take effect once they live on `main`
> (GitHub runs them from the base branch).
