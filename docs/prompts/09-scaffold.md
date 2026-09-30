# 09 — Font, ADR approval, Phase 1 scaffold

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Output:**
  - `docs/design/tokens/typography.json` (Geist) and `color.json` (semantic avatar palette)
  - ADRs 0007–0011 → Accepted
  - Scaffold: `package.json`, `vite.config.js`, `eslint.config.js`, `stylelint.config.js`, `playwright.config.js`, `index.html`, `.env.*`, `.gitignore`, `scripts/build-tokens.js`, `src/{main.jsx,config,styles,mocks}`, and the folder skeleton
  - `CLAUDE.md` Commands section

## Prompt

```
font-family: 'Geist'; ADRs 0007–0011 fine
```

## Notes

- Installed versions are newer than Claude's reference knowledge: React 19.3, react-router 8.4, Vite 8.3, Vitest 5, MSW 3.0, ESLint 10, Stylelint 17. The APIs used (`createBrowserRouter`, `setupWorker`/`setupServer`, `createStore`) were checked against the installed packages.
- `eslint-plugin-react` was dropped (ESLint 10 compatibility risk; ESLint 10 tracks JSX references natively). `eslint-plugin-react-hooks` is kept.
- `main.jsx` checks `import.meta.env.VITE_API_MODE` directly, so live builds contain no MSW code. Verified: the chunk is gone from `dist/`.
- The lint rules were verified with throwaway violating files: React in `data/`, `data`/`state` imports in `pages/`, `fetch` in the UI, and hex, rgb, and raw px values in CSS were all rejected.
- Playwright browsers are not installed yet. That happens with the first visual test.
