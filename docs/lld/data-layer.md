# LLD — Data Layer (`src/data/`) and Domain (`src/domain/`)

- **Implements:** HLD §3, ADR-0003, ADR-0006, ADR-0011, ADR-0012
- **Contract:** `docs/lld/api/openapi.yaml`
- **Rule:** nothing in this document imports React or Zustand.

---

## 1. Config (`src/config/index.js`)

```js
/** @typedef {{ apiMode: 'mock'|'live', apiBaseUrl: string, authMode: 'mock'|'google', requestTimeoutMs: number }} AppConfig */
export const config /* : Readonly<AppConfig> */ = Object.freeze({
  apiMode:          import.meta.env.VITE_API_MODE ?? 'mock',
  apiBaseUrl:       import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  authMode:         import.meta.env.VITE_AUTH_MODE ?? 'mock',
  requestTimeoutMs: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 15000),
});
```

## 2. Domain (`src/domain/`)

Domain objects are plain, frozen objects. The names match the API wherever possible.

```js
/** @typedef {'backlog'|'todo'|'in_progress'|'testing_validation'|'done'|'canceled'} TaskStatus */
/** @typedef {'urgent'|'high'|'medium'|'low'|'none'} Priority */
/** @typedef {{ id: string, name: string, avatarUrl: string|null }} UserRef */
/** @typedef {UserRef & { email: string }} User */
/** @typedef {{ id: string, name: string, role: 'OWNER'|'MEMBER', createdAt: Date }} Workspace */
/** @typedef {{ user: UserRef, email: string, role: 'OWNER'|'MEMBER', joinedAt: Date }} Member */
/** @typedef {{ id: string, name: string, colour: string }} ClientRef */
/** @typedef {ClientRef & { taskCount: number, docCount: number, version: number }} Client */
/** @typedef {{ id: string, name: string, colour: string }} Label */
/** @typedef {string} LocalDate  // 'YYYY-MM-DD'; kept as a string to avoid timezone shifts */
/**
 * @typedef {{
 *   id: string, title: string, description?: string|null, status: TaskStatus, priority: Priority,
 *   startDate: LocalDate|null, endDate: LocalDate|null, dueDate: LocalDate|null, position: string,
 *   checklist: { done: number, total: number }, commentCount: number,
 *   createdBy: UserRef, createdAt: Date, updatedAt: Date,
 *   assignees: UserRef[], clients: ClientRef[], labels: Label[], version: number
 * }} Task
 */
/** @typedef {Pick<Task,'id'|'title'|'status'|'priority'|'dueDate'>} CalendarTask */
/** @typedef {{ key: string, count: number, user?: UserRef }} StatGroup */
/** @typedef {{ groupBy: 'status'|'assignee', total: number, groups: StatGroup[], unassignedCount?: number }} TaskStats */
/** @typedef {{ today: LocalDate, stats: { myOpenTasks: number, overdue: number, dueThisWeek: number, awaitingReview: number, unreadInbox: number }, dueSoon: Task[], awaitingReview: object[] }} Dashboard */
/** @template T @typedef {{ items: T[], nextCursor: string|null }} Page */
```

**Date decision:** `LocalDate` values stay as `YYYY-MM-DD` strings in the domain. Converting them to `Date` would shift the day in negative-offset timezones. Instants (`createdAt`) become `Date`.

| File | Exports |
|---|---|
| `domain/status.js` | `TASK_STATUSES` (board order), `STATUS_LABEL` (`{ todo: 'To do', testing_validation: 'Testing & Validation', … }`), `OPEN_STATUSES`, `isOpen(status)` |
| `domain/priority.js` | `PRIORITIES`, `PRIORITY_LABEL` (`none` → 'No priority'), `PRIORITY_TOKEN` (`urgent` → `'--color-priority-urgent'`) |
| `domain/rules.js` | `isOverdue(task, today)` · `pluralise(n, singular, plural?)` → `'1 task'` / `'2 tasks'` · `greetingFor(date)` → `'Good morning'` (before 12:00), `'Good afternoon'` (before 17:00), `'Good evening'` · `firstName(name)` |
| `domain/dates.js` | `todayLocal(tz)` → LocalDate · `formatShort(localDate)` → `'23 Sept'` · `formatNumeric(localDate)` → `'29/09/2026'` · `formatLong(localDate)` → `'Wednesday 30 September'` · `formatMonthYear(y, m)` → `'September 2026'` · `monthGrid(y, m)` → `(LocalDate\|null)[][]` (Sunday start) · `formatInstantShort(date, tz)` |
| `domain/avatar.js` | `initialOf(name)` · `avatarToken(userId)` → `'--color-avatar-1'`…`'--color-avatar-9'` (stable hash) |

"Sept" note: `Intl` en-GB gives "Sept" for September in modern engines, but `formatShort` hardcodes the month abbreviations so the output is the same in every engine.

## 3. HTTP (`src/data/http/`)

```js
export class HttpClient {
  /** @param {{ baseUrl: string, timeoutMs: number, fetchImpl?: typeof fetch }} opts */
  constructor(opts) {}
  /**
   * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
   * @param {string} path                        // relative to baseUrl, e.g. '/workspaces/wsp_1/tasks'
   * @param {{ query?: Record<string, string|number|boolean|string[]|undefined>,
   *           body?: unknown, ifMatch?: number, idempotencyKey?: string, signal?: AbortSignal }} [opts]
   * @returns {Promise<{ status: number, body: any, etag: string|null }>}
   * @throws {ApiError}
   */
  request(method, path, opts) {}
  get(path, opts) {}  post(path, body, opts) {}  patch(path, body, opts) {}  delete(path, opts) {}
}
```

- It always sends `credentials: 'include'`, `Accept: application/json`, and `X-Requested-With: dmt-web` (CSRF, ADR-0012).
- Query encoding: arrays are joined with `,`, and `undefined`/`null`/`''` values are dropped.
- Timeouts use `AbortSignal.timeout(timeoutMs)`, combined with the caller's signal via `AbortSignal.any`.
- `ifMatch` becomes `If-Match: "<n>"`. `idempotencyKey` defaults to `crypto.randomUUID()` for POST.
- A 204 returns `body: null`.

## 4. Errors (`src/data/errors/`)

```js
export class ApiError extends Error { /** @type {number} */ status; /** @type {string} */ code; /** @type {string|undefined} */ requestId; }
export class NetworkError extends ApiError {}          // fetch rejected or timed out (status 0)
export class UnauthenticatedError extends ApiError {}  // 401
export class ForbiddenError extends ApiError {}        // 403
export class NotFoundError extends ApiError {}         // 404
export class ConflictError extends ApiError {}         // 409
export class StaleVersionError extends ApiError {}     // 412 / 428
export class ValidationError extends ApiError { /** @type {Record<string,string>} */ fieldErrors; } // 422
export class RateLimitedError extends ApiError { /** @type {number} */ retryAfterSec; }             // 429
export class ServerError extends ApiError {}           // 5xx
/** @param {Response} res @param {any} problem @returns {ApiError} */
export function toApiError(res, problem) {}
```

## 5. Gateways (`src/data/api/`)

A gateway is a thin class per resource. It returns **raw DTOs** (wire format), and only it knows paths.

| Class | Methods (all `async`, return DTO bodies) |
|---|---|
| `AuthApi` | `getSession()`, `mockLogin(email?)`, `logout()`, `googleStartUrl(returnTo)` (a string; no request). Constructor: `(http, baseUrl)` |
| `MeApi` | `getMe()`, `listWorkspaces()` |
| `WorkspaceApi` | `create(name)`, `join(inviteCode)`, `get(wsId)`, `listMembers(wsId, { limit, cursor })` |
| `TaskApi` | `list(wsId, params)`, `stats(wsId, params)`, `get(wsId, id)`, `create(wsId, dto)`, `createBulk(wsId, dtos)`, `update(wsId, id, patch, version)`, `remove(wsId, id, version)` |
| `DashboardApi` | `get(wsId, tz)` |
| `ClientApi` | `list(wsId, { q, limit, cursor })`, `create(wsId, dto)`, `update(wsId, id, patch, version)`, `remove(wsId, id, version)` |
| `LabelApi` | `list(wsId)` |
| `QuickCaptureApi` | `split(wsId, text, source)` |

Each constructor takes `(http: HttpClient)`.

## 6. Mappers (`src/data/mappers/`)

These are pure functions, and the only code that knows wire field names.

| Function | Notes |
|---|---|
| `toUserRef(dto)`, `toUser(dto)` | `avatarUrl ?? null` |
| `toWorkspace(dto)`, `toMember(dto)` | `createdAt`/`joinedAt` → `Date` |
| `toClientRef(dto)`, `toClient(dto)` | Lowercases `colour` |
| `toLabel(dto)` | |
| `toTask(dto)` | Dates stay as `LocalDate` strings. Missing arrays → `[]`. Unknown `status`/`priority` → throw `MappingError` (it surfaces contract drift). |
| `toCalendarTask(dto)` | |
| `toTaskStats(dto)`, `toDashboard(dto)` | |
| `toPage(dto, mapItem)` | `{ items: dto.data.map(mapItem), nextCursor: dto.meta.nextCursor }` |
| `fromTaskDraft(domain)` → `TaskCreate` DTO | Used by bulk create |
| `toTaskQuery(filters)` → the query object | `{ assigneeId, labelId, clientId, q, status, … }`. Drops empty values. The UI filter value `'me'` passes through. |

## 7. Services (`src/data/services/`)

These are the public API for stores. Inputs and outputs are domain objects only.

```js
export class AuthService {
  constructor(authApi, config, navigator = window.location) {}  // navigator injectable for tests
  /** @returns {Promise<User|null>} null when 401 */      getSession() {}
  /** mock: POST mock-login → User; google: window.location.assign(startUrl) and never resolves */
  /** @param {{ returnTo?: string }} [opts] @returns {Promise<User>} */ signIn(opts) {}
  /** @returns {Promise<void>} */                          signOut() {}
}
export class WorkspaceService {
  constructor(meApi, workspaceApi) {}
  /** @returns {Promise<Workspace[]>} */                   listMine() {}
  /** @returns {Promise<Workspace>} */                     create(name) {}
  /** @returns {Promise<Workspace>} */                     join(inviteCode) {}
  /** @returns {Promise<Page<Member>>} */                  listMembers(wsId, { cursor, limit }) {}
}
export class TaskService {
  constructor(taskApi) {}
  /** @param {TaskQuery} query @returns {Promise<Page<Task>>} */                 list(wsId, query) {}
  /** @returns {Promise<CalendarTask[]>} follows every cursor (bounded to 10 pages) */ listForMonth(wsId, fromDate, toDate) {}
  /** @returns {Promise<CalendarTask[]>} */                                      listWithoutDueDate(wsId) {}
  /** @returns {Promise<TaskStats>} */                                           stats(wsId, groupBy, query) {}
  /** @returns {Promise<Task>} */                                                update(wsId, task, patch) {}  // sends task.version as If-Match
  /** @returns {Promise<Task[]>} */                                              createBulk(wsId, drafts) {}
}
export class DashboardService { constructor(dashboardApi) {}  /** @returns {Promise<Dashboard>} */ get(wsId, tz) {} }
export class ClientService    { constructor(clientApi) {}     /** @returns {Promise<Page<Client>>} */ list(wsId, { cursor, limit, q }) {} }
export class LabelService     { constructor(labelApi) {}      /** @returns {Promise<Label[]>} */ list(wsId) {} }
export class QuickCaptureService { constructor(quickCaptureApi) {} /** @returns {Promise<{title:string}[]>} */ split(wsId, text, source) {} }
```

```js
/** @typedef {{ status?: TaskStatus[], statusGroup?: 'open'|'closed', assigneeId?: string[], unassigned?: boolean,
 *              clientId?: string[], labelId?: string[], q?: string, dueFrom?: LocalDate, dueTo?: LocalDate,
 *              hasDueDate?: boolean, view?: 'card'|'calendar'|'full', sort?: string, limit?: number, cursor?: string }} TaskQuery */
```

## 8. Factory (`src/data/index.js`)

```js
/** @param {AppConfig} config
 *  @returns {{ auth: AuthService, workspaces: WorkspaceService, tasks: TaskService, dashboard: DashboardService,
 *             clients: ClientService, labels: LabelService, quickCapture: QuickCaptureService }} */
export function createDataLayer(config) {}
```

This is the only symbol `src/app/` imports from `src/data/`. The stores receive its result. A second argument `{ fetchImpl, navigator }` is for tests only.

**As built (Phase 2):** gateways live in `data/api/index.js`; `DashboardService`, `ClientService`, `LabelService`, and `QuickCaptureService` live in `data/services/index.js`; `AuthService`, `WorkspaceService`, and `TaskService` each have their own file. The `data/errors` module also exports `MappingError`.
