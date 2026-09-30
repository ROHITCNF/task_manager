# High-Level Design — Task Management UI

- **Status:** Draft v2 · 2026-09-30. v2 adds the API contract (ADR-0011), the auth approach (ADR-0012), the calendar and quickCapture stores, and resolves A1, A2 (deferred), and A5.
- **Scope:** Architecture only. Method signatures, component props, and store shapes belong in `docs/lld/`.
- **Inputs:** `docs/requirements/screen-inventory.md`, `docs/requirements/gaps.md`, `CLAUDE.md`
- **Decisions:** ADR-0001 to ADR-0010 in `docs/adr/`

---

## 1. Goals and constraints

| # | Goal / constraint | Source |
|---|---|---|
| G1 | Pixel-level parity with `docs/design/reference/` (7 screens) | CLAUDE.md |
| G2 | UI never talks to the network. All I/O goes through the data layer. | Fixed decision 3, 4 |
| G3 | Swapping mock data for the real API needs **config changes only**, with no code edits | Fixed decision 5 |
| G4 | No component library now, but shadcn/ui must be easy to adopt later | Fixed decision 2 |
| G5 | All styling values come from design tokens, with light and dark themes | CLAUDE.md rule 3, theme toggle |
| G6 | Plain JavaScript (no TypeScript) | Fixed decision 1 |

---

## 2. Layer diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  UI LAYER (pure React)                                               │
│                                                                      │
│   pages/  ──►  features/  ──►  components/domain/  ──►  components/ui│
│   (tier 4)     (tier 3)        (tier 2)                 (tier 1)     │
│                   │                                                  │
│                   │ reads state via selectors, calls actions         │
└───────────────────┼──────────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STATE LAYER (Zustand stores)                                        │
│   session · workspace · tasks · clients · dashboard · ui(theme)      │
│   holds domain models + request status; actions call services        │
└───────────────────┬──────────────────────────────────────────────────┘
                    │ calls services (injected at startup)
                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  DATA LAYER (pure JS classes, no React, no Zustand)                  │
│                                                                      │
│   services/  ──►  mappers/  ──►  api/ (resource gateways) ──► http/  │
│   domain-facing   DTO ↔ domain   endpoints + DTO shapes     fetch    │
└───────────────────────────────────────────────────────────┬──────────┘
                                                            │ HTTP (fetch)
                                     ┌──────────────────────┴─────────┐
                                     ▼                                ▼
                         ┌─────────────────────┐        ┌─────────────────────┐
                         │ MSW (mock mode)     │        │ Real backend API    │
                         │ intercepts fetch in │        │ (live mode)         │
                         │ the Service Worker  │        │                     │
                         └─────────────────────┘        └─────────────────────┘

  Cross-cutting (importable by all layers): domain/ (models, enums, business rules), config/
  Composition root: app/ (the only place that builds the data layer and hands it to the stores)
```

### Dependency rules

These rules are enforced by ESLint `no-restricted-imports` (see §9).

| Module | May import | Must NOT import |
|---|---|---|
| `domain/` | nothing | everything else |
| `config/` | nothing | everything else |
| `data/` | `domain/`, `config/` | `react`, `zustand`, `state/`, `components/`, `features/`, `pages/`, `mocks/` |
| `state/` | `zustand`, `domain/`, `data/` (only to reference the service contracts; instances are injected) | `components/`, `features/`, `pages/`, `mocks/` |
| `components/ui/` | `styles/`, icons | `domain/`, `state/`, `data/` |
| `components/domain/` | `components/ui/`, `domain/` | `state/`, `data/` |
| `features/` | `components/*`, `state/`, `domain/` | `data/` |
| `pages/` | `features/`, `components/*` | `data/`, `state/` (pages compose features, and features own state access) |
| `app/` | everything | — |
| `mocks/` | its own fixtures only | `data/`, `domain/` (mocks act as the server, so they must not reuse client mappers) |

The key rule: **nothing under the UI layer imports `data/`**. The UI reaches data only through store actions, and the stores call the data layer.

---

## 3. Data layer

Pure JavaScript classes with no React and no Zustand. It owns all communication with the server (real or mocked) and all translation between the wire format and domain models.

### 3.1 Sub-modules

| Sub-module | Responsibility | Knows about |
|---|---|---|
| `http/` | One HTTP client over `fetch`. Handles the base URL, credentials (session cookie), JSON encode/decode, timeouts, and normalising failures into typed errors. | Base URL, from config |
| `api/` | One **resource gateway** per backend resource (auth, workspaces, members, tasks, clients, dashboard, inbox, docs). Knows endpoint paths, query params, and **DTO** (wire) shapes. Returns raw DTOs. | HTTP client |
| `mappers/` | DTO → domain model and domain → DTO. The **only** place that knows backend field names. Parses date strings into `Date`, normalises enums (e.g. status strings to `TaskStatus`), and fills defaults. | `domain/` |
| `services/` | The public, domain-facing classes the stores use: `AuthService`, `WorkspaceService`, `TaskService`, `ClientService`, `DashboardService`, and later `InboxService`/`DocService`. They combine gateway calls and mappers. Inputs and outputs are domain models only. | gateways, mappers |
| `errors` | A typed error hierarchy: network, unauthenticated (401), forbidden (403), not found (404), validation (422), server (5xx). | — |
| `index.js` | A factory that takes config and returns the wired set of services. This is the data layer's only public entry point. | all of the above |

### 3.2 Domain models (`domain/`)

- Domain models are **plain, immutable objects** described with JSDoc `@typedef`. They are not class instances. That keeps them serialisable and friendly to Zustand's shallow equality checks, and lets React compare them by reference.
- `domain/` also holds the enums and their display metadata: status order (Backlog → To do → In progress → Testing & Validation → Done → Canceled), priority levels, and the priority → colour-token mapping.
- It also holds **pure business-rule functions**, such as the overdue rule and pluralisation. These rules are shared by the stores, the UI, and the mappers, so they belong in one place. (The overdue rule is gap R2 and must be confirmed.)
- The initial model set comes from `screen-inventory.md`: User, Workspace, Member, Task, Client, DashboardSummary, and CalendarEntry (a projection of Task). Inbox, Doc, and ChangeRequest wait on gaps S1, S2, S10, and R1.

### 3.3 Mock vs live: the switching mechanism

```
               config: API_MODE = mock | live, API_BASE_URL = …
                                   │
main.jsx ── if mock ──► start MSW worker (public/mockServiceWorker.js)
    │                                   │
    └──► build data layer with API_BASE_URL (identical code path in both modes)
```

- **MSW intercepts at the network level**, so the data layer code is identical in both modes, and every request passes through the real HTTP client, gateways, and mappers.
- MSW fixtures are written in the **backend's wire (DTO) format**, not the domain format, so the mappers are exercised in mock mode.
- Environment variables (Vite `VITE_*`): `VITE_API_MODE`, `VITE_API_BASE_URL`, and `VITE_AUTH_MODE` (`mock|google`). Development defaults to `mock`, production to `live` + `google`.
- Switching to the real API means setting `VITE_API_MODE=live` and `VITE_API_BASE_URL=<url>`. Nothing else changes.

**API contract:** Claude designed it at the user's request, and the user builds the backend against it. The source of truth is `docs/lld/api/openapi.yaml`, with a readable guide in `docs/lld/api/api-contract.md`; the conventions are in ADR-0011. The MSW fixtures follow it exactly.

### 3.4 Auth

- Google-only sign-in (`login_light.png`). "Continue with Google" starts a backend-driven OAuth flow, which is a full-page redirect, not `fetch`.
- The session is an HTTP-only cookie set by the backend. On startup the data layer asks the backend for the current session. A 401 from any call becomes an unauthenticated error, and the session store reacts by routing to `/login`.
- **Mock phase (user decision):** `VITE_AUTH_MODE=mock` makes `AuthService.signIn` call `POST /auth/mock-login` (handled by MSW). With `google`, it does a full-page navigation to `/auth/google/start`. The UI calls the same store action in both modes. See ADR-0012.
- Open questions: gaps L1–L5 (loading, errors, domain restriction, no-workspace landing).

### 3.5 What the data layer does NOT do

- No caching and no state. Caching lives in the stores.
- No UI concerns (formatting for display lives in `domain/` helpers or in components).
- No retries by default (to be revisited in the LLD per endpoint).

---

## 4. Where Zustand sits

Zustand is the **state layer between the UI and the data layer**. It is the only consumer of the data layer, and the only source of app data for the UI.

```
  React component (feature tier)
        │  1. select state (selector)          ▲ 5. re-render with new state
        │  2. call action                      │
        ▼                                      │
  Zustand store ── 3. await service call ──► Data layer service
        ▲                                      │
        └──────── 4. set(domain models, status) ◄┘
```

### 4.1 Rules

1. **Stores are created with factories that receive the data-layer services** (dependency injection) inside `app/`. Stores never construct services themselves. This lets tests inject fakes.
2. **Store logic is framework-agnostic**: stores are built on `zustand/vanilla`, and React reads them through Zustand's `useStore` hook with selectors. Store logic can therefore be unit-tested without React.
3. Each store holds **domain models** (normalised by id where lists are large, e.g. tasks) plus a **request status** per load: `idle | loading | success | error`, together with the error.
4. **Derived data comes from pure selectors** in `state/selectors`, never duplicated in state. Examples: board columns grouped by status, the calendar grouped by due date, the "No due date" list, and filtered or searched tasks.
5. Components subscribe with **narrow selectors** to avoid re-rendering on unrelated changes.
6. Mutations are **pessimistic by default** (wait for the server, then update). Optimistic updates with rollback are opt-in per story in the LLD, for example a status change by drag, if that is confirmed (gap B2).

### 4.2 Store inventory (initial)

| Store | Holds | Persisted |
|---|---|---|
| `session` | auth status and the current user | no (the server session is the truth) |
| `workspace` | workspaces list, current workspace id, members | the current workspace id (localStorage) |
| `tasks` | task entities, board filters (assignee/label/client/search), load status | no |
| `clients` | client entities, load status | no |
| `dashboard` | Home summary (stat counts, by-status, by-person, due soon, awaiting review) | no |
| `calendar` | the visible month, tasks by due date, no-due-date list | no |
| `quickCapture` | split drafts (no UI consumes them yet; gap S6) | no |
| `ui` | theme preference (`system/light/dark`) | yes (localStorage) |

The `inbox` store (filter, items, cursor, mark-all-read) was added with US-12. The `taskDetail` store (open task, history, save) was added with US-14/15. The `docs` store will be added when gap S2 is resolved.

### 4.3 What stays out of Zustand

- Purely local, ephemeral UI state stays in component `useState`: for example the Quick Capture textarea contents, form input values, and whether a dropdown is open.
- **Route state** belongs to the router: the current page and route params.
- Open question: should board filters and the calendar month also live in URL search params (deep-linkable)? They are in stores for now, and the LLD will decide.

---

## 5. Routes

Router: React Router (ADR-0008). Two layouts: a **public** layout (no shell) and an **authenticated** layout (`AppShell` with the sidebar).

| Path | Page | Layout | Guard | Reference | Status |
|---|---|---|---|---|---|
| `/login` | Login | public | redirect to `/` if already signed in | `login_light.png` | Ready |
| `/` | Home | shell | auth | `home_light.png` | Ready |
| `/inbox` | Inbox | shell | auth | `inbox_light.png` | Ready (empty state; item rows blocked on gap IN1) |
| `/tasks` | Tasks board | shell | auth | `taskboard_light.png` | Ready |
| `/tasks/:taskId` | Task detail **drawer** over the board (nested route under `/tasks`) | shell | auth | `card_click_state*_light.png` | Ready (subtasks/comments blocked on TD1) |
| `/calendar` | Calendar | shell | auth | `calendar_light.png` | Ready (after the C1 decision) |
| `/docs` | Docs | shell | auth | — | **Blocked: gap S2** |
| `/clients` | Clients | shell | auth | `clients_light.png` | Ready |
| `/quick-capture` | Quick Capture | shell | auth | `quick-capture_light.png` | Ready (the draft step is blocked on S6) |
| `/settings` | Workspace settings | shell | auth | `settings_light.png` | Ready |
| `*` | Not found | — | — | — | **Blocked: gap S12** |

- **Auth guard:** a layout route that checks the `session` store. If the user is unauthenticated, it redirects to `/login`. The post-login return target is gap L5.
- **Workspace scoping:** the current workspace lives in the `workspace` store, not in the URL. The screenshots give no evidence of a workspace segment in the URL. Revisit if the real app uses one.
- **Blocked routes:** under the "never invent UI" rule, a blocked page is not designed. Until its reference arrives, the nav item and route exist, but the page renders nothing beyond the shell. What exactly to render there needs a decision (tracked in gaps).
- Pages are **lazy-loaded per route** (code splitting).

---

## 6. Repository folder structure

```
ai_demo/
├── CLAUDE.md
├── docs/                          source of truth (requirements, design, hld, lld, adr, prompts)
├── index.html                     Vite entry HTML (includes the pre-paint theme script, §8)
├── package.json
├── vite.config.js
├── .env.example                   VITE_API_MODE, VITE_API_BASE_URL, auth entry URL
├── public/
│   └── mockServiceWorker.js       generated by MSW; only activated in mock mode
├── scripts/
│   └── build-tokens.js            docs/design/tokens/*.json → src/styles/tokens.css
├── src/
│   ├── main.jsx                   boot: read config → start MSW if mock → mount the app
│   ├── app/                       composition root
│   │   ├── (App, router, route guards, layouts)
│   │   └── (builds the data layer, creates the stores, provides them)
│   ├── config/                    reads env once and exposes a frozen config object
│   ├── domain/                    models (JSDoc typedefs), enums, business rules. No deps.
│   ├── data/                      DATA LAYER — no React, no Zustand
│   │   ├── http/
│   │   ├── api/
│   │   ├── mappers/
│   │   ├── services/
│   │   ├── errors/
│   │   └── index.js               public factory; the only import point for app/
│   ├── state/                     ZUSTAND: store factories, selectors
│   ├── components/
│   │   ├── ui/                    tier 1: primitives (shadcn/ui-compatible location)
│   │   └── domain/                tier 2: presentational domain components
│   ├── features/                  tier 3: connected sections, one folder per area
│   │   ├── shell/                 sidebar, workspace header, nav, theme toggle
│   │   ├── auth/
│   │   ├── home/
│   │   ├── tasks/
│   │   ├── calendar/
│   │   ├── clients/
│   │   ├── quick-capture/
│   │   └── settings/
│   ├── pages/                     tier 4: one per route, lazy-loaded
│   ├── styles/
│   │   ├── tokens.css             GENERATED. Do not edit by hand.
│   │   ├── base.css               reset, element defaults, font faces
│   │   └── (theme mapping, §8)
│   └── mocks/                     MSW: handlers per resource, fixtures (wire format), worker setup
└── tests/
    ├── e2e/                       Playwright flows
    └── visual/                    Playwright screenshot specs and baselines
```

- Unit and component tests are **colocated** with their code as `*.test.js` / `*.test.jsx`.
- Each component folder holds its `.jsx`, its `.module.css`, and its test.
- File naming: components use `PascalCase.jsx`; everything else uses `camelCase.js`.

---

## 7. Component tiers

| Tier | Folder | Knows about | May access store? | Examples (from screen-inventory §8) |
|---|---|---|---|---|
| **1. Primitives** | `components/ui/` | Props and tokens only. No domain knowledge. Native HTML elements underneath. | No | Button (primary / secondary / text / icon; disabled; full-width), Input, Textarea, Select, Card, Pill, Dot, Avatar, AvatarGroup, SegmentedControl, ScrollArea |
| **2. Domain components** | `components/domain/` | Domain models passed in as props; pure presentation | No | PriorityPill, ClientPill, TaskCard, StatCard, BarChartRow, ClientRow, MemberRow, CalendarDayCell, CalendarEntry, DueDate, ChecklistCount |
| **3. Features** | `features/<area>/` | Stores (selectors and actions); compose tier 1 and 2; own loading and error states | **Yes** (the only tier that may) | Sidebar, ThemeToggle, BoardToolbar, TaskBoard, BoardColumn, StatCardRow, StatusChart, PeopleChart, MonthGrid, NoDueDateList, ClientList, CaptureForm, CreateWorkspaceForm, JoinWorkspaceForm, MemberList, SignInCard |
| **4. Pages** | `pages/` | Layout and composition of features for one route; page title | No (they compose features) | HomePage, TasksPage, CalendarPage, ClientsPage, QuickCapturePage, SettingsPage, LoginPage |
| Layouts | `app/` | Route-level frames | via features | PublicLayout, AppShell (sidebar + outlet) |

Rules:

- A lower tier never imports a higher tier.
- Tier 1 primitives are the **shadcn/ui swap boundary**. They live at `components/ui/` (shadcn's default path), and their names and variant props follow shadcn naming (`variant`, `size`) wherever the screenshots allow. Adopting shadcn later then means replacing primitive files one at a time without touching tiers 2–4.
- Tiers 1 and 2 are testable in isolation with plain props, with no store and no MSW.

---

## 8. Theming

### 8.1 The token pipeline

```
docs/design/tokens/*.json   (source of truth — CLAUDE.md rule 3)
          │  scripts/build-tokens.js  (runs before dev/build/test)
          ▼
src/styles/tokens.css       CSS custom properties, generated, committed or git-ignored (LLD decides)
          │
          ▼
component *.module.css      use var(--…) only
```

- There are **two token levels**:
  1. **Primitive** tokens, which hold raw palette and scale values (e.g. indigo-500, space-4).
  2. **Semantic** tokens, which hold roles (e.g. `--color-bg`, `--color-text-muted`, `--color-primary`, `--color-border`, `--color-priority-urgent`).

  Components use **semantic tokens only**.
- **Client colours** are data (they come from the API per client), not tokens. They are applied with an inline CSS custom property on the element (e.g. setting `--client-colour` on the pill), and the component's CSS derives the tint and border from that property. This is the one sanctioned case of a runtime colour value.

### 8.2 Light and dark

- Semantic tokens are defined twice: once for light (the default, `:root`) and once for dark (under the `.dark` class on `<html>`). Using the `.dark` **class** matches shadcn/ui's convention.
- The theme preference `system | light | dark` lives in the `ui` store and is persisted to localStorage.
  - `light` / `dark`: set or remove `.dark` on `<html>`.
  - `system`: follow `prefers-color-scheme` and listen for changes.
- **No flash of the wrong theme:** a tiny inline script in `index.html` reads the stored preference and sets the class before first paint.
- **Dark mode is deferred** (user decision, 2026-09-30). The plumbing and toggle are built, but the dark token block stays empty until a reference exists (gap T1).

### 8.3 shadcn/ui readiness

- shadcn expects CSS variables such as `--background`, `--foreground`, `--primary`, `--muted`, `--border`, and `--radius`, plus the `.dark` class. Our semantic layer can **alias** these names in one file, so no component changes are needed when shadcn arrives.
- Adopting shadcn later also brings in Tailwind. That is a known cost, recorded in ADR-0002 and ADR-0009.

### 8.4 Enforcement

- Stylelint rejects hardcoded colours, px/rem spacing, and font values in `*.module.css`. Every such value must be a `var(--…)`.
- The token build fails if a semantic token references a missing primitive.

---

## 9. Testing approach

| Level | Tool | What | Where |
|---|---|---|---|
| **Unit: domain** | Vitest (node) | Business rules (overdue, pluralisation, status order), formatters | colocated |
| **Unit: data layer** | Vitest (node) + MSW node server | Mappers (DTO → domain, including edge cases); services against MSW handlers; error normalisation (401/404/500/network) | colocated |
| **Unit: stores** | Vitest (node) | Actions and status transitions using **fake services** injected into the store factories; selectors as pure functions | colocated |
| **Component** | Vitest + React Testing Library (jsdom) | Tier 1 and 2 rendering of every variant from the inventory (all priority pills, due-date states, avatars…). Queries by role and label. | colocated |
| **Integration** | Vitest + RTL + MSW | Feature and page level: real stores + real data layer + MSW. Covers loading, success, error, and empty states. | colocated |
| **E2E** | Playwright (mock mode) | Critical flows: sign in, navigate, filter the board, create a workspace… | `tests/e2e/` |
| **Visual parity** | Playwright screenshots | Each screen compared against its `docs/design/reference/*_light.png`, using the same viewport and DPR, with MSW fixtures that **reproduce the reference data** and a **frozen clock** (Wed 30 Sep 2026, morning). A small diff threshold allows for font rasterisation. | `tests/visual/` |
| **Architecture** | ESLint `no-restricted-imports` | Enforces the §2 dependency rules; runs in CI | lint |
| **Styling** | Stylelint | Tokens-only rule (§8.4) | lint |

Principles:

- Tests follow acceptance criteria. There is one story per change (CLAUDE.md rule 5).
- **Tests are never modified to pass** (CLAUDE.md rule 4).
- Mock fixtures are shared by dev mode, integration tests, E2E, and visual tests. There is a single fixture set, based on the reference screenshots' data.

---

## 10. Cross-cutting concerns

| Concern | Approach |
|---|---|
| Error handling | The data layer throws typed errors. Stores catch them into their request status. Features render error states, but **only the ones that have a reference** (gap G2). A 401 anywhere triggers the session store to sign out and redirect. |
| Loading | Stores expose status. The loading UI is **blocked on gap G1**; nothing is invented. |
| Accessibility | Native HTML elements first (button, select, input, nav, ul). Visible focus follows tokens once gap G4 is resolved. |
| Performance | Route-level code splitting and narrow selectors. The board holds about 70 cards, so no virtualisation for now. |
| Dates / locale | en-GB formatting helpers in `domain/`. "23 Sept" and "29/09/2026" are both used (gap R11). |
| Icons | Inline SVG components in `components/ui/` for the few icons in the references (sun, moon, half-circle, chevron, checkbox, arrows). They can be replaced by lucide (shadcn's default) later. |

---

## 11. Open questions affecting architecture

| # | Question | Impact |
|---|---|---|
| A1 | ~~Real backend API contract~~ **Resolved**: Claude designed the contract (ADR-0011, `docs/lld/api/`) | — |
| A2 | ~~Task detail: modal or page?~~ **Resolved**: a right-side drawer, nested route `/tasks/:taskId` | — |
| A3 | Board filters and calendar month in the URL? | Store vs router ownership |
| A4 | Real-time updates (R13) | May need a push channel in the data layer |
| A5 | ~~Calendar layout bug (C1)~~ **Resolved: fix** it to an equal 7-column grid (user decision) | MonthGrid |
| A6 | ~~Is `tokens.css` committed?~~ **Resolved**: it is generated by `npm run tokens` (before dev/build/test) and git-ignored | — |
