# ADR-0009: CSS Modules, a token pipeline, and class-based theming

- **Status:** Accepted (approved by project owner 2026-09-30)
- **Date:** 2026-09-30

## Context

ADR-0002 requires our own CSS. CLAUDE.md rule 3 requires tokens-only styling from `docs/design/tokens/`. The app has a System/Light/Dark toggle, and shadcn/ui may be adopted later.

## Decision

- **CSS Modules** (`*.module.css`), one per component, for scoped class names. No CSS-in-JS.
- A **token pipeline**: `scripts/build-tokens.js` turns `docs/design/tokens/*.json` into `src/styles/tokens.css` (CSS custom properties). It runs before dev, build, and test.
- **Two token levels**: primitive (raw scale values) and semantic (roles). Components reference semantic tokens only.
- **Theming**: light values on `:root`, dark values under the `.dark` class on `<html>` (the shadcn convention). The preference (`system|light|dark`) lives in the `ui` store and is persisted. An inline pre-paint script in `index.html` prevents a flash of the wrong theme.
- **Per-client colours** are runtime data, passed through an inline CSS custom property. This is the only allowed runtime colour.
- **Stylelint** enforces the tokens-only rule (no raw colours, px/rem, or font values in module CSS).

## Consequences

- Styles are scoped, and `var(--…)` is used everywhere, so a theme switch involves no JS re-render.
- The dark palette is unknown (gap T1), so dark mode ships only after a reference exists.
- If shadcn/ui is adopted, it brings Tailwind. Our semantic variables can be aliased to shadcn's variable names, but the migrated components will use Tailwind classes, not CSS Modules. Two styling approaches would coexist during the migration.
- Alternatives rejected: Tailwind now (it conflicts with the fixed "own CSS" decision); global BEM CSS (weaker scoping); CSS-in-JS (runtime cost, and a poor fit with shadcn).
