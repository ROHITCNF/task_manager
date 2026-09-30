# ADR-0011: REST API contract conventions

- **Status:** Accepted (approved by project owner 2026-09-30)
- **Date:** 2026-09-30

## Context

There was no backend contract (HLD open question A1). The user will build the backend and asked for a design that scales. The frontend mocks (ADR-0006) need a precise contract so that switching to the real API stays a config-only change.

## Decision

- **OpenAPI 3.1** at `docs/lld/api/openapi.yaml` is the single source of truth, with a readable guide in `docs/lld/api/api-contract.md`.
- REST + JSON under **`/api/v1`**, with **workspace-scoped paths** (`/workspaces/{workspaceId}/…`).
- IDs are **opaque, prefixed ULIDs**.
- **Date-only** fields for task dates and UTC instants for timestamps. Endpoints that depend on "today" take a `tz` param.
- The **`{ data, meta }` envelope** with **cursor pagination** (no offsets).
- Comma-separated multi-value filters and **sparse views** (`card`, `calendar`, `full`).
- **Embedded compact refs** (`UserRef`, `ClientRef`, `LabelRef`) on tasks.
- **Optimistic concurrency** via `version`/`ETag`/`If-Match` (412/428), and **`Idempotency-Key`** on POST.
- **RFC 9457 problem+json** errors with stable `code` values.
- **Aggregate endpoints** (`tasks/stats`, `dashboard`), so the UI never counts over full lists.
- **Fractional `position`** for board ordering.
- Future features (inbox, docs, comments, checklist, change requests, SSE events) are reserved in the contract even though their UI is deferred.

## Consequences

- The backend can be built in any language against the OpenAPI file, and the frontend can build against MSW now.
- Cursor pagination and aggregate endpoints keep payloads bounded as data grows. The trade-off is that "jump to page N" isn't possible, and the UI doesn't need it.
- Embedded refs denormalise the payload: renaming a user or client shows up on the next fetch. That is acceptable without realtime.
- `If-Match` on every write adds a small amount of client work: the stores keep `version` alongside each entity.
- Change request and capture-source shapes are **provisional** (gaps R1 and Q1). Changing them later is a v1 additive change, or a breaking one if fields are removed.
- Adding a field is non-breaking. Mappers ignore unknown fields.
