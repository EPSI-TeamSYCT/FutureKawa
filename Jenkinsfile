// FutureKawa — Continuous Deployment (Jenkins).
//
// Hybrid CI/CD (see docs/architecture/adr-001-ci-github-actions-cd-jenkins.md):
//   - GitHub Actions owns CI + builds/pushes images to GHCR.
//   - Jenkins (this file) owns CD: it deploys those images onto the target VPS.
//
// This pipeline never builds anything — it pulls pre-built GHCR images and runs
// `docker compose up -d` on the VPS over SSH. Setup & prerequisites:
//   infra/deploy/README.md
//
// Required Jenkins credentials:
//   - futurekawa-vps-ssh : SSH private key for the deploy user on the VPS
//   - ghcr-pull          : username = GitHub user, password = PAT (read:packages)

pipeline {
  agent any

  parameters {
    string(name: 'IMAGE_TAG',   defaultValue: 'latest',           description: 'GHCR tag to deploy: latest | X.Y.Z | sha-xxxxxxx')
    string(name: 'DEPLOY_HOST', defaultValue: 'deployer@vps',     description: 'SSH target (user@host) of the VPS')
    string(name: 'DEPLOY_DIR',  defaultValue: '/opt/futurekawa',  description: 'Deploy directory on the VPS')
  }

  environment {
    REGISTRY = 'ghcr.io/epsi-teamsyct'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    // Push the (declarative) compose file to the VPS. The .env on the VPS holds
    // the environment-specific values (tags, keys) and is NOT overwritten here.
    stage('Ship compose file') {
      steps {
        sshagent(credentials: ['futurekawa-vps-ssh']) {
          sh '''
            set -eu
            ssh -o StrictHostKeyChecking=accept-new "$DEPLOY_HOST" "mkdir -p '$DEPLOY_DIR'"
            scp -o StrictHostKeyChecking=accept-new docker-compose.yml "$DEPLOY_HOST:$DEPLOY_DIR/docker-compose.yml"
          '''
        }
      }
    }

    stage('Deploy on VPS') {
      steps {
        sshagent(credentials: ['futurekawa-vps-ssh']) {
          withCredentials([usernamePassword(
              credentialsId: 'ghcr-pull',
              usernameVariable: 'GHCR_USER',
              passwordVariable: 'GHCR_TOKEN')]) {
            sh '''
              set -eu

              # 1) Authenticate to GHCR on the VPS (token via stdin, never in argv).
              printf '%s' "$GHCR_TOKEN" | ssh -o StrictHostKeyChecking=accept-new "$DEPLOY_HOST" \
                "docker login ghcr.io -u '$GHCR_USER' --password-stdin"

              # 2) Pull the requested tag and roll the stack.
              ssh -o StrictHostKeyChecking=accept-new "$DEPLOY_HOST" \
                REGISTRY="$REGISTRY" IMAGE_TAG="$IMAGE_TAG" DEPLOY_DIR="$DEPLOY_DIR" 'bash -s' <<'REMOTE'
                set -euo pipefail
                cd "$DEPLOY_DIR"
                export REGISTRY IMAGE_TAG
                docker compose pull
                docker compose up -d --remove-orphans
                docker logout ghcr.io
                docker image prune -f
                docker compose ps
REMOTE
            '''
          }
        }
      }
    }
  }

  post {
    success {
      echo "Deployed tag '${params.IMAGE_TAG}' to ${params.DEPLOY_HOST}:${params.DEPLOY_DIR}"
    }
    failure {
      echo 'Deploy failed — check the stage log above.'
    }
    always {
      cleanWs()
    }
  }
}
