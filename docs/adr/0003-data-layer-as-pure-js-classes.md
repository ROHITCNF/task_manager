# ADR-0003: Data layer as pure JavaScript classes

- **Status:** Accepted (fixed decision from the project owner; the internal structure was proposed in the HLD)
- **Date:** 2026-09-30

## Context

The UI must not be coupled to the network, and we need to switch between mock data and the real API. The mapping from the backend's wire format to our domain models needs a single home.

## Decision

- `src/data/` is a **framework-free layer of plain JS classes**: no React and no Zustand imports.
- It handles **all** server and mock communication and **maps responses to domain models**.
- Internal structure (HLD §3):
  - `http/`: a single fetch-based client that also normalises errors
  - `api/`: resource gateways that know endpoints and DTO shapes
  - `mappers/`: DTO ↔ domain conversion
  - `services/`: domain-facing classes that the stores use
  - `errors/`: typed errors
  - `index.js`: a factory that returns the wired services
- **Domain models are immutable plain objects** (JSDoc typedefs in `src/domain/`), not class instances. This keeps them serialisable and friendly to Zustand's and React's reference-equality checks.
- The data layer is stateless: no caching.
- The layer is built once, in the composition root (`src/app/`), and injected into the stores.

## Consequences

- The layer can be unit-tested in Node with MSW's node server, without a DOM or React.
- Backend field names appear only in `mappers/` and `api/`. An API change touches only those folders.
- Because there is no cache in this layer, the stores (ADR-0005) own freshness and deduplication.
- ESLint import restrictions enforce the no-React, no-Zustand rule (HLD §2).
