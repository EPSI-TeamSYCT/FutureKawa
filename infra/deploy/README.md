# 🚢 Deployment (Jenkins → VPS)

The **CD half** of our [hybrid CI/CD](../../docs/architecture/adr-001-ci-github-actions-cd-jenkins.md):
GitHub Actions builds and pushes images to GHCR; **Jenkins deploys them to the
VPS**. The pipeline lives in the root [`Jenkinsfile`](../../Jenkinsfile).

## How it works

```
GitHub Actions ──build+push──► GHCR ──pull──► Jenkins ──ssh──► VPS: docker compose up -d
```

Jenkins never builds anything. It pulls the pre-built images and rolls the stack:

1. **Checkout** — get the repo (for `docker-compose.yml`).
2. **Ship compose file** — `scp` the root compose to `$DEPLOY_DIR` on the VPS.
3. **Deploy on VPS** (over SSH) — `docker login ghcr.io` → `docker compose pull`
   → `docker compose up -d` → prune.

## Prerequisites

### Jenkins controller
- Plugins: **SSH Agent**, **Credentials Binding**, **Pipeline**.
- Two credentials:

  | ID | Kind | Value |
  |---|---|---|
  | `futurekawa-vps-ssh` | SSH private key | key of the deploy user on the VPS |
  | `ghcr-pull` | Username/password | user = GitHub login · password = PAT with `read:packages` |

- A pipeline job pointing at this repo's `Jenkinsfile` (Multibranch or Pipeline-from-SCM).

### VPS
- Docker + Docker Compose v2 installed.
- A deploy user with docker rights and the matching public key in `~/.ssh/authorized_keys`.
- The deploy directory and its `.env`:

  ```bash
  sudo mkdir -p /opt/futurekawa && sudo chown "$USER" /opt/futurekawa
  cd /opt/futurekawa
  # create .env (see the root .env.example) — pin the tag you deploy:
  cat > .env <<'EOF'
  REGISTRY=ghcr.io/epsi-teamsyct
  IMAGE_TAG=0.1.0
  COUNTRY_API_KEY=<real-key>
  COUNTRY_API_URL=http://stack-brazil:8000
  EOF
  ```

## Running a deploy

Trigger the job **Build with Parameters**:

| Parameter | Example | Meaning |
|---|---|---|
| `IMAGE_TAG` | `0.1.0` | GHCR tag to roll out (`latest` / `X.Y.Z` / `sha-xxxxxxx`) |
| `DEPLOY_HOST` | `deployer@203.0.113.10` | SSH target |
| `DEPLOY_DIR` | `/opt/futurekawa` | Deploy directory on the VPS |

> 🔁 **Automating it**: add a GitHub webhook (`push`/release) to the Jenkins job,
> or poll SCM, so a merge to `main` that publishes a new image triggers a deploy.
> Manual/parameterised runs keep an explicit, auditable rollout for the jury.

## Rollback

Re-run the job with a previous `IMAGE_TAG` (e.g. an earlier `X.Y.Z` or a
`sha-xxxxxxx`). Because every image keeps an immutable `:sha-<commit>` tag,
rollback is just "deploy the old tag".

## Security notes

- The GHCR token is passed to the VPS **via stdin** (`--password-stdin`), never on
  a command line; Jenkins masks the credential in logs.
- `docker logout` runs at the end of each deploy.
- Jenkins is a common attack target — keep it updated, behind auth, and off the
  public internet where possible. This is one reason CI stays on GitHub Actions
  (see the ADR).
