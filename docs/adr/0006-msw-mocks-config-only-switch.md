# ADR-0006: MSW for mock data, with a config-only switch to the real API

- **Status:** Accepted (fixed decision from the project owner; the mechanism was proposed in the HLD)
- **Date:** 2026-09-30

## Context

The real backend contract is not yet available (HLD open question A1). We need realistic data now, and switching to the real API must need **only config changes**.

## Decision

- Use **Mock Service Worker (MSW)**. It intercepts `fetch` at the network level (a Service Worker in the browser, a node interceptor in tests).
- The data layer is **identical in both modes**. Every request goes through the real HTTP client, gateways, and mappers.
- The mode is selected by environment config:
  - `VITE_API_MODE=mock|live`
  - `VITE_API_BASE_URL`
  - the auth entry URL (see HLD §3.4)
- `main.jsx` starts the MSW worker only when `mock`. The mock code is excluded from production bundles by a dynamic import behind that check.
- **Fixtures use the backend wire (DTO) format** and reproduce the data visible in the reference screenshots.
- The same fixtures serve dev mode, integration tests, E2E, and visual-parity tests.
- Full-page OAuth redirects cannot be intercepted, so in mock mode the auth entry URL (from config) points to a mock sign-in handler.

## Consequences

- Moving to the real API means changing `.env` values, with no code edits, **provided the fixtures match the real contract**. Until the contract is known, the fixtures and mappers are provisional and may need rework.
- Because the mappers are exercised in mock mode, mapping bugs show up early.
- `public/mockServiceWorker.js` is a generated file that must be regenerated when MSW is upgraded.
