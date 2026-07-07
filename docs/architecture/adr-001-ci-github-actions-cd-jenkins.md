# ADR-001 — CI on GitHub Actions, CD on Jenkins (hybrid)

- **Status:** Accepted
- **Date:** 2026-07-07
- **Deciders:** Team SYCT

## Context

The MSPR brief **explicitly requires a Jenkins pipeline**. In 2026, however,
GitHub-native CI (GitHub Actions) is generally a better fit than Jenkins for
pull-request validation: it is cloud-hosted (no server to run or secure), tightly
integrated with the repo, and needs no plugin maintenance. Jenkins, on the other
hand, is self-hosted and shines when a pipeline must reach **private,
on-premises infrastructure** — exactly our case for deploying onto the team's
**VPS**.

We want to honour the requirement **and** make a technically defensible choice —
the level of critical judgement expected at the end of M1.

## Decision

Adopt a **hybrid** where each tool plays to its strength, with **Jenkins owning
the complete industrialisation pipeline**:

| Tool | Role | Responsibility |
|---|---|---|
| **GitHub Actions** | Fast **per-PR gate** | lint · format · typecheck · CVE audit · tests (coverage) on every pull request — quick, cloud-native feedback before merge |
| **Jenkins** (self-hosted) | **Full CI/CD pipeline** (the graded deliverable) | re-runs **quality · security · tests · packaging (Docker → GHCR) · deploy** in one run, on/next to the VPS |

The Jenkins pipeline (root [`Jenkinsfile`](../../Jenkinsfile)) runs **every stage
from scratch and then deploys**, triggered manually. This is deliberate: a deploy
may happen days after the last PR merge, so re-validating build/tests/quality at
deploy time guarantees **no stale artifact is ever shipped**. Setup in
[`infra/deploy/`](../../infra/deploy/README.md).

## Rationale

- **Right tool for each job.** GHA gives fast, zero-maintenance feedback on every
  PR; Jenkins, self-hosted next to the VPS, industrialises the whole chain and
  deploys on-prem where it holds the Docker credentials.
- **Freshness guarantee.** Because Jenkins rebuilds and retests at deploy time, a
  manual deployment long after the last CI run is still fully validated.
- **Satisfies the brief.** Deliverable 5 asks for a Jenkins pipeline covering
  build, tests, quality and packaging (+ proof of execution) — Jenkins owns
  exactly that, end to end.
- **Separation of concerns.** The registry boundary keeps build and deploy
  independent and each auditable.

## Alternatives considered

| Option | Why not |
|---|---|
| **All Jenkins** (CI + CD) | Heavier: a server to host/secure for every PR build, worse DX and integration than GHA, more plugin maintenance. |
| **All GitHub Actions** (incl. deploy via SSH) | Does not satisfy the "Jenkins pipeline" requirement; also pushes VPS secrets into the cloud CI. |
| **Watchtower** (auto-pull on the VPS) | No pipeline, no control, no audit trail, no gating — unacceptable for a graded CD. |
| **Argo CD** | GitOps for Kubernetes; overkill for a single VPS running Docker Compose. |
| **Ansible** | Viable, but adds tooling the brief doesn't ask for and duplicates what a small Jenkins deploy already does. |

## Consequences

**Positive**
- Best-in-class CI, a compliant and genuinely useful CD, and a clear artifact boundary.
- Rollback is trivial: re-deploy a previous immutable `:sha-<commit>` / `:X.Y.Z` tag.

**Negative / to manage**
- A Jenkins instance must be **hosted, updated and secured** (Jenkins is a frequent
  CVE target) — mitigated by keeping it off the public internet and behind auth.
- Two systems for the team to understand instead of one.

## References

- [CI/CD pipeline](../ci-cd/pipeline.md)
- [Deployment guide](../deployment/running-the-stack.md)
- [`Jenkinsfile`](../../Jenkinsfile) · [`infra/deploy/`](../../infra/deploy/README.md)
