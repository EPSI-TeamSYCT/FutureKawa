# docs-site (Docusaurus)

Static documentation site for FutureKawa, built with [Docusaurus](https://docusaurus.io/).
It is **optional (V3)** and aggregates the centralised docs.

## What it reads

- Content source is the repo's `../docs/` folder (single source of truth), wired via
  `docs.path: '../docs'` in `docusaurus.config.js`. The docs site root (`/`) is the
  docs index (`docs/README.md`); the sidebar is auto-generated from the folder tree.
- `docs/CLAUDE.md` is excluded from the build (it is an authoring instruction file).

## Install

```bash
cd docs-site
npm install
```

## Local development

```bash
npm start
```

## Build

```bash
npm run build
```

Output goes to `docs-site/build/`.

## Deployment (GitHub Pages)

Set the real values in `docusaurus.config.js` first: `url`, `baseUrl`,
`organizationName`, `projectName` (currently placeholders `YOUR-ORG` / `FutureKawa`).

```bash
GIT_USER=<your GitHub username> npm run deploy
```

This builds the site and pushes to the `gh-pages` branch.

## Known limitations / TODO

- **i18n**: locales are `en` (default) + `fr`. Docusaurus i18n is whole-site, not
  per-section, so the bilingual scope ("FR for the user guide only") is currently
  expressed at the content level — the FR user guide lives at
  `../docs/user-guide/fr/` and shows up in the sidebar. Real FR translations of the
  rest of the site, if ever needed, go under `docs-site/i18n/fr/`
  (`npm run write-translations -- --locale fr`).
- **App READMEs**: not yet aggregated into the site. They live next to the code
  (`apps/**/README.md`). Links to them from `docs/` resolve on GitHub but are outside
  the Docusaurus content tree (hence `onBrokenLinks: 'warn'`). To include them, add
  extra `@docusaurus/plugin-content-docs` instances pointing at each app folder.
