# 03 — CLAUDE.md

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Output:** `CLAUDE.md`

## Prompt

```
Draft CLAUDE.md for this project. Context: we are rebuilding an existing
task management web app so it matches the reference screenshots in
docs/design/reference exactly. Rules to include:
- docs/ is the source of truth; read the relevant spec before any work
- Never invent UI not present in a reference screenshot or spec
- Only use values from docs/design/tokens; no hardcoded colours or spacing
- Never modify tests to make them pass
- Work one user story at a time
Leave the tech stack section as TODO; we'll decide it in the HLD.
```

## Notes

Claude also added three things that weren't requested: a "Workflow per user story" section, a Commands TODO, and a "flag missing token" rule.
