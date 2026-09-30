# 08 — API contract, implementation plan, Phase 0 docs

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5 (plan mode, then execution)
- **Plan:** `~/.claude/plans/cozy-waddling-minsky.md` (approved)
- **Output:**
  - `docs/lld/api/openapi.yaml`, `docs/lld/api/api-contract.md`
  - `docs/adr/0011-rest-api-contract.md`, `docs/adr/0012-auth-mock-then-cookie-session.md`
  - `docs/requirements/user-stories.md`
  - `docs/design/tokens/{color,typography,space,size,radius-shadow}.json`
  - `docs/lld/{data-layer,state,components,routing,testing}.md`
  - Updates to `docs/hld/hld.md` (v2), `docs/requirements/gaps.md` (decisions log), and `CLAUDE.md`

## Prompt

```
Biggest blocker: real backend API contract unknown (U can choose the API response request design ) as backend i will create only . Make sure it's scalable . Also if u have any further requirements please ask . better write a plan to mplement in plan mode
```

## Clarifying answers from the user

| Question | Answer |
|---|---|
| Missing screens | Defer. Build only the referenced screens. |
| Calendar bug (C1) | Fix: use an equal 7-column grid. |
| Auth | "u can go withb mock login (later we will wire)" |
| Dark mode | Defer. The toggle works; the dark palette stays empty. |

## Notes

- The tokens were sampled from the screenshot pixels with a throwaway PNG decoder in the scratchpad (no image libraries were available). Every value is marked `estimated`. The font family is uncertain (Inter or SF Pro).
- OpenAPI was validated with `npx @redocly/cli lint`: 0 errors. The remaining warnings are stylistic (missing tag descriptions, and some operations without 4xx responses).
- Phase 0 ends at a review checkpoint. No `src/` code yet.
