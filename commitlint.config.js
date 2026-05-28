// Conventional Commits config for the FutureKawa monorepo.
// See CONTRIBUTING.md for the human-readable rules.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep subjects short.
    'header-max-length': [2, 'always', 72],
    // Recommended monorepo scopes — level 1 = warning, so unknown scopes
    // don't block a commit but get flagged.
    'scope-enum': [
      1,
      'always',
      [
        'repo',
        'docs',
        'docs-site',
        'ci',
        'deps',
        'release',
        'hq',
        'hq-backend',
        'hq-frontend',
        'country',
        'api',
        'iot',
        'database',
        'auth',
        'config',
        'contracts',
        'types',
        'infra',
        'docker',
        'k8s',
        'terraform',
      ],
    ],
    // Don't fail on long lines inside body/footer (e.g. URLs) — warn only.
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
};
