# 11 — Phase 3: user stories US-01..US-11

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Output:**
  - Features: `src/features/{auth,shell,home,tasks,calendar,clients,quick-capture,settings}`
  - Domain components: `src/components/domain/{dashboard,task}.jsx`
  - Pages and routes: every referenced route now has its page
  - Tests: component tests per story, e2e flows (`tests/e2e/`), and visual diffs against the references (`tests/visual/`, pixelmatch)
  - Tokens: measured additions (login title 20px, line-height snug 1.3, sidebar and toolbar sizes, pill 21px)

## Prompts

```
Phase 3
```
```
one thing u build now then i will review then we will make pixel perfecct
```
```
commit and push the code
```

## Notes

- The visual diffs use pixelmatch against the references in code, so a failing run can never overwrite a reference.
- US-01..US-03 were pixel-tuned:
  - login: 0.13%
  - sidebar: 0.5–1.2%
  - home: 0.57%
- Tuning stopped when the user asked to build first and pixel-tune after review. First-pass results:
  - quick capture: 0.41%
  - clients: 0.59%
  - calendar: 1.54%
  - settings: 1.69%
  - **task board: 3.72%**, which is over the 2% threshold and fails
- The home bar charts measured as flex-shrink bars: the natural bar length is the count's share of the track, and a bar shrinks when bar + count overflow. This explains gap R10 (19/19/18 bars look equal).
- The reference screenshots differ from each other by 1–2px (for example, the sidebar offset in clients and settings). Tuning targets `home_light.png`.
- Controls whose target screens are deferred are rendered but inert: + New task, + Add task, + Add client, task and client clicks, "+N more".
- Quick Capture offers only "From a meeting" (gap Q1).
- Because the calendar grid is fixed, the 24th–26th are now visible. Those days show filler mock titles ("Pending action item N").
