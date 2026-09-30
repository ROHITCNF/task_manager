# ADR-0008: React Router for routing

- **Status:** Accepted (approved by project owner 2026-09-30)
- **Date:** 2026-09-30

## Context

There are 7 referenced screens plus blocked ones (HLD §5). We need a public layout (Login) and an authenticated shell layout with a guard, plus lazy-loaded pages.

## Decision

- Use **React Router** in library (SPA) mode.
- Use nested layout routes: a public layout, and an authenticated `AppShell` layout wrapped by an auth guard that reads the session store.
- Pages are lazy-loaded per route.
- Data loading stays in the Zustand stores (ADR-0005). We **do not** use React Router's loaders/actions, so that data access has a single path.

## Consequences

- It is a well-known and widely documented API.
- Not using router loaders means pages trigger their own loads through features on mount. That is a slightly later fetch start than loaders would give, and we accept it for consistency with ADR-0004 and ADR-0005.
- Whether board filters and the calendar month go in URL search params is still open (HLD A3).
