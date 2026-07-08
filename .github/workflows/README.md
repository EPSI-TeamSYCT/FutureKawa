# CI/CD workflows ⚙️

| File | Trigger | Role |
|---|---|---|
| `ci.yml` | `pull_request` | 🎯 **CI orchestrator** — calls each service's reusable CI pipeline |
| `ci-<service>.yml` | `workflow_call` | ♻️ **Per-service CI** — sequential job chain (below) |
| `release.yml` | `pull_request` `closed` (merged) | 🏷️ **Release orchestrator** — derives the version bump + calls each changed service's build/push |
| `cd-<service>.yml` | `workflow_call` | 📦 **Per-service build & push** to GHCR (+ SemVer tag) |

## CI — job chain (per service)

Runs on **pull requests only** (save resources). Jobs run **sequentially**:

```
changes → quality → security → tests
```

| Job | Runs when | Does |
|---|---|---|
| `changes` | always (first) | detects if the service **code** changed |
| `quality` | code changed | lint · format · typecheck · deadcode — **skipped if no code change** |
| `security` | quality passed **or was skipped** (not if it failed) | dependency/CVE audit — **every PR**, even without a code change |
| `tests` | code changed **and** quality + security passed | unit tests + coverage gate |

## Release — build, push & versioning

Runs when a PR is **merged into `main`**. The version bump comes from the **source
branch name** (read from the PR event, so it works with squash-merges):

| Branch prefix | Version bump | Image tags |
|---|---|---|
| `feat/` · `feature/` | **minor** (`1.2.0` → `1.3.0`) | `:1.3.0` + `:sha-xxxxxxx` + `:latest` |
| `fix/` | **patch** (`1.2.0` → `1.2.1`) | `:1.2.1` + `:sha-xxxxxxx` + `:latest` |
| anything else (`docs/`, `ci/`, `chore/`…) | **none** | `:sha-xxxxxxx` + `:latest` (no SemVer) |
| **major** | **manual** — create `<service>-vX.0.0` by hand; the automation continues from there | |

- **Per service:** only services with image-relevant changes (`src/`, deps, `Dockerfile`)
  are versioned/pushed. Each keeps its own version via tags `<service>-vX.Y.Z`.
- **Registry:** GitHub Container Registry (`ghcr.io/epsi-teamsyct/futurekawa-<service>`),
  authenticated with the built-in `GITHUB_TOKEN` — **no secrets to configure**.
- **Traceability:** the immutable `:sha-<commit>` tag ties each image to its exact commit.

## Add a service

- **CI:** copy `ci-iot-simulator.yml` → `ci-<service>.yml` (adapt paths + commands),
  add a job in `ci.yml`.
- **CD:** copy `cd-iot-simulator.yml` → `cd-<service>.yml` (adapt `SERVICE`, `IMAGE`,
  `CONTEXT`), add a `paths-filter` entry + a job in `release.yml`.

> These `pull_request`-triggered workflows only take effect once they live on `main`
> (GitHub runs them from the base branch). The release flow is first validated on the
> next real `feat/`|`fix/` merge.
