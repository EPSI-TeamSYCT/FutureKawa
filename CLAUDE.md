# CLAUDE.md — FutureKawa monorepo (root scope)

Repo-wide context and conventions. Each area can refine these with its own nested
`CLAUDE.md` (e.g. `docs/CLAUDE.md`), which layers on top of this file when you work
inside that subtree.

## Monorepo layout

| Path | Purpose |
|---|---|
| `apps/country/api` | Country-level REST API |
| `apps/country/iot` | IoT layer: wiring, firmware, MQTT |
| `apps/country/database` | Country-level data store |
| `apps/hq/backend` | Headquarters backend |
| `apps/hq/frontend` | Headquarters frontend |
| `packages/auth` | Shared auth (JWT, roles, scopes) |
| `packages/config` | Shared configuration |
| `packages/contracts` | Shared API/message contracts |
| `packages/types` | Shared types |
| `infra/docker` `infra/k8s` `infra/terraform` | Deployment infrastructure |
| `docs/` | Centralised, cross-cutting & jury-facing documentation |
| `docs-site/` | Optional Docusaurus site aggregating the docs |

## Documentation model (hybrid — Solution 3)

- **Local technical docs** live next to the code as `README.md` in each app (English only):
  setup, how to run, endpoints, local technical choices.
- **`docs/`** holds cross-cutting and jury-facing documentation (architecture, security,
  tests, CI/CD, phase 2, the bilingual user guide, diagram exports).
- When working inside `docs/`, follow `docs/CLAUDE.md` for the detailed writing rules.

## Language policy (summary)

- Code-adjacent READMEs and everything in `docs/` are **English only**,
  EXCEPT `docs/user-guide/` which is **bilingual** (`en/` + `fr/`).
- Keep business terms consistent with the glossary in `PROJECT_STRUCTURE.md`.

## Definition of Done (cross-cutting)

- A behavioural change to an app updates that app's `README.md` in the **same PR**.
- Architectural decisions are recorded in `docs/architecture/` (EN).
- User-facing changes update `docs/user-guide/` (EN first, FR follows).

## Development workflow (git)

Full details in [`CONTRIBUTING.md`](CONTRIBUTING.md). Summary:

- **Commits are small and incremental.** One concern per commit; group related
  changes into logical batches. Prefer several focused commits over one large one.
- **Conventional Commits**, enforced by a `commit-msg` hook (commitlint):
  `type(scope): subject` — subject in imperative, lowercase, no trailing period,
  ≤ 72 chars. Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`,
  `ci`, `chore`, `revert`. Recommended scopes: `hq`, `country`, `api`, `iot`,
  `database`, `auth`, `config`, `contracts`, `types`, `infra`, `docs`, `docs-site`,
  `ci`, `deps`, `repo`.
- **Issue-first.** Every change tracks a GitHub issue: PR body uses `Closes #N`
  (or `Refs #N` if partial), commits may carry a `Refs #N` footer. The chain
  issue → branch → commits → PR → merge is the project's audit trail.
- **Branches**: `<type>/<#issue>-<short-kebab-description>` when an issue exists
  (e.g. `feat/42-iot-mqtt-ingest`), otherwise `<type>/<short-kebab-description>`.
- **Pull requests** are small and focused, fill `.github/pull_request_template.md`,
  and respect the Definition of Done above.
- Run `npm install` once at the repo root to activate the git hooks (husky).
