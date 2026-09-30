# 12 — Inbox reference added (US-12)

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Input:** `docs/design/reference/inbox_light.png` (1905×929, 1× scale, empty state)
- **Output:**
  - Docs: `screen-inventory.md` §8 Inbox, `gaps.md` (S1 covered; IN1–IN5 added), `user-stories.md` US-12, the HLD route table and store note, the LLD data-layer and state entries, and tokens (`text.disabled`, `header-height-compact` 53px, `chip-height` 26px, `button-height-xs` 27px)
  - Code:
    - `InboxApi`, `toInboxItem`, `InboxService`, and the mock `read` / `read-all` handlers
    - `createInboxStore` and `selectHasUnread`
    - the `Chip` primitive and a disabled style for secondary buttons
    - `features/inbox/InboxScreen`, `pages/InboxPage`, and the `/inbox` route
  - Tests: `InboxScreen.test.jsx` (3) and `tests/visual/inbox.spec.js`

## Prompt

```
i have added inbox_light.png new view (which sidebar is already having ) udate the docs and create the view
```

## Notes

- **Visual diff:** 0.39% on the first pass.
- **Inferences:**
  - "Mark all as read" appears disabled in the reference (lighter border and text). It is disabled whenever no loaded item is unread.
  - "Notification settings" is inert (gap IN4).
- **Not rendered yet:** item rows, because only the empty state is referenced (gap IN1). The mock inbox is empty, which matches the reference.
- **Contract mismatch:** the empty copy names 4 notification kinds but the API contract has 3 (gap IN5). The contract was left unchanged pending a decision.
