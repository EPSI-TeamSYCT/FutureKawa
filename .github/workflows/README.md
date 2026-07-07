# CI/CD workflows ⚙️

One **standalone workflow per service**, named `ci-<service>.yml`. Each runs on
**pull requests only** (no push → save resources) and owns its own stack.

## Job chain (per service)

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
- **Fail-fast:** if `quality` fails, `security`/`tests` are skipped. The trick is
  `if: ${{ needs.quality.result == 'success' || needs.quality.result == 'skipped' }}`
  — run after quality *unless it failed*.

## Add a service to CI

1. Copy `ci-iot-simulator.yml` to `ci-<service>.yml`.
2. Update the `changes` path filters and the per-job commands to the service's stack
   (npm/eslint/jest for the backend, Composer/PHPUnit for the API, etc.).

> Trade-off: separate jobs re-run setup (`uv sync`) each — mitigated by the uv cache —
> in exchange for independent status and reruns per stage.
> Note: `pull_request`-only means a CVE disclosed **between** PRs is caught at the next
> PR; add an `on: schedule` nightly run later if you want to close that window.
