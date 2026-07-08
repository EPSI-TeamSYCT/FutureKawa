# 🧭 ADR-001 — Hybrid CI/CD: GitHub Actions builds, Jenkins deploys

An Architecture Decision Record explaining how FutureKawa splits CI/CD between
**GitHub Actions** and **Jenkins**, and why. It complements the
[CI/CD pipeline](./pipeline.md) reference.

## Table of contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Alternatives considered](#alternatives-considered)
- [Consequences](#consequences)
- [Proof of execution](#proof-of-execution)

## 📌 Status

**Accepted.** In force for all four services (`iot-simulator`, `hq-backend`,
`hq-frontend`, `country-api`).

## 🧩 Context

- The MSPR brief **mandates the use of Jenkins** in the delivery chain.
- The team also wants **GitHub-native CI**: checks that run on every pull request,
  block merges, and live next to the code (reusable workflows, SHA-pinned actions,
  SonarCloud Quality Gate).
- The runtime target is a single **VPS**, onto which the stack is deployed with
  Docker Compose (HQ stack + one country stack per country).
- A core architectural value is **reproducibility**: the same immutable image must
  run in a demo, on the VPS, and on any teammate's laptop.

Forcing *everything* through Jenkins would throw away GitHub's PR-native gating;
forcing everything through GitHub Actions would ignore the brief. We need each
tool where it adds the most value.

## ✅ Decision

Split the chain at the **image boundary** — build once, deploy anywhere:

| Stage | Tool | Responsibility |
|---|---|---|
| **CI** (quality, security, tests, coverage, SonarCloud) | **GitHub Actions** | Gate every PR |
| **Packaging** (build + push immutable image) | **GitHub Actions** (`release.yml` → `cd-*.yml`) | Build once on merge to `main`, push to GHCR with `:sha-<commit>` + SemVer tags |
| **CD** (pull, deploy, smoke-test) | **Jenkins** | Pull the exact immutable GHCR image onto the VPS, deploy via Docker Compose, run a smoke test, keep the **proof of execution** |

The two systems meet at **GHCR**: GitHub Actions is the only producer of images,
Jenkins is the consumer. Jenkins never rebuilds — it pulls the digest that CI
already validated and published, so what the jury sees running is bit-for-bit what
passed CI.

## 🔀 Alternatives considered

### A. Jenkins does everything (build + test + deploy) — ❌ rejected

- Duplicates the CI logic that already lives in reusable GitHub workflows.
- Loses GitHub-native PR gating (required checks, SonarCloud on the PR).
- Builds on the VPS ⇒ non-reproducible images, build toolchain + secrets on the
  deployment host, weaker supply-chain story.

### B. GitHub Actions does everything (build + deploy) — ❌ rejected

- Violates the brief's explicit Jenkins requirement.
- Couples build and deploy: an SSH-deploy step from Actions to the VPS ties image
  publication to host availability and puts VPS credentials into Actions.
- No independent "deploy this exact digest" control point, which is exactly the
  separation the immutable-image model gives us.

## ⚖️ Consequences

**Positive**

- ♻️ **Build once, deploy anywhere** — the image is immutable and identical across
  environments; Jenkins deploys a known digest, not a fresh build.
- 🔒 **Clean supply chain** — no build tooling or app secrets on the VPS; GHCR is
  the single, auditable artifact source.
- 🧾 **Strong audit trail** — issue → PR → green CI → published `:sha-<commit>` →
  Jenkins deploy of that digest, end to end.
- 🎓 **Satisfies the brief** — Jenkins owns real, valuable work (deployment +
  smoke test on the VPS), not a token stage.

**Negative / trade-offs**

- 🛠️ **Two systems to maintain** (GitHub Actions + Jenkins) and one integration
  seam (GHCR) to keep authenticated.
- 🔑 Jenkins needs GHCR **pull** credentials (a `read:packages` token) and SSH/host
  access to the VPS.
- ⛓️ A deploy depends on CI having published the image first; the ordering is
  intentional but must be understood by operators.

## 📸 Proof of execution

> 📸 **[SCREENSHOT]** — The Jenkins job console for a country-api deploy: pulling
> `ghcr.io/epsi-teamsyct/futurekawa-country-api:sha-<commit>`, `docker compose up`
> on the VPS, and the smoke-test step reporting **SUCCESS** (proof of execution).
