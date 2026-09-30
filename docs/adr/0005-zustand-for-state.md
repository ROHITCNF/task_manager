# ADR-0005: Zustand for state, positioned between the UI and the data layer

- **Status:** Accepted (the choice of Zustand is fixed; its position and rules were proposed in the HLD)
- **Date:** 2026-09-30

## Context

The UI needs shared app state (session, workspace, tasks, clients, dashboard, theme). The data layer is stateless (ADR-0003), and the UI must not call it directly (ADR-0004).

## Decision

- Use **Zustand** as the state layer. It is the **only consumer of the data layer** and the **only source of app data for the UI**.
- Stores are built with `zustand/vanilla` **factories that receive data-layer services** (dependency injection in `src/app/`). React reads them through `useStore` with narrow selectors.
- Stores hold **domain models**, plus a request status (`idle | loading | success | error`) and an error value.
- **Derived data** (board columns, calendar-by-date, filtered lists) is computed by **pure selectors** and never stored.
- **Pessimistic mutations** by default. Optimistic updates are opt-in per story.
- Persist only the `ui` store (theme) and the current workspace id, using localStorage.
- Ephemeral local UI state (form inputs, open/closed toggles) stays in component `useState`.
- The initial stores are session, workspace, tasks, clients, dashboard, and ui (HLD §4.2).

## Consequences

- Store logic can be tested in Node with fake services.
- We implement loading, error, and staleness handling ourselves; there is no TanStack Query. If server-state complexity grows, TanStack Query could replace the server-data portion of the stores in a future ADR.
- Selector discipline is needed to avoid re-renders. This is covered by LLD conventions.
