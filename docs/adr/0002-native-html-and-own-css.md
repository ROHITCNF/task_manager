# ADR-0002: Native HTML and our own CSS, shadcn/ui-ready

- **Status:** Accepted (fixed decision from the project owner)
- **Date:** 2026-09-30

## Context

The UI must match the screenshots exactly. A component library would bring its own look, which we would then have to override. At the same time, the team may want shadcn/ui later.

## Decision

- Build UI from **native HTML elements** (`button`, `input`, `select`, `textarea`, `nav`, `ul`) styled with **our own CSS**. See ADR-0009 for how the CSS is organised.
- **No component library** for now.
- Keep a clear swap boundary so that shadcn/ui can be adopted later:
  - Primitives live in `src/components/ui/`, which is shadcn's default path.
  - Primitive names and variant props follow shadcn conventions (`Button` with `variant`/`size`, `Input`, `Select`, `Card`, `Avatar`…) wherever the screenshots allow.
  - Only tier-2 domain components consume primitives. Tiers 3 and 4 do not restyle them.
  - Semantic CSS variables can be aliased to shadcn's names (`--background`, `--primary`, `--radius`…), and dark mode uses the `.dark` class (see ADR-0009).

## Consequences

- We get full visual control and a small bundle.
- We must build accessibility behaviour ourselves where native elements are not enough (e.g. the segmented control and any custom dropdown). We prefer native elements to reduce that work.
- Adopting shadcn later means replacing files in `components/ui/` one at a time. shadcn requires Tailwind, so adoption also means adding Tailwind and mapping our tokens into its config. That is a known future cost.
