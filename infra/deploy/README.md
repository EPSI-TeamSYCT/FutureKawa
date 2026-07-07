# 🚢 Continuous Deployment (Jenkins → VPS)

The **CD** half of our [hybrid CI/CD](../../docs/architecture/adr-001-ci-github-actions-cd-jenkins.md).
GitHub Actions builds & pushes the images to GHCR; **Jenkins pulls the immutable
image and deploys it** on the VPS. The pipeline is the root
[`Jenkinsfile`](../../Jenkinsfile).

## How it works

```
GitHub Actions (release.yml) ──build+push──► GHCR ──pull──► Jenkins ──► VPS: docker compose up -d ──► smoke test
```

Jenkins never rebuilds an image — it deploys exactly the artifact CI built and
tested (reproducible):

1. **Checkout** — get the repo (for `docker-compose.yml`).
2. **Pull images** — `docker login ghcr.io` → `docker compose pull` the requested tag.
3. **Deploy** — `docker compose up -d` + prune.
4. **Smoke test** — hit `/health` (backend) and the frontend, so a green run means
   the app is actually up, not just that compose ran.

## Prerequisites

### Jenkins node
- **Docker** + **Docker Compose v2** available to Jenkins, plus the **Credentials
  Binding** and **Pipeline** plugins.
- One credential:

  | ID | Kind | Value |
  |---|---|---|
  | `ghcr-pull` | Username/password | user = GitHub login · password = PAT with `read:packages` |

- A **Pipeline-from-SCM** (or Multibranch) job pointing at this repo's `Jenkinsfile`.

### Host / VPS
- Docker + Docker Compose v2. Jenkins runs the deploy here (so ports `:3000` /
  `:8080` are local for the smoke test).
- A deploy directory with its `.env`:

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

## Running a deploy

Trigger **Build with Parameters**:

| Parameter | Default | Meaning |
|---|---|---|
| `IMAGE_TAG` | `latest` | GHCR tag to deploy (`latest` · `X.Y.Z` · `sha-xxxxxxx`) |
| `DEPLOY_DIR` | `/opt/futurekawa` | deploy directory on the host |

> 🔁 Can be automated with a GitHub webhook (release) or SCM polling. A manual,
> parameterised run keeps an explicit, **auditable** rollout — its console log is
> the **proof of execution** for the dossier.

## Proof of execution (local Jenkins)

No server needed to demonstrate it — run Jenkins in Docker with the host Docker
socket mounted so the pipeline can deploy:

```bash
docker run -d --name jenkins -p 8081:8080 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
# then: add the ghcr-pull credential, create a Pipeline-from-SCM job on this repo,
# Build with Parameters, and screenshot the green run.
```

## Rollback

Re-run with a previous `IMAGE_TAG` (an earlier `X.Y.Z` or an immutable
`sha-xxxxxxx`). Rollback = deploy the old tag.

## Security notes

- The GHCR token is fed to `docker login` **via stdin** (`--password-stdin`),
  never on a command line; Jenkins masks the credential in logs, and
  `docker logout` runs after every build.
- Jenkins is a common attack target — keep it updated, behind auth, and off the
  public internet (see the ADR).
