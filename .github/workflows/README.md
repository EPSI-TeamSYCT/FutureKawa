# CI/CD workflows ⚙️

GitHub Actions only runs workflow files placed **flat** in this folder —
subfolders are ignored. We keep things modular through **reusable workflows**
instead of subfolders.

## Layout

| File | Role |
|---|---|
| `ci.yml` | 🎯 **Orchestrator** — detects which services changed and calls each service's reusable CI |
| `ci-<service>.yml` | ♻️ **Per-service** reusable workflow (`on: workflow_call`), runs that service's own pipeline |
| `cd.yml` / `cd-<service>.yml` | 🚀 Same pattern for deployment *(to come)* |

Each service owns its stack: the IoT simulator runs `uv run poe ci` (Python/uv),
the backend will run its npm pipeline, the API its Composer/PHPUnit one, etc.

## Add a service to CI

1. Create `ci-<service>.yml` with `on: workflow_call:` running that service's pipeline.
2. In `ci.yml`, add the service to the `paths-filter` list **and** a job that does
   `uses: ./.github/workflows/ci-<service>.yml` guarded by
   `if: ${{ needs.changes.outputs.<service> == 'true' }}`.

That's it — only the CI of changed services runs on each push/PR.
