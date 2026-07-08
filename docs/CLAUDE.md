# CLAUDE.md — docs/ (documentation scope)

You are working in the **documentation** area of the FutureKawa monorepo.
Stay scoped to docs unless explicitly asked to read code for accuracy.

## Documentation model (hybrid — Solution 3)

- **Local technical docs** live next to the code as `README.md` in each app — NOT here.
  Do not duplicate them in `docs/`. Link to them if needed.
- **`docs/` holds cross-cutting and jury-facing documentation**: architecture,
  security, tests, CI/CD, phase 2, the bilingual user guide, and diagram exports.

## Language policy

- Everything in `docs/` is **English only**, EXCEPT the **field-facing** docs, which
  are **multilingual** to match the operators on site:
  - `docs/user-guide/` — `en/` · `fr/` · `pt/` (Brazil) · `es/` (Ecuador & Colombia)
  - `docs/change-management/` — same four languages
- Write the **English master first**, then mirror to FR / PT / ES (same structure).
- Keep business terms consistent across languages (lot/lote, warehouse/entrepôt/
  armazém/almacén, exploitation/fazenda/finca, alert/alerta…).

## Directory map

| Folder | Content | Lang |
|---|---|---|
| `architecture/` | overview, distributed system, data model | EN |
| `security/` | auth (JWT, roles, scopes, OWASP) | EN |
| `tests/` | test strategy & plans | EN |
| `ci-cd/` | GitHub Actions pipeline (CI + release) | EN |
| `deployment/` | how to run the docker-compose stacks | EN |
| `phase2/` | automation schema, interview questionnaire | EN |
| `user-guide/{en,fr,pt,es}` | business user guide | EN · FR · PT · ES |
| `change-management/{en,fr,pt,es}` | change-management plan | EN · FR · PT · ES |
| `schemas/` | rendered diagram exports (PNG) + Mermaid sources | neutral |

## Writing rules

- Markdown only. Exactly one `#` H1 per file (the title).
- File names: kebab-case English (`data-model.md`). French user-guide files may use
  French names (`prise-en-main.md`).
- Use **relative links** between docs so a future static site resolves them.
- Reference diagrams from `docs/schemas/` with relative image links — never paste
  large inline base64.
- Be concise and factual. Prefer short sections with clear headings over long prose.
- When a doc describes something implemented in code, you may read that code to stay
  accurate, but do not modify code from this scope.

## Local app README template

When asked to create an app README (outside docs/, but following this template):

```
# <App name>

## Overview
What this service does, in 2-3 sentences.

## Stack
Key technologies.

## Setup
Prerequisites and install steps.

## Run
How to start it (local + via docker compose).

## Endpoints / Topics
REST endpoints or MQTT topics this app exposes/consumes.

## Tests
How to run tests for this app.

## Local decisions
Notable technical choices specific to this app and why.
```

## Sync rule

Documentation is part of Definition of Done. A behavioural change to an app must
update that app's README in the same PR. Architectural decisions are recorded here
in `architecture/`. User-facing changes update `user-guide/` (EN first, FR follows).
