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

Adopt a **hybrid** CI/CD split at the container-registry boundary:

| Phase | Tool | Responsibility |
|---|---|---|
| **CI** | GitHub Actions | lint · format · typecheck · CVE audit · tests (coverage) · **build & push images to GHCR** |
| **CD** | Jenkins (self-hosted) | pull the GHCR images · **deploy to the VPS** (`docker compose up -d` over SSH) |

**GHCR is the handoff**: GitHub Actions produces the artifact, Jenkins consumes
it. The Jenkins pipeline is the root [`Jenkinsfile`](../../Jenkinsfile); setup in
[`infra/deploy/`](../../infra/deploy/README.md).

## Rationale

- **Right tool for each job.** GHA is cloud-native and ideal for PR CI; Jenkins,
  self-hosted next to the VPS, holds the SSH/Docker credentials and deploys
  on-prem without exposing them to the cloud.
- **Satisfies the brief.** A real, working Jenkins pipeline exists and owns the
  deployment — the part where Jenkins genuinely adds value.
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
