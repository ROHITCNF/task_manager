# 10 — Phase 2: foundations

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Output:**
  - `src/domain/` (models, status, priority, dates, rules, avatar)
  - `src/data/` (errors, HttpClient, gateways, mappers, services, factory)
  - `src/mocks/` (fixtures reproducing the screenshots, in-memory db, handlers for the full contract)
  - `src/state/` (8 vanilla stores, memoised selectors, React hooks and provider)
  - `src/app/` (composition root, theme, guards, layouts, route table)
  - `src/components/ui/` (tier-1 primitives and icons)
  - `public/mock-avatars/` (3 photo avatars cropped from the references)
  - Tests: `domain.test.js`, `data.test.js`, `contract.test.js`, `state.test.js`, `app.test.jsx`, `ui.test.jsx`, `tests/e2e/boot.spec.js`
  - LLD and API-guide updates

## Prompt

```
go ahead for phase 2
```

## Notes

- **Results:** 76 Vitest tests and 1 Playwright smoke test pass. `npm run lint` is clean and the build succeeds.
- **Mock data reproduces the references:**
  - column counts 4/49/10/0/9/1
  - per-person open counts and the unassigned count
  - calendar per-day counts and the "+N more" numbers
  - the "No due date" order
  - client order and task counts
  - member order
  - avatar colours (user ids were chosen so the UI's hash gives the reference colour)
- **The contract test found a real spec issue:** `avatarUrl` was `format: uri`, which rejects same-origin paths. It is now `uri-reference` in `openapi.yaml`.
- **Stylelint rule refined:** `calc()` and `color-mix()` are allowed only when every value inside is a `var(--…)` token or a unitless number.
- **Titles clipped in the calendar** ("Validation of protocol for SA…", etc.) were completed with best guesses. They are marked in `src/mocks/fixtures/tasks.js`.
- Every route renders `BlankPage` until its story (Phase 3) replaces it.
