# ADR-0010: Testing stack — Vitest, React Testing Library, MSW, and Playwright

- **Status:** Accepted (approved by project owner 2026-09-30)
- **Date:** 2026-09-30

## Context

We need confidence in four areas:

- the data mapping
- store logic
- component variants
- visual parity with the reference screenshots

CLAUDE.md forbids changing tests to make them pass.

## Decision

| Level | Tool |
|---|---|
| Domain, data layer, and store unit tests | **Vitest** (node environment); data-layer tests use **MSW node** |
| Component and integration tests | **Vitest + React Testing Library** (jsdom); integration tests use MSW |
| E2E | **Playwright** against the app in mock mode |
| Visual parity | **Playwright screenshot comparison** against `docs/design/reference/*.png`: same viewport and DPR, fixtures that reproduce the reference data, a frozen clock (2026-09-30), and a small diff threshold |
| Architecture and style rules | **ESLint** (`no-restricted-imports`) and **Stylelint** |

Unit and component tests are colocated with their code. E2E and visual tests live in `tests/`.

## Consequences

- One MSW fixture set serves dev, tests, and visual checks.
- Visual tests are sensitive to font rendering and OS. They must run in one pinned environment (e.g. Playwright's Docker image in CI) to be stable.
- A pixel-exact match against screenshots taken from the old app may be unreachable (anti-aliasing, fonts). The threshold value will be set in the LLD and reviewed.
