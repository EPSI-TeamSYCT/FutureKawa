// @ts-check
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'FutureKawa',
  tagline: 'Project documentation',
  favicon: 'img/favicon.ico',

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // GitHub Pages deployment config — TODO: replace placeholders with the real
  // org/user and repo. For a project site, baseUrl must be '/<repo>/'.
  url: 'https://YOUR-ORG.github.io',
  baseUrl: '/FutureKawa/',
  organizationName: 'YOUR-ORG', // GitHub org/user
  projectName: 'FutureKawa', // GitHub repo
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  // App READMEs live outside the docs/ content tree, so cross-tree relative
  // links resolve on GitHub but not as Docusaurus routes — warn, don't throw.
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Single source of truth: the centralised docs/ folder at repo root.
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          // CLAUDE.md is an authoring instruction file, not a doc page.
          exclude: ['**/CLAUDE.md'],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'FutureKawa',
        logo: {
          alt: 'FutureKawa Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/YOUR-ORG/FutureKawa',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {label: 'Documentation home', to: '/'},
              {label: 'Architecture overview', to: '/architecture/overview'},
              {label: 'User guide (EN)', to: '/user-guide/en/getting-started'},
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} FutureKawa. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
