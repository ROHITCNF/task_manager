# ADR-0007: Vite as the build tool and dev server

- **Status:** Accepted (approved by project owner 2026-09-30)
- **Date:** 2026-09-30

## Context

A React + JavaScript single-page app needs a dev server, a bundler, and env handling. We don't need server-side rendering: the app sits behind a login, and there is no SEO requirement.

## Decision

Use **Vite** with `@vitejs/plugin-react`.

## Consequences

- We get fast HMR, native CSS Modules (ADR-0009), and `import.meta.env` with `VITE_*` variables for the mock/live switch (ADR-0006).
- Vitest shares Vite's config and transforms (ADR-0010).
- shadcn/ui officially supports Vite, which keeps ADR-0002's path open.
- The output is a static SPA. Hosting must rewrite all routes to `index.html`.
- Alternatives rejected: Next.js (SSR and server components are not needed, and they add complexity to a pure SPA); CRA (deprecated).
