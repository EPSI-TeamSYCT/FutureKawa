# 🚢 CI/CD industrialisation (Jenkins)

The **full CI/CD pipeline** required by the brief lives in the root
[`Jenkinsfile`](../../Jenkinsfile). It runs on / next to the target VPS and, in a
single run, executes **every stage and then deploys**:

```
Quality & Tests (per service, parallel) ─► Package (Docker) ─► Push (GHCR) ─► Deploy (docker compose up)
```

Unlike the [GitHub Actions PR gate](../../docs/ci-cd/pipeline.md), Jenkins
**rebuilds and retests from scratch at deploy time** — so a manual deploy days
after the last merge never ships a stale artifact. See
[ADR-001](../../docs/architecture/adr-001-ci-github-actions-cd-jenkins.md).

## Stages

| Stage | Runs in | Does |
|---|---|---|
| **Quality & Tests** | one toolchain container per service (parallel) | `iot-simulator`: `uv run poe ci` (ruff/mypy/vulture · pip-audit · pytest 80%) · `hq-backend` / `hq-frontend`: `lint` · `format:check` · `typecheck` · `build` · `npm audit` · `test:coverage` |
| **Package & Push** | Docker on the node | `docker build` each service, then `docker push` to GHCR (optional) |
| **Deploy** | Docker on the node | `docker compose pull` + `up -d` the HQ stack locally |

## Prerequisites

### Jenkins node
- **Docker** available to Jenkins (the daemon/socket) + the **Docker Pipeline**
  and **Credentials Binding** plugins. Per-stage `agent { docker { image … } }`
  means the node itself only needs Docker — Node/uv come from containers.
- One credential:

  | ID | Kind | Value |
  |---|---|---|
  | `ghcr-pull` | Username/password | user = GitHub login · password = PAT with `write:packages` |

- A **Pipeline-from-SCM** (or Multibranch) job pointing at this repo's `Jenkinsfile`.

### Host / VPS
- Docker + Docker Compose v2.
- A deploy directory with its `.env` (Jenkins runs the deploy here):

  ```bash
  sudo mkdir -p /opt/futurekawa && sudo chown "$USER" /opt/futurekawa
  cd /opt/futurekawa
  cat > .env <<'EOF'
  REGISTRY=ghcr.io/epsi-teamsyct
  IMAGE_TAG=0.1.0
  COUNTRY_API_KEY=<real-key>
  COUNTRY_API_URL=http://stack-brazil:8000
  EOF
  ```

## Running the pipeline

Trigger **Build with Parameters**:

| Parameter | Default | Meaning |
|---|---|---|
| `IMAGE_TAG` | `latest` | tag to build / push / deploy (`latest` · `X.Y.Z` · `sha-xxxxxxx`) |
| `PUSH_IMAGES` | `true` | push the built images to GHCR |
| `DEPLOY` | `true` | roll the HQ stack after packaging |
| `DEPLOY_DIR` | `/opt/futurekawa` | deploy directory on the host |

> 🔁 Can be automated with a GitHub webhook (push/release) or SCM polling. A
> manual, parameterised run keeps an explicit, **auditable** rollout — and its
> console log is the **proof of execution** expected by the brief.

## Proof of execution (local Jenkins)

No server needed to demonstrate it — run Jenkins in Docker and mount the host
Docker socket so the pipeline can build/deploy:

```bash
docker run -d --name jenkins -p 8080:8080 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
# then: install "Docker Pipeline", add the ghcr-pull credential,
# create a Pipeline-from-SCM job on this repo, Build with Parameters,
# and screenshot the green run for the dossier.
```

## Rollback

Re-run with a previous `IMAGE_TAG` (an earlier `X.Y.Z` or an immutable
`sha-xxxxxxx`). Rollback = deploy the old tag.

## Security notes

- The GHCR token is fed to `docker login` **via stdin** (`--password-stdin`),
  never on a command line; Jenkins masks the credential in logs, and
  `docker logout` runs after the push.
- Jenkins is a common attack target — keep it updated, behind auth, and off the
  public internet. Keeping the per-PR gate on GitHub Actions limits Jenkins'
  exposure (see the ADR).
