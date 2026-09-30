# ADR-0001: React with plain JavaScript

- **Status:** Accepted (fixed decision from the project owner)
- **Date:** 2026-09-30

## Context

We are rebuilding an existing task management web app to match the reference screenshots. We need a UI framework and a language.

## Decision

- Use **React** for the UI.
- Use **plain JavaScript** (ES modules, JSX). No TypeScript.
- Describe domain models and service contracts with **JSDoc `@typedef` / `@param`** comments, so editors can still offer type hints and autocompletion.

## Consequences

- There is less tooling to set up, and there is no compile-time type checking.
- The shape of domain models and DTOs is enforced only by mapper tests and JSDoc. Mapper unit tests (HLD §9) therefore matter more.
- Moving to TypeScript later is incremental (`allowJs`), and the JSDoc types carry over.
- shadcn/ui supports JavaScript projects (`tsx: false` in `components.json`), so this does not block ADR-0002.
