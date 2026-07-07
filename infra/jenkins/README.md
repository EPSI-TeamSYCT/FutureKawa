# 🧰 Local Jenkins (proof of execution)

A fully **codified** Jenkins controller (Docker + Configuration-as-Code) to run
the CD [`Jenkinsfile`](../../Jenkinsfile) and capture the **proof of execution**
required by the brief — no manual UI setup.

## What's here

| File | Role |
|---|---|
| `Dockerfile` | Jenkins LTS + Docker CLI + Compose v2 + plugins |
| `plugins.txt` | required plugins (CasC, job-dsl, pipeline, git, credentials) |
| `casc.yaml` | **Configuration as Code**: admin user, `ghcr-pull` + `github-repo` credentials, and the `futurekawa-cd` pipeline job |
| `docker-compose.yml` | runs the controller, mounts the host Docker socket |

## Run

```bash
cp .env.example .env        # fill GHCR_* and GIT_* (GitHub PATs)
docker compose up -d --build
# Jenkins → http://localhost:8081  (admin / $JENKINS_ADMIN_PASSWORD)
```

The `futurekawa-cd` job is created automatically from `casc.yaml`. Trigger it with
**Build with Parameters** (`IMAGE_TAG`, `DEPLOY_DIR`) — the console log is the
proof of execution.

The pipeline: **Checkout → Pull images (GHCR) → Deploy (`docker compose up -d`) →
Smoke test** (curl `/health` + frontend over the stack network). It deploys the
HQ stack on the host Docker daemon via the mounted socket.

> ⚠️ Runs Jenkins as root with the Docker socket mounted — convenient for a
> **local demo**, not a hardened production controller.

## Teardown

```bash
docker compose down -v      # also removes the jenkins_home volume
```
