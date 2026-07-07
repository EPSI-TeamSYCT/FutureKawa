# CI/CD workflows ⚙️

| File | Trigger | Role |
|---|---|---|
| `ci.yml` | `pull_request` | 🎯 **Main orchestrator** — the only entry point; calls each service's reusable pipeline |
| `ci-<service>.yml` | `workflow_call` | ♻️ **Per-service reusable** pipeline — its own sequential job chain |
| `cd.yml` / `cd-<service>.yml` | — | 🚀 Same pattern for deployment *(to come)* |

Runs on **pull requests only** (no push → save resources).

## Job chain (inside each service pipeline)

Jobs run **sequentially**, each depending on the previous one:

```
changes → quality → security → tests
```

| Job | Runs when | Does |
|---|---|---|
| `changes` | always (first) | detects if the service **code** changed (`src/`, `tests/`, `pyproject.toml`, `uv.lock`) |
| `quality` | code changed | lint · format · typecheck · deadcode — **skipped if no code change** |
| `security` | quality passed **or was skipped** (not if it failed) | dependency/CVE audit — **runs on every PR**, even without a code change |
| `tests` | code changed **and** quality + security passed | unit tests + coverage gate |

### Why this shape

- **No code change → skip `quality` and `tests`, still run `security`.** A newly
  disclosed **CVE** is caught on every PR even when nothing in the code moved.
- **Fail-fast:** if `quality` fails, `security`/`tests` are skipped, thanks to
  `if: ${{ needs.quality.result == 'success' || needs.quality.result == 'skipped' }}`
  — run after quality *unless it failed*.

## Add a service to CI

1. Copy `ci-iot-simulator.yml` to `ci-<service>.yml` (keep `on: workflow_call`),
   and adapt the `changes` paths + per-job commands to the service's stack
   (npm/eslint/jest for the backend, Composer/PHPUnit for the API, etc.).
2. In `ci.yml`, add one job: `uses: ./.github/workflows/ci-<service>.yml`.

> Trade-off: separate jobs re-run setup (`uv sync`) each — mitigated by the uv cache.
> `pull_request`-only means a CVE disclosed **between** PRs is caught at the next PR;
> add an `on: schedule` nightly run later to close that window.
