import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Layer boundaries from docs/hld/hld.md §2, enforced with no-restricted-imports.
 * Each pattern list covers both the "@/x" alias and relative paths ("../x").
 */
const layer = (name) => [`@/${name}`, `@/${name}/**`, `**/${name}`, `**/${name}/**`];

const forbid = (message, ...groups) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: groups.flat(), message }] }],
});

const noFetch = {
  'no-restricted-globals': [
    'error',
    { name: 'fetch', message: 'UI and state never call HTTP directly (ADR-0004). Go through a store action.' },
  ],
};

export default [
  { ignores: ['dist/', 'coverage/', 'public/mockServiceWorker.js', 'playwright-report/', 'test-results/'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  { files: ['scripts/**', '*.config.js', 'tests/**'], languageOptions: { globals: { ...globals.node } } },

  // domain/ and config/: no dependencies on anything else in the app.
  {
    files: ['src/domain/**', 'src/config/**'],
    rules: forbid(
      'domain/ and config/ are dependency-free (HLD §2).',
      ['react', 'react-dom', 'zustand', 'zustand/*'],
      layer('data'), layer('state'), layer('components'), layer('features'), layer('pages'), layer('app'), layer('mocks'),
    ),
  },

  // data/: pure JS, no React / Zustand / UI (ADR-0003).
  {
    files: ['src/data/**'],
    rules: forbid(
      'data/ must not import React, Zustand, UI, state, app or mocks (ADR-0003).',
      ['react', 'react-dom', 'zustand', 'zustand/*', 'react-router'],
      layer('state'), layer('components'), layer('features'), layer('pages'), layer('app'), layer('mocks'),
    ),
  },

  // state/: no UI, no app, no mocks. No fetch.
  {
    files: ['src/state/**'],
    rules: {
      ...forbid(
        'state/ must not import UI, app or mocks (HLD §2).',
        layer('components'), layer('features'), layer('pages'), layer('app'), layer('mocks'),
      ),
      ...noFetch,
    },
  },

  // Tier 1 primitives: props and tokens only.
  {
    files: ['src/components/ui/**'],
    rules: {
      ...forbid(
        'components/ui (tier 1) knows nothing about domain, state or data (HLD §7).',
        layer('domain'), layer('state'), layer('data'), layer('features'), layer('pages'), layer('app'), layer('mocks'),
      ),
      ...noFetch,
    },
  },

  // Tier 2 domain components: presentational, no store access.
  {
    files: ['src/components/domain/**'],
    rules: {
      ...forbid(
        'components/domain (tier 2) is presentational: no state, data or higher tiers (HLD §7).',
        layer('state'), layer('data'), layer('features'), layer('pages'), layer('app'), layer('mocks'),
      ),
      ...noFetch,
    },
  },

  // Tier 3 features: stores yes, data layer no.
  {
    files: ['src/features/**'],
    rules: {
      ...forbid(
        'features/ reach data only through store actions (ADR-0004).',
        layer('data'), layer('pages'), layer('app'), layer('mocks'),
      ),
      ...noFetch,
    },
  },

  // Tier 4 pages: compose features only.
  {
    files: ['src/pages/**'],
    rules: {
      ...forbid(
        'pages/ compose features; state access belongs to features (HLD §7).',
        layer('data'), layer('state'), layer('app'), layer('mocks'),
      ),
      ...noFetch,
    },
  },

  // mocks/: act as the server; never reuse client code.
  {
    files: ['src/mocks/**'],
    rules: forbid(
      'mocks/ act as the server and must not reuse client code (ADR-0006).',
      layer('data'), layer('domain'), layer('state'), layer('components'), layer('features'), layer('pages'), layer('app'),
    ),
  },
];
