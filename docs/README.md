# FutureKawa Documentation

Centralised, cross-cutting and jury-facing documentation for the FutureKawa monorepo.
Local technical docs (setup, run, endpoints) live in each app's `README.md`.

## Sections

- **Architecture**
  - [Overview](architecture/overview.md)
  - [Distributed System](architecture/distributed-system.md)
  - [Data Model](architecture/data-model.md)
  - [ADR-001 — CI on GitHub Actions, CD on Jenkins](architecture/adr-001-ci-github-actions-cd-jenkins.md)
- **Security**
  - [Authentication & Authorization](security/auth.md)
- **Tests**
  - [Test Strategy](tests/strategy.md)
- **CI/CD**
  - [Pipeline](ci-cd/pipeline.md)
- **Deployment**
  - [Running the stack](deployment/running-the-stack.md)
- **Phase 2**
  - [Automation Schema](phase2/automation-schema.md)
  - [Interview Questionnaire](phase2/interview-questionnaire.md)
- **User Guide** (bilingual)
  - [Getting Started (EN)](user-guide/en/getting-started.md)
  - [Prise en main (FR)](user-guide/fr/prise-en-main.md)
- **Schemas**
  - [Diagram exports](schemas/README.md)

## Local app docs

- [country/api](../apps/country/api/README.md)
- [country/iot](../apps/country/iot/README.md)
- [country/database](../apps/country/database/README.md)
- [hq/backend](../apps/hq/backend/README.md)
- [hq/frontend](../apps/hq/frontend/README.md)

## Conventions

Docs writing rules live in `CLAUDE.md` (this folder). English only, except
`user-guide/fr/`.
