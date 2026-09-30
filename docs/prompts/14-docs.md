# 14 — Docs list (US-16)

- **Date:** 2026-09-30
- **Tool / model:** Claude Code, Claude Opus 5.5
- **Input:** `docs_light.png` (1906×939, 1×)
- **Output:**
  - Docs: `screen-inventory.md` §11, `gaps.md` (S2 covered; DC1–DC6), `user-stories.md` US-16, HLD route and store note, LLD state / data-layer / routing, the API guide, and the `list-row-height` token
  - Contract: the docs list summary updated; `POST …/docs` (create) and `POST …/docs/uploads` (multipart upload) reserved for gaps DC2 and DC3. OpenAPI is valid.
  - Code: `DocApi`, `toDoc`, `DocService`; mock docs fixture (the 9 titles from the reference, last updated first) and handler; client `docCount` now computed from docs; `createDocsStore` and `useDocs`; `features/docs/DocsScreen`, `pages/DocsPage`, and the `/docs` route
  - Tests: `DocsScreen.test.jsx`, a contract check for the docs list, and `tests/visual/docs.spec.js` (0.44%)

## Prompt

```
i have added docs_light.png , sidebar Docs is already their
```

## Notes

- "Upload document", "+ New doc", and the rows are inert: the upload flow, the create flow, and the doc view have no reference yet (DC1–DC3).
- "image (1)" suggests uploaded files and written docs share one list (DC5).
