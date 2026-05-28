# Contributing to FutureKawa

Development rules for the FutureKawa monorepo. They are enforced lightly by tooling
(a `commit-msg` hook) and otherwise by convention. Documentation is part of the
Definition of Done (see [`CLAUDE.md`](CLAUDE.md)).

## Setup

Activate the git hooks once after cloning:

```bash
npm install
```

This installs [husky](https://typicode.github.io/husky/) and
[commitlint](https://commitlint.js.org/) and registers the `commit-msg` hook that
validates every commit message.

## Branches

Use `<type>/<short-kebab-description>`, where `<type>` matches a commit type:

- `feat/iot-mqtt-ingest`
- `fix/api-auth-401`
- `docs/architecture-overview`
- `chore/repo-gitignore`

Keep branches short-lived and focused on a single topic.

## Commits

### Granularity

- **Small and incremental.** One logical concern per commit. Prefer several focused
  commits over a single large one.
- **Group related changes into logical batches.** Don't mix an unrelated refactor
  into a feature commit; split them.
- Each commit should build/leave the tree in a coherent state.

### Format — Conventional Commits

```
type(scope): subject

[optional body]

[optional footer(s)]
```

Rules (enforced by commitlint):

- **Subject**: imperative mood, lowercase, no trailing period, **≤ 72 characters**.
- **type** (required), one of:

  | Type | Use for |
  |---|---|
  | `feat` | A new feature |
  | `fix` | A bug fix |
  | `docs` | Documentation only |
  | `refactor` | Code change that neither fixes a bug nor adds a feature |
  | `perf` | Performance improvement |
  | `test` | Adding or fixing tests |
  | `build` | Build system or dependencies |
  | `ci` | CI configuration |
  | `chore` | Maintenance, tooling, repo housekeeping |
  | `revert` | Reverts a previous commit |

- **scope** (recommended): the area touched. Unknown scopes are flagged as a warning,
  not rejected. Recommended scopes:
  `hq`, `hq-backend`, `hq-frontend`, `country`, `api`, `iot`, `database`,
  `auth`, `config`, `contracts`, `types`, `infra`, `docker`, `k8s`, `terraform`,
  `docs`, `docs-site`, `ci`, `deps`, `release`, `repo`.
- **Breaking changes**: add `!` after the type/scope (`feat(api)!: ...`) and/or a
  `BREAKING CHANGE:` footer.

### Examples

Good:

```
feat(iot): publish sensor readings to mqtt
fix(api): reject expired jwt with 401
docs(architecture): add distributed-system overview
chore(repo): add root gitignore and commit hooks
```

Bad:

```
Update stuff.                 # no type, vague, trailing period
feat: Added a New Feature     # past tense + capitals
fix(api): correct the token validation so that expired tokens are handled  # > 72 chars
```

## Pull requests

- Keep PRs **small and focused** — easier to review, faster to merge.
- Fill in [`.github/pull_request_template.md`](.github/pull_request_template.md).
- At least one review before merge.
- Respect the **Definition of Done**:
  - App behaviour change → update that app's `README.md` in the same PR.
  - Architectural decision → record it in `docs/architecture/`.
  - User-facing change → update `docs/user-guide/` (EN first, then FR).
