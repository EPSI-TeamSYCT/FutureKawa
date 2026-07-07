// FutureKawa — Continuous Deployment (Jenkins).
//
// Division of labour (see docs/architecture/adr-001-ci-github-actions-cd-jenkins.md):
//   - GitHub Actions `ci.yml`      → per-PR gate (lint · tests · quality).
//   - GitHub Actions `release.yml` → PACKAGING: build + push images to GHCR
//                                    (branch-based SemVer + :sha + :latest).
//   - Jenkins (this file)          → CD: PULL the immutable images + deploy + verify.
//
// Jenkins never rebuilds an image: it deploys exactly the artifact that CI built
// and tested (reproducible). It runs on / next to the VPS, triggered manually.
//
// Requirements on the Jenkins node (see infra/deploy/README.md):
//   - Docker + Docker Compose v2, with access to the daemon
//   - credential `ghcr-pull` (GitHub user + PAT with read:packages)

pipeline {
  agent any

  parameters {
    string(name: 'IMAGE_TAG',  defaultValue: 'latest',          description: 'GHCR tag to deploy: latest | X.Y.Z | sha-xxxxxxx')
    string(name: 'DEPLOY_DIR', defaultValue: '/opt/futurekawa', description: 'Deploy directory on the host')
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

    // Authenticate to GHCR and pull the images CI already built & pushed.
    stage('Pull images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'ghcr-pull',
            usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
          sh '''
            set -eu
            printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
            mkdir -p "$DEPLOY_DIR"
            cp docker-compose.yml "$DEPLOY_DIR/docker-compose.yml"
            cd "$DEPLOY_DIR"
            export REGISTRY IMAGE_TAG
            docker compose pull
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          set -eu
          cd "$DEPLOY_DIR"
          export REGISTRY IMAGE_TAG
          docker compose up -d --remove-orphans
          docker image prune -f
          docker compose ps
        '''
      }
    }

    // Prove the deployment is actually up (liveness), not just that compose ran.
    stage('Smoke test') {
      steps {
        sh '''
          set -eu
          echo "Waiting for the backend health endpoint..."
          for i in $(seq 1 20); do
            if curl -fsS http://localhost:3000/health >/dev/null 2>&1; then
              echo "backend /health OK"; break
            fi
            [ "$i" = 20 ] && { echo "backend health check FAILED"; exit 1; }
            sleep 3
          done
          curl -fsS http://localhost:8080/ >/dev/null && echo "frontend reachable OK"
        '''
      }
    }
  }

  post {
    success {
      echo "Deployed tag '${params.IMAGE_TAG}' to ${params.DEPLOY_DIR} — smoke test passed."
    }
    failure {
      echo 'Deploy / smoke test failed — see the stage logs above.'
    }
    always {
      sh 'docker logout ghcr.io || true'
    }
  }
}
