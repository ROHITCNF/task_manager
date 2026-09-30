# 04 — Screen inventory and gaps

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Input:** 6 screenshots in `docs/design/reference/`
- **Output:** `docs/requirements/screen-inventory.md`, `docs/requirements/gaps.md`

## Prompt

```
Read every image in docs/design/reference. For each screen, write
docs/requirements/screen-inventory.md containing:
1. Layout regions and every visible component
2. Every interactive element and what it likely does
3. Every component variant visible (e.g. all priority pill types)
4. Data each component needs (fields, types)
5. Shared components across screens
Then write docs/requirements/gaps.md listing screens, states, and
interactions NOT visible in the screenshots that we must capture.
```

## Notes

Key findings: the Calendar grid in the existing app appears to have a column-width bug; there are no Inbox, Docs, or dark theme screenshots; and the due date is a separate field from the start–end date range.
