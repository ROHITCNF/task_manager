# 07 — HLD and ADRs

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Output:** `docs/hld/hld.md`, `docs/adr/0001`–`0010`, and the `CLAUDE.md` Tech stack section

## Prompt

```
Write the HLD in docs/hld/hld.md and one ADR per major decision in docs/adr
FIXED DECISIONS : 1. React with plain JavaScript. 2. Native HTML + our own CSS. No component library now; keep it easy to add shadcn/ui later. 3. Data layer: pure JS classes, no React imports. Handles all server/mock communication and maps responses to domain models. 4. UI layer: pure React. Never calls HTTP directly; gets data only through the data layer. 5. Zustand for state. MSW for mock data; switching to a real API must need only config changes.
Cover : Layer diagram , Data laye , Zustand's exact position , Routes, repo folder structure, and component tiers , Theming , Testing approach at a high level ,
Design only: no src/ code, no method signatures (those go in the LLD). Update CLAUDE.md's stack section when done.
```

## Notes

- ADRs 0001–0006 record the fixed decisions (Accepted).
- ADRs 0007–0010 are Claude's proposals (Vite, React Router, CSS Modules + token pipeline, and the testing stack). Their status is **Proposed** until approved.
- Design choices beyond the brief:
  - Domain models are plain immutable objects, not classes.
  - Stores are built with `zustand/vanilla` factories, and services are injected into them.
  - Only tier-3 features may touch stores.
  - MSW fixtures use the backend wire format.
  - Dark mode uses the `.dark` class, which matches shadcn.
- The biggest blocker is the unknown real backend API contract (HLD A1), which live mode depends on.
