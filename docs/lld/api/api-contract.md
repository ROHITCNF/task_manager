# API Contract — Guide

- **Machine-readable source of truth:** [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.1). If this guide and the YAML disagree, the YAML wins.
- **Decisions:** ADR-0011 (conventions) and ADR-0012 (auth).
- **Audience:** backend implementers, and frontend developers writing gateways, mappers, and MSW handlers.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Base path | `/api/v1`. Additive changes (new fields, new endpoints) stay in v1. Breaking changes go to `/api/v2`. |
| Tenancy | Workspace data lives under `/workspaces/{workspaceId}/…`. The server checks membership on every call (403 if the caller is not a member). |
| Casing | JSON keys use camelCase. Enum values are snake_case (`in_progress`), except roles (`OWNER`). |
| Avatar URLs | `avatarUrl` is a URI reference: an absolute URL or a same-origin path (e.g. `/avatars/u1.png`). |
| IDs | Opaque, with a type prefix and a ULID: `usr_`, `wsp_`, `tsk_`, `cli_`, `lbl_`, `inb_`. Clients must not parse them. |
| Dates | `startDate`, `endDate`, and `dueDate` are **date-only** (`2026-09-29`), with no zone. Timestamps (`createdAt`) are ISO 8601 UTC (`2026-09-23T09:15:00Z`). |
| Timezone | Anything that depends on "today" (dashboard, overdue) takes `tz=<IANA>`. The frontend sends `Intl.DateTimeFormat().resolvedOptions().timeZone`. |
| Envelope | `{ "data": … }` for single resources and `{ "data": [ … ], "meta": { "nextCursor", "limit" } }` for lists. |
| Pagination | Cursor-based: pass `limit` (default 50, max 200) and `cursor` (from `meta.nextCursor`). `nextCursor: null` means the last page. |
| Multi-value filters | Comma-separated: `status=todo,in_progress`. |
| Sparse views | `view=card` (default; no description), `view=calendar` (id, title, status, priority, dueDate), `view=full`. |
| Concurrency | Mutable resources have `version`. `GET` returns `ETag: "7"`. `PATCH` and `DELETE` require `If-Match: "7"`; a stale version gets **412**, and a missing header gets **428**. |
| Idempotency | `POST` accepts `Idempotency-Key: <uuid>`. A replay within 24h returns the first response. |
| Errors | `application/problem+json` (RFC 9457) with a stable `code` and field-level `errors[]`. |
| Rate limits | **429** with `Retry-After`. |
| Auth | An httpOnly session cookie `dmt_session`. The frontend always sends `credentials: 'include'`. |
| CSRF | Every request carries `X-Requested-With: dmt-web`. The backend rejects mutations that don't have it (ADR-0012). |

### Error example

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.dmt.example/problems/validation_failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "requestId": "req_01J8Z…",
  "errors": [{ "field": "name", "code": "required", "message": "Name is required" }]
}
```

| `code` | HTTP | Frontend reaction (data layer error type) |
|---|---|---|
| `unauthenticated` | 401 | `UnauthenticatedError` → the session store signs out and routes to `/login` |
| `forbidden` | 403 | `ForbiddenError` |
| `not_found`, `invalid_invite` | 404 | `NotFoundError` |
| `already_member`, `conflict` | 409 | `ConflictError` |
| `precondition_failed` | 412 | `StaleVersionError` → refetch the resource |
| `validation_failed` | 422 | `ValidationError` (with `fieldErrors`) |
| `rate_limited` | 429 | `RateLimitedError` (with `retryAfter`) |
| `internal` / 5xx | 5xx | `ServerError` |
| (fetch rejects) | — | `NetworkError` |

---

## 2. Screen → endpoint map

| Screen | Calls on load |
|---|---|
| App boot | `GET /auth/session` → `GET /me/workspaces` → pick the current workspace (the stored id if it is still in the list, else the first) |
| Login | `POST /auth/mock-login` (mock) · `GET /auth/google/start` full-page redirect (future) |
| Sidebar | Session user and workspaces (already loaded) · `POST /auth/logout` |
| Home | `GET …/dashboard?tz=` · `GET …/tasks/stats?groupBy=status` · `GET …/tasks/stats?groupBy=assignee&statusGroup=open` |
| Tasks board | `GET …/tasks/stats?groupBy=status&<filters>` (column counts) + for each status `GET …/tasks?status=<s>&view=card&sort=position&limit=50&<filters>`; more pages load on scroll with `cursor` · filter options: `GET …/members`, `GET …/labels`, `GET …/clients` |
| Calendar | `GET …/tasks?view=calendar&dueFrom=<first>&dueTo=<last>&limit=200` (follow the cursor until done) + `GET …/tasks?view=calendar&hasDueDate=false&limit=200` |
| Clients | `GET …/clients` |
| Quick Capture | `POST …/quick-capture/split` (the draft UI is deferred) → `POST …/tasks/bulk` (future) |
| Settings | `GET …/members` · `POST /workspaces` · `POST /workspaces/join` |
| Inbox | `GET …/inbox?unread=` · `POST …/inbox/read-all` |
| Task drawer | `GET …/tasks/{id}` (full view, with `permissions`) · `GET …/members` · `GET …/clients` · on the History tab: `GET …/tasks/{id}/history` · saves: `PATCH …/tasks/{id}` with `If-Match` |
| Card hover | `PATCH …/tasks/{id}` `{ status }` with `If-Match` |

---

## 3. Key payloads

### Task (`view=card`)

```json
{
  "id": "tsk_01J8Y7Q2M4Z6H0XK3B9T5V1R8C",
  "title": "Re: OF_ITPL-H-PI-0826-2_Bounce_15000 Qty_Aug 2026_DEL_04-08-26_Bhiwadi",
  "status": "todo",
  "priority": "urgent",
  "startDate": "2026-09-29",
  "endDate": "2026-09-29",
  "dueDate": "2026-09-29",
  "position": "a0V",
  "checklist": { "done": 0, "total": 1 },
  "commentCount": 0,
  "createdBy": { "id": "usr_…", "name": "Neeraj Bhattathiripad", "avatarUrl": null },
  "createdAt": "2026-09-29T05:12:00Z",
  "updatedAt": "2026-09-29T05:12:00Z",
  "assignees": [{ "id": "usr_…", "name": "Bommidi Satya Durga prasad", "avatarUrl": null }],
  "clients": [{ "id": "cli_…", "name": "Bounce", "colour": "#ca3a32" }],
  "labels": [],
  "version": 3
}
```

How the fields map to the card (see `screen-inventory.md` §2):

| Card element | Field(s) |
|---|---|
| Priority pill | `priority` |
| "23 Sept – 28 Sept" | `startDate`, `endDate` (hidden if both are null) |
| "Due 29/09/2026" (red if overdue) | `dueDate` + `status` + today |
| "☑ 0/1" | `checklist` (hidden if `total` is 0) |
| "1 comment" | `commentCount` (hidden if 0) |
| Client pills | `clients[]` |
| "by X · 23 Sept" | `createdBy.name`, `createdAt` (shown as a date in the viewer's tz) |
| Avatars / "?" | `assignees[]` (empty → "?") |

### Task stats

```http
GET /api/v1/workspaces/wsp_…/tasks/stats?groupBy=status
```
```json
{ "data": {
  "groupBy": "status",
  "total": 73,
  "groups": [
    { "key": "backlog", "count": 4 }, { "key": "todo", "count": 49 },
    { "key": "in_progress", "count": 10 }, { "key": "testing_validation", "count": 0 },
    { "key": "done", "count": 9 }, { "key": "canceled", "count": 1 }
  ]
} }
```

```http
GET /api/v1/workspaces/wsp_…/tasks/stats?groupBy=assignee&statusGroup=open
```
```json
{ "data": {
  "groupBy": "assignee",
  "total": 63,
  "groups": [
    { "key": "usr_…", "count": 19, "user": { "id": "usr_…", "name": "Anantha Krishnan T G", "avatarUrl": "https://…" } }
  ],
  "unassignedCount": 1
} }
```

### Dashboard

```json
{ "data": {
  "today": "2026-09-30",
  "stats": { "myOpenTasks": 0, "overdue": 0, "dueThisWeek": 0, "awaitingReview": 0, "unreadInbox": 0 },
  "dueSoon": [],
  "awaitingReview": []
} }
```

### Client

```json
{ "id": "cli_…", "name": "BGauss", "colour": "#d9622b", "taskCount": 6, "docCount": 0, "version": 1, "createdAt": "…" }
```

### Member

```json
{ "user": { "id": "usr_…", "name": "Neeraj Bhattathiripad", "avatarUrl": null }, "email": "…", "role": "OWNER", "joinedAt": "…" }
```

---

## 4. Business rules the backend owns

| Rule | Definition |
|---|---|
| Open / closed | open = `backlog, todo, in_progress, testing_validation`; closed = `done, canceled` |
| Overdue | `dueDate < today(tz)` and the task is open |
| Due this week | `today ≤ dueDate ≤ today + 6` and the task is open |
| Client `taskCount` | All tasks linked to the client, any status *(confirm: open only?)* |
| Member order | OWNER first, then `joinedAt` ascending |
| Client order | By `name`, **binary collation** (uppercase first). This reproduces the reference, where "BGauss" comes before "Battery Smart". |
| Position | Fractional-index string, unique within (workspace, status). The server assigns it from `afterTaskId`. |
| Stats by assignee | A task with N assignees counts once for each. `unassignedCount` counts tasks with no assignee. |
| Task permissions | `canEdit` = the caller created the task or is a workspace OWNER (gap TD8). `canComment` = any member. Returned on every task view. |
| History | `stages` cover the time spent in each status; `approximate` marks stages that started before tracking existed. `events` are oldest first. |

The frontend reproduces **overdue** only for display (red text). The backend's dashboard counts are authoritative.

---

## 5. Scaling notes

- **Indexes** (suggested):
  - `tasks(workspace_id, status, position)` for board columns
  - `tasks(workspace_id, due_date)` for the calendar
  - `task_assignees(user_id, workspace_id)` for the dashboard
  - trigram or full-text on `tasks.title` for `q`
- **Board payload is bounded**: 6 columns × `limit` 50. Everything else pages.
- Stats and dashboard are aggregate queries. They can be cached per (workspace, user, tz) with a short TTL and invalidated on task writes.
- The workspace-scoped paths let the data be partitioned or sharded by `workspaceId` later.
- `Idempotency-Key` and `If-Match` make retries and concurrent edits safe.
- Realtime is reserved for later: `GET …/events` (SSE) for task, inbox, and member changes. No UI depends on it yet.

---

## 6. Mock mode (MSW)

- Handlers live in `src/mocks/handlers/<resource>.js` and implement this contract, including filters, cursors, `If-Match`, and problem+json errors.
- Fixtures live in `src/mocks/fixtures/` in this wire format and reproduce the reference screenshots: workspace DMT, the members from `settings_light.png`, the clients from `clients_light.png`, and task counts of 4/49/10/0/9/1 with the per-person counts from `home_light.png`.
- "Today" is fixed at `2026-09-30` in fixtures and tests.
- `POST /auth/mock-login` signs in as the fixture user Rohit Srivastava (email starting `rohitsrivastava@inte…`).
