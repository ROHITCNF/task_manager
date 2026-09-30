# ADR-0004: UI layer is pure React and never calls HTTP

- **Status:** Accepted (fixed decision from the project owner)
- **Date:** 2026-09-30

## Context

Mixing fetch calls into components makes them hard to test, ties them to one backend, and scatters the mapping logic.

## Decision

- The UI layer (`components/`, `features/`, `pages/`) is **pure React**.
- It **never calls `fetch` or any HTTP client** and **never imports `src/data/`**.
- It gets data **only through the data layer, via the Zustand stores**: features select state and call store actions, and store actions call data-layer services (ADR-0005).
- Only tier-3 features access stores. Tier-1 and tier-2 components are presentational and receive props.

## Consequences

- Components can be tested with plain props (tiers 1–2) or with stores backed by fake services (tier 3). No network mocking is needed at the component level.
- One extra hop (the store) exists even for simple reads. We accept that for consistency.
- ESLint `no-restricted-imports` blocks `src/data/**` and bare `fetch` usage inside the UI folders.
