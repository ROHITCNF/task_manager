# 13 — Card hover and task detail drawer (US-13, US-14, US-15)

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Input:** `card-hover_light.png` (332×222 crop), `card_click_state_light.png` (1896×942), `card_click_state_history_light.png` (1907×928). All are 1× captures.

## Output

**Docs**

- `screen-inventory.md` §9 (hover) and §10 (drawer)
- `gaps.md`: S3 and B6 covered; TD1–TD8 added
- `user-stories.md`: US-13, US-14, US-15
- HLD: the `/tasks/:taskId` drawer route; A2 resolved
- LLD: data layer, state, routing
- API: `Task.permissions`, `GET …/tasks/{id}/history`, and `POST …/assignment-requests` (reserved). OpenAPI is valid.
- Tokens:
  - avatar palette extended to 14 colours
  - scrim, `bg.disabled`, and status colours
  - drawer, chip, avatar-xs, and card status-select sizes
  - `card-hover` and `drawer` shadows
  - `2xs` font size

**Code**

- Domain: `formatDateYear`, `formatInstantDateTime`, `formatDuration`, `describeEvent`, `STATUS_TOKEN`
- Data: `TaskService.get` and `.history`, the `toTaskHistory` mapper, permissions on tasks
- Mocks: 10 more members, from the drawer's chip list, with IDs re-picked for the 14-colour palette, plus 3 cropped photo avatars; the Intellicar task's description, creation time, and 2 history events; a permission rule (creator or OWNER); the history endpoint; a 403 on PATCH without permission
- State: `taskDetailStore` and `tasksStore.changeStatus`
- UI: clickable `TaskCard` with the hover status select, the `xs` avatar, the disabled field style, `TaskDrawer` (Details and History tabs), `TaskDetailPage`, and the nested route

**Tests**

- Domain formats and event wording
- Contract: full task and history validated against the spec
- `TaskDrawer.test.jsx` (7 tests)
- e2e: `drawer.spec.js`
- Visual: `drawer.spec.js`

## Prompt

```
3 reference image i have added card-hover_light.png ,  card_click_state_light.png and card_click_state_history_light.png update docs and create view
```

## Notes

- **One existing test changed because a requirement changed.** The concurrency test in `data.test.js` edited a task as Rohit. The new permission rule (US-14, gap TD8) forbids that, so the test now runs as the workspace owner. A new test asserts that Rohit gets a 403. The test was not weakened.
- **Results:** 118 unit tests and all e2e flows pass.
- **Visual diffs on the first pass** (pixel pass pending, as agreed):
  - drawer Details: 6.9%
  - drawer History: 3.5%
  - hover card: 3.9%

  The drawer is compared by region only, because the board behind the scrim in these references is from a later day (a To do count of 50, new cards).
- **Inferences** (all logged as gaps):
  - scrim click and Esc close the drawer
  - editable fields save immediately (TD2)
  - "Ask to be assigned" is inert (TD3)
  - unknown history event types are skipped (TD4)
  - stage colours other than Backlog are grey (TD5)
  - the Client select handles a task with several clients or none (TD6)
  - who counts as an owner (TD8)
