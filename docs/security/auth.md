# 🔐 Authentication & security

How FutureKawa protects its APIs and hardens its images. The country APIs hold
each country's sovereign data, so the security model starts at their front door:
a **shared API key** (`X-API-KEY`). This document covers that auth model, the
secrets policy, the OWASP API touchpoints, and the SonarCloud + Docker hardening
that CI enforces. It pairs with the [CI/CD pipeline](../ci-cd/pipeline.md).

## Table of contents

- [API-key authentication](#api-key-authentication)
- [Secrets policy](#secrets-policy)
- [OWASP API Top-10 touchpoints](#owasp-api-top-10-touchpoints)
- [SonarCloud security rules](#sonarcloud-security-rules)
- [Image hardening](#image-hardening)

## 🔑 API-key authentication

Every data route of a country API requires a shared secret in the `X-API-KEY`
header. Enforcement lives in `App\EventSubscriber\ApiKeySubscriber`, a Symfony
kernel subscriber:

| Property | Value |
|---|---|
| Header | `X-API-KEY` |
| Hooked on | `KernelEvents::REQUEST` (priority `10`, main request only) |
| Scope | requests whose path starts with **`/api`** only |
| Comparison | `hash_equals()` — **constant-time**, resists timing attacks |
| Empty key guard | a blank configured key **rejects everything** (fails closed) |
| On failure | `401 Unauthorized` (`UnauthorizedHttpException`, `WWW-Authenticate: X-API-KEY`) |
| Key source | `%env(COUNTRY_API_KEY)%` — from the environment, never hardcoded |

The **HQ backend** is the legitimate caller: its single shared axios client
attaches `X-API-KEY: <COUNTRY_API_KEY>` (and `Accept: application/json`) to every
request to a country API.

```
HQ backend ──[ X-API-KEY: <key> ]──► country API (/api/*) ──► 200 | 401
```

> 💡 The model is **service-to-service**: HQ ⇄ country API. It authenticates the
> caller, not an end user. Fine-grained **roles/scopes (and JWT)** are a documented
> phase-2 evolution once human logins enter the picture; today the surface is a
> trusted BFF talking to sovereign APIs behind a shared key.

## 🗝️ Secrets policy

The rule is simple: **no secret is ever committed**. Secrets come from the
environment at deploy time.

| Rule | Where it shows |
|---|---|
| No secret in git | the committed base `apps/country/api/.env` has an **empty** `APP_SECRET` and a **passwordless** `DATABASE_URL`; real values are injected by the environment |
| Env-based injection | Docker Compose / `.env.local` / the real environment provide `COUNTRY_API_KEY`, `APP_SECRET`, `DB_PASSWORD`, `MAILER_DSN` |
| Examples are placeholders | `.env.example` files ship a demo default `change-me` (and `change-me-strong`) that is **meant to be replaced** |
| Same key both ends | HQ sends `COUNTRY_API_KEY`; the country API validates the same variable |

> ⚠️ `change-me` is a **demo placeholder only**. Any real deployment must set a
> strong, unique `COUNTRY_API_KEY` (and `APP_SECRET`, `DB_PASSWORD`) via the
> environment. The empty-key guard in the subscriber means a misconfigured key
> denies all access rather than silently accepting a blank one.

## 🛡️ OWASP API Top-10 touchpoints

How the current design maps onto the [OWASP API Security Top-10](https://owasp.org/API-Security/).
Honest scope: some items are fully addressed, others are basic-by-design given the
service-to-service model.

| OWASP API risk | FutureKawa touchpoint | State |
|---|---|---|
| **API1** Broken Object Level Auth | HQ resolves object relations server-side; no user-supplied object IDs cross a trust boundary unchecked | ✅ addressed |
| **API2** Broken Authentication | `X-API-KEY` required on all `/api/*`; constant-time compare; fails closed on empty key | ✅ addressed |
| **API3** Broken Property Level Auth | API Platform serializer exposes only mapped fields; HQ re-maps to DTOs | ✅ addressed |
| **API5** Broken Function Level Auth | only `/api/*` data routes are gated; non-data routes intentionally open | ✅ scoped |
| **API7** SSRF | HQ calls a **fixed, configured** `COUNTRY_API_URL`; no user-controlled outbound URLs | ✅ addressed |
| **API8** Security Misconfiguration | prod images run non-root, `APP_ENV=prod` / `APP_DEBUG=0`, explicit `COPY`; SonarCloud checks config | ✅ addressed |
| **API9** Improper Inventory Management | services + endpoints documented in `docs/`; images tagged `:sha-<commit>` | ✅ addressed |
| **API10** Unsafe Consumption of APIs | HQ validates every country-API response with **zod** at the boundary before use | ✅ addressed |
| **API4** Unrestricted Resource Consumption | per-request timeout + fallback cache on HQ; no rate-limit on the API yet | 🟡 partial |
| **API6** Unrestricted Access to Business Flows | single trusted caller today; revisit with human logins in phase 2 | 🟡 phase 2 |

## 🔎 SonarCloud security rules

SonarCloud auto-analysis runs on every PR and its **Quality Gate blocks the
merge** (see [pipeline](../ci-cd/pipeline.md#quality-gates-coverage--sonarcloud)).
Beyond coverage and code smells, it enforces security rules that back the policies
above:

| Rule area | What it catches | Our answer |
|---|---|---|
| **Hardcoded secrets** | credentials/keys literal in source | secrets are env-only; `.env` examples hold `change-me` placeholders |
| **Docker non-root** | containers running as `root` | images set an explicit non-root `USER` (see below) |
| **Explicit COPY** | `COPY . .` leaking dev/secret files into an image | the country API copies **only** `bin config migrations public src translations .env` |
| **Pinned CI actions** | mutable action tags (supply-chain) | all `uses:` pinned to full commit SHAs |

## 🐳 Image hardening

Every service image is minimized and runs unprivileged where possible.

| Image | Base | Non-root user | Notable hardening |
|---|---|---|---|
| `country-api` | `dunglas/frankenphp` (alpine) | ✅ `www-data` | **explicit COPY** (never `COPY . .`); `--no-dev` deps; `APP_ENV=prod`, `APP_DEBUG=0`; non-privileged port `:8000` |
| `hq-backend` | `node:22-alpine` (multi-stage) | ✅ `node` | build/runtime split; `npm ci --omit=dev`; `NODE_ENV=production`; `HEALTHCHECK` on `/health`; port `:3000` |
| `hq-frontend` | `nginxinc/nginx-unprivileged` (multi-stage) | ✅ UID `101` | only built `dist/` shipped (no toolchain, no source); serves on `:8080` |
| `iot-simulator` | `python:3.12-slim` | 🟡 root (residual) | copies **only** `pyproject.toml` + `src` (no `COPY . .`); `uv sync --no-dev` |

> ⚠️ The simulator image does not yet set a non-root `USER` — a tracked hardening
> item. It ships no secret and copies only its source, but adding a dedicated user
> would bring it in line with the other three images.

Shared practices across all images: multi-stage or slim bases (small attack
surface), production-only dependencies (dev/test tooling never ships), explicit
file copying, and non-privileged ports.
