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

## Workflow & traceability (GitHub Projects)

Every change is traceable end-to-end: **issue → branch → commit → PR → merge**.
The FutureKawa GitHub Project board reflects the current state of each piece of work.

### Step 1 — Start from an issue

Create an issue first (use the **Feature** or **Bug** template). Even tiny chores
get a one-line issue. Add it to the FutureKawa Project; pick labels (type + area)
and a priority.

### Step 2 — Branch from main, prefix with the issue number

`<type>/<#issue>-<short-kebab-description>` — e.g. `feat/42-iot-mqtt-ingest`.
The issue number in the branch name makes the link obvious even before a PR exists.

### Step 3 — Reference the issue in commits

Add a `Refs #<issue>` footer so each commit shows up on the issue's timeline:

```
feat(iot): publish sensor readings to mqtt

Refs #42
```

### Step 4 — Open the PR with `Closes #<issue>`

The PR template has a `Closes #<issue>` line at the top — fill it. GitHub
auto-closes the issue when the PR merges, and moves the linked card to **Done**.
Use `Refs #<issue>` instead if the PR is partial (does not finish the issue).

### Project board columns

- **Backlog** — captured but not committed to
- **Todo** — ready to pick up
- **In progress** — actively worked
- **In review** — PR open
- **Done** — merged or closed

Enable the built-in Project workflows (UI → Project settings → Workflows):
*Item added to project*, *Pull request merged → Done*, *Item closed → Done*.

### Labels (canonical set)

- **type**: `type:feat`, `type:fix`, `type:docs`, `type:refactor`, `type:chore`,
  `type:test`, `type:perf`, `type:build`, `type:ci`
- **area**: `area:hq`, `area:country`, `area:iot`, `area:infra`, `area:docs`
- **priority**: `prio:high`, `prio:med`, `prio:low`
- **status**: `status:blocked`

Apply them once after the GitHub repo is created, with the `gh` CLI:

```bash
for t in feat fix docs refactor chore test perf build ci; do
  gh label create "type:$t" -c "1f77b4" -f
done
for a in hq country iot infra docs; do
  gh label create "area:$a" -c "2ca02c" -f
done
gh label create "prio:high" -c "d62728" -f
gh label create "prio:med"  -c "ff7f0e" -f
gh label create "prio:low"  -c "7f7f7f" -f
gh label create "status:blocked" -c "9467bd" -f
```

## Branches

Use `<type>/<#issue>-<short-kebab-description>` when the work tracks an issue
(recommended), or `<type>/<short-kebab-description>` otherwise:

- `feat/42-iot-mqtt-ingest`
- `fix/57-api-auth-401`
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

With an issue footer (preferred when the work tracks an issue):

```
feat(iot): publish sensor readings to mqtt

Refs #42
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
