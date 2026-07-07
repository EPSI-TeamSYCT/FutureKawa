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

Adopt a **hybrid split at the container-registry boundary**, each tool playing to
its strength:

| Tool | Role | Responsibility |
|---|---|---|
| **GitHub Actions — `ci.yml`** | Per-PR gate | lint · format · typecheck · CVE audit · tests (coverage) on every pull request |
| **GitHub Actions — `release.yml`** | **Packaging** | on merge to `main`: **build + push images to GHCR** (branch-based SemVer + `:sha` + `:latest`) |
| **Jenkins** (self-hosted) | **Continuous Deployment** | **pull** the immutable images + **deploy** (`docker compose up -d`) + **smoke test**, on/next to the VPS |

**GHCR is the handoff**: GitHub Actions produces the immutable artifact, Jenkins
consumes it. Jenkins never rebuilds — it deploys *exactly* the image that CI built
and tested. The pipeline is the root [`Jenkinsfile`](../../Jenkinsfile); setup in
[`infra/deploy/`](../../infra/deploy/README.md).

## Rationale

- **Right tool for each job.** GHA gives fast, zero-maintenance feedback and
  cloud-native image builds; Jenkins, self-hosted next to the VPS, deploys on-prem
  where it holds the Docker credentials.
- **Reproducibility.** Building once in CI and deploying the *same* immutable image
  everywhere avoids the "works in CI, differs at deploy" class of bug — better than
  rebuilding at deploy time.
- **No duplication.** Images are built in exactly one place (`release.yml`).
- **Satisfies the brief.** Deliverable 5 (build · tests · quality · packaging + a
  Jenkins pipeline with proof of execution) is covered across the CI/CD system:
  GHA owns build/tests/quality/packaging, Jenkins owns the documented, auditable
  deploy — its console log is the proof of execution.

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
