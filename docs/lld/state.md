# LLD — State (`src/state/`)

- **Implements:** HLD §4, ADR-0005
- **Services:** `docs/lld/data-layer.md` §7

## 1. Pattern

```js
import { createStore } from 'zustand/vanilla';

/** @param {{ tasks: TaskService }} services */
export function createTasksStore(services, deps /* { getWorkspaceId, getTz } */) {
  return createStore((set, get) => ({ /* state + actions */ }));
}
```

- The factories live in `state/sessionStore.js`, `workspaceStore.js`, and `tasksStore.js`; the calendar, clients, dashboard, quickCapture, and ui factories are in `state/otherStores.js`. `src/app/stores.js` creates every store once. `StoresProvider`, `useStores()`, and the per-store hooks are in `state/hooks.js`.
- Components read with `useStore(store, selector)` (from `zustand`) through small hooks in `state/hooks.js`, e.g. `useTasks(selector)`.
- The shared request status shape is: `/** @typedef {{ status: 'idle'|'loading'|'success'|'error', error: ApiError|null }} Req */`.
- Cross-store needs (the current workspace id, the timezone) are **injected as getter functions**, not imported from other stores.
- Selectors that build arrays (`selectColumnTasks`, `selectStatusBars`, `selectPersonBars`, `selectCalendarWeeks`) are memoised on their inputs, so Zustand v5 subscriptions stay referentially stable.
- Every action that fetches ignores stale responses. It keeps a request token per key and applies a response only if the token is still current, which handles fast filter changes.

## 2. Stores

### `sessionStore`
| State | Type |
|---|---|
| `user` | `User\|null` |
| `phase` | `'unknown'\|'signedOut'\|'signedIn'` |
| `req` | `Req` |

| Action | Behaviour |
|---|---|
| `bootstrap()` | `auth.getSession()` → phase |
| `signIn()` | `auth.signIn({ returnTo })` → user, `signedIn` |
| `signOut()` | `auth.signOut()` → resets **all** stores (via an injected `resetAll`) → `signedOut` |
| `handleUnauthenticated()` | Called by any store that catches an `UnauthenticatedError` → `signedOut` |

### `workspaceStore`
| State | Type |
|---|---|
| `workspaces` | `Workspace[]` |
| `currentId` | `string\|null` (persisted: localStorage `dmt.currentWorkspaceId`) |
| `members` | `Member[]`, `membersCursor: string\|null` |
| `req`, `membersReq`, `createReq`, `joinReq` | `Req` |

| Action | Behaviour |
|---|---|
| `load()` | `listMine()`; keep `currentId` if it is still present, else use the first |
| `select(id)` | Sets `currentId`, resets the workspace-scoped stores |
| `create(name)` | `create` → append → `select(new.id)` |
| `join(code)` | `join` → append (no switch) |
| `loadMembers({ more })` | Paged |

| Selector | Result |
|---|---|
| `selectCurrentWorkspace` | The current workspace |

### `tasksStore` (board)
| State | Type |
|---|---|
| `filters` | `{ q: string, assigneeId: string\|null, labelId: string\|null, clientId: string\|null }` |
| `counts` | `Record<TaskStatus, number>` |
| `columns` | `Record<TaskStatus, { ids: string[], nextCursor: string\|null, req: Req }>` |
| `byId` | `Record<string, Task>` |
| `countsReq` | `Req` |

| Action | Behaviour |
|---|---|
| `loadBoard()` | `stats(status, filters)` plus 6 × `list({ status: [s], view: 'card', sort: 'position', limit: 50, ...filters })` in parallel |
| `loadMore(status)` | Next page for one column |
| `setFilter(key, value)` | Updates filters → `loadBoard()`. `q` is debounced 300 ms in the feature, not in the store. |

| Selector | Result |
|---|---|
| `selectColumn(status)` | `Task[]` |
| `selectCount(status)` | Count for the column |

### `calendarStore`
| State | Type |
|---|---|
| `month` | `{ year, month }` (defaults to today) |
| `byDate` | `Record<LocalDate, CalendarTask[]>` |
| `noDueDate` | `CalendarTask[]` |
| `req` | `Req` |

| Action | Behaviour |
|---|---|
| `load()` | `listForMonth` + `listWithoutDueDate` |
| `prev()`, `next()`, `goToday()` | Change the month → `load()` |

| Selector | Result |
|---|---|
| `selectGrid` | `monthGrid` cells, each with `{ date, entries: first 3, more: n }` |

### `clientsStore`
| State | Type |
|---|---|
| `items` | `Client[]` |
| `nextCursor` | `string\|null` |
| `req` | `Req` |

| Action |
|---|
| `load()`, `loadMore()` |

### `dashboardStore`
| State | Type |
|---|---|
| `dashboard` | `Dashboard\|null` |
| `byStatus` | `TaskStats\|null` |
| `byAssignee` | `TaskStats\|null` |
| `req` | `Req` |

| Action | Behaviour |
|---|---|
| `load()` | Three calls in parallel |

| Selector | Result |
|---|---|
| `selectStatusBars` | `{ label, count, ratio }[]` in board order |
| `selectPersonBars` | Same shape, for people |

### `quickCaptureStore`
| State | Type |
|---|---|
| `drafts` | `{ title }[]` |
| `req` | `Req` |

| Action | Behaviour |
|---|---|
| `split(text, source)` | Stores the drafts. **No UI consumes them yet** (gap S6). |

### `uiStore`
| State | Type |
|---|---|
| `themePreference` | `'system'\|'light'\|'dark'` (persisted: localStorage `dmt.theme`, default `'light'`) |

| Action | Behaviour |
|---|---|
| `setTheme(pref)` | Persists the preference and applies it via `applyTheme` (see `docs/lld/components.md` §4) |

## 3. Reset rules

- **Switching workspace** resets tasks, calendar, clients, dashboard, members, and quickCapture.
- **Signing out** resets everything except `ui`.

## 4. Error handling

Every action wraps its service call in `try`/`catch`:

1. `UnauthenticatedError` → `session.handleUnauthenticated()`.
2. Anything else → the error goes into `req.error`.

Features render the error states **only once a reference exists** (gap G2). Until then, they render the last good data, or an empty area.
