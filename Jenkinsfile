// FutureKawa — full CI/CD pipeline (Jenkins).
//
// This is the industrialisation pipeline required by the brief (deliverable 5):
// it runs EVERY stage — quality, tests, packaging — and then deploys. It is
// meant to run on / next to the target VPS and is triggered manually, so a
// deploy that happens days after the last GitHub Actions run still re-validates
// everything from scratch before shipping (no stale artifact is ever deployed).
//
// GitHub Actions stays as the fast per-PR gate; Jenkins owns the complete
// build → test → quality → package → deploy chain (see
// docs/architecture/adr-001-ci-github-actions-cd-jenkins.md).
//
// Requirements on the Jenkins node (see infra/deploy/README.md):
//   - Docker + the Docker Pipeline plugin (per-stage container agents)
//   - access to the Docker daemon (build/push/deploy)
//   - credentials: `ghcr-pull` (GitHub user + PAT with write:packages)

pipeline {
  agent none

  parameters {
    string(name: 'IMAGE_TAG',   defaultValue: 'latest',          description: 'Tag to build/push/deploy (latest | X.Y.Z | sha-xxxxxxx)')
    booleanParam(name: 'PUSH_IMAGES', defaultValue: true,        description: 'Push the built images to GHCR')
    booleanParam(name: 'DEPLOY',      defaultValue: true,        description: 'Roll the HQ stack after packaging')
    string(name: 'DEPLOY_DIR',  defaultValue: '/opt/futurekawa', description: 'Deploy directory on the host')
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
    // 1) Quality + security + tests, per service, in parallel. Each runs in the
    //    right toolchain container so the Jenkins node only needs Docker.
    stage('Quality & Tests') {
      parallel {
        stage('iot-simulator') {
          agent { docker { image 'ghcr.io/astral-sh/uv:python3.12-bookworm' } }
          steps {
            checkout scm
            dir('apps/country/iot/simulator') {
              // poe ci = quality (ruff/mypy/vulture) + security (pip-audit) + tests (pytest, 80% gate)
              sh 'uv run poe ci'
            }
          }
        }
        stage('hq-backend') {
          agent { docker { image 'node:22-bookworm' } }
          steps {
            checkout scm
            dir('apps/hq/backend') {
              sh 'npm ci'
              sh 'npm run lint'
              sh 'npm run format:check'
              sh 'npm run typecheck'
              sh 'npm run build'
              sh 'npm audit --omit=dev --audit-level=high'
              sh 'npm run test:coverage'
            }
          }
        }
        stage('hq-frontend') {
          agent { docker { image 'node:22-bookworm' } }
          steps {
            checkout scm
            dir('apps/hq/frontend') {
              sh 'npm ci'
              sh 'npm run lint'
              sh 'npm run format:check'
              sh 'npm run typecheck'
              sh 'npm run build'
              sh 'npm audit --omit=dev --audit-level=high'
              sh 'npm run test:coverage'
            }
          }
        }
      }
    }

    // 2) Package each service as a Docker image and (optionally) push to GHCR.
    stage('Package & Push') {
      agent any
      steps {
        checkout scm
        script {
          def services = [
            'iot-simulator': 'apps/country/iot/simulator',
            'hq-backend'   : 'apps/hq/backend',
            'hq-frontend'  : 'apps/hq/frontend',
          ]
          if (params.PUSH_IMAGES) {
            withCredentials([usernamePassword(credentialsId: 'ghcr-pull',
                usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
              sh 'printf "%s" "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin'
            }
          }
          services.each { name, ctx ->
            def image = "${REGISTRY}/futurekawa-${name}:${params.IMAGE_TAG}"
            sh "docker build -t ${image} ${ctx}"
            if (params.PUSH_IMAGES) {
              sh "docker push ${image}"
            }
          }
          if (params.PUSH_IMAGES) {
            sh 'docker logout ghcr.io'
          }
        }
      }
    }

    // 3) Deploy the HQ stack locally on the host (Jenkins runs on/next to the VPS).
    stage('Deploy') {
      agent any
      when { expression { params.DEPLOY } }
      steps {
        checkout scm
        sh '''
          set -eu
          mkdir -p "$DEPLOY_DIR"
          cp docker-compose.yml "$DEPLOY_DIR/docker-compose.yml"
          cd "$DEPLOY_DIR"
          export REGISTRY IMAGE_TAG
          docker compose pull
          docker compose up -d --remove-orphans
          docker image prune -f
          docker compose ps
        '''
      }
    }
  }

  post {
    success {
      echo "Pipeline OK — images @ '${params.IMAGE_TAG}'" + (params.DEPLOY ? " · deployed to ${params.DEPLOY_DIR}" : '')
    }
    failure {
      echo 'Pipeline failed — see the stage logs above.'
    }
  }
}
