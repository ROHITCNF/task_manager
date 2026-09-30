# LLD — Components, Styling, Theming

- **Implements:** HLD §7–8, ADR-0002, ADR-0009
- **Inventory:** `docs/requirements/screen-inventory.md`
- **Tokens:** `docs/design/tokens/*.json`

## 1. Conventions

- One folder per component: `Button/Button.jsx`, `Button.module.css`, `Button.test.jsx`, `index.js`.
- Props use shadcn-style names where they apply: `variant`, `size`, `asChild` (not implemented), `className` (merged last).
- Everything renders **native elements**. Buttons are `<button type="button">` by default, selects are `<select>`, and so on.
- The CSS uses `var(--…)` tokens only. The one exception is the runtime `--client-colour` / `--avatar-bg` custom properties that tier-2 components set inline.
- Icons are inline SVG components in `components/ui/icons/`, sized with `1em`, using `currentColor`.

## 2. Tier 1 — primitives (`src/components/ui/`)

| Component | Props | Variants / notes (reference) |
|---|---|---|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'`, `size: 'default'\|'sm'`, `fullWidth`, `disabled`, `type`, `onClick`, `children` | Primary: filled `--color-primary-bg`; when disabled `--color-primary-bg-disabled` with white text (Quick Capture, Settings). Secondary: white + border (Today, Join workspace). Ghost: text only (+ Add task, Sign out). fullWidth for Login. |
| `IconButton` | `label` (aria-label), `children` | Calendar ‹ › |
| `Input` | native input props + `size: 'default'\|'sm'` | `sm` = 28px (Tasks search); default = 34px (Settings) |
| `Textarea` | native props | Resizable vertically (Quick Capture) |
| `Select` | `value`, `onChange`, `options: {value,label}[]`, `size`, `width` | Native `<select>` with a custom chevron (Tasks filters, Quick Capture source) |
| `Card` | `as`, `padding: 'md'\|'lg'`, `elevated`, `children` | Border + `radius-lg`; `elevated` = glow shadow (Login) |
| `Pill` | `tone: 'outline'\|'tinted'`, `dotColour` (CSS var or value), `children` | Outline for priority; tinted for client (uses `--pill-colour`) |
| `Dot` | `colour`, `size: 'sm'\|'md'` | 6px / 10px |
| `Avatar` | `src`, `name`, `colourVar`, `size: 'sm'\|'md'`, `unassigned` | Photo · initial on a colour · "?" on grey |
| `AvatarGroup` | `children`, `max` | Overlap by −4px (Test10 card) |
| `SegmentedControl` | `value`, `onChange`, `options: {value,label,icon}[]`, `aria-label` | The theme toggle. A radio group underneath (`role="radiogroup"`). |
| `BarMeter` | `ratio` 0..1 | A rounded bar; renders nothing when the ratio is 0 |
| `ScrollArea` | `axis: 'x'\|'y'\|'both'`, `children` | Styled thin scrollbars (`--color-scrollbar-thumb`) |
| `EmptyText` | `children` | Muted single-line empty state (Home panels) |

## 3. Tier 2 — domain components (`src/components/domain/`)

| Component | Props | Renders |
|---|---|---|
| `PriorityPill` | `priority` | `Pill` outline, dot `var(--color-priority-<p>)`, label from `PRIORITY_LABEL` |
| `ClientPill` | `client: ClientRef` | `Pill` tinted with `style={{'--pill-colour': client.colour}}` |
| `DueDate` | `task`, `today` | "Due 29/09/2026"; class `overdue` when `isOverdue` |
| `DateRange` | `start`, `end` | "23 Sept – 28 Sept"; null if both are null |
| `ChecklistCount` | `checklist` | "☑ 0/1"; null if total is 0 |
| `CommentCount` | `count` | "1 comment"; null if 0 |
| `UserAvatar` | `user: UserRef\|null`, `size` | Uses `avatarToken(user.id)` and `initialOf`; null → unassigned |
| `TaskCard` | `task`, `today` | The full card anatomy in `screen-inventory.md` §2. The root is an `<article>`. |
| `StatCard` | `label`, `value`, `caption` | Home stat card |
| `BarChartCard` | `title`, `rows: {label,count,ratio}[]`, `footer?` | Home chart card |
| `PanelCard` | `title`, `children` | The Home "Due soon" / "Waiting" panels |
| `ClientRow` | `client` | Clients list row |
| `MemberRow` | `member` | Avatar md + name + ROLE |
| `CalendarEntry` | `task: CalendarTask` | Dot + ellipsised title |
| `CalendarDayCell` | `date`, `dayNumber`, `entries`, `more`, `isToday` | Day cell |

Tier-2 components are pure: props in, markup out. There are no hooks except `useId`.

## 4. Theming

- `scripts/build-tokens.js` reads `docs/design/tokens/*.json` and emits `src/styles/tokens.css`:
  - `:root { --<category>-<path>: value; }` for primitives, named with a `--p-` prefix (e.g. `--p-neutral-900`).
  - Semantic light values on `:root`, e.g. `--color-text-primary: var(--p-neutral-900);`.
  - Semantic dark values under `:root.dark { … }`. The block is empty for now.
  - Space → `--space-*`, size → `--size-*`, radius → `--radius-*`, shadow → `--shadow-*`, font → `--font-*`.
  - The build fails on an unresolved `{ref}`.
- `src/styles/shadcn-aliases.css` is created now but left empty. It will map `--background`, `--primary`, etc. when shadcn is adopted.
- `applyTheme(pref)` lives in `src/app/theme.js`, **not** in `state/`, because it touches the DOM. It toggles `document.documentElement.classList` `dark` and listens to `matchMedia('(prefers-color-scheme: dark)')` when `pref === 'system'`.
- The pre-paint script in `index.html` has the same logic, inline (about 10 lines), and reads `localStorage['dmt.theme']`.

## 5. Tier 3 features / tier 4 pages

| Area | Features (`src/features/<area>/`) | Page |
|---|---|---|
| shell | `Sidebar`, `WorkspaceHeader`, `MainNav`, `ThemeToggle` | — (used by `AppShell`) |
| auth | `SignInCard` | `LoginPage` |
| home | `Greeting`, `StatRow`, `DueSoonPanel`, `ReviewPanel`, `StatusChart`, `PeopleChart` | `HomePage` |
| tasks | `BoardToolbar`, `TaskBoard`, `BoardColumn` | `TasksPage` |
| calendar | `CalendarHeader`, `MonthGrid`, `NoDueDatePanel` | `CalendarPage` |
| clients | `ClientsHeader`, `ClientList` | `ClientsPage` |
| quick-capture | `CaptureForm` | `QuickCapturePage` |
| settings | `CreateWorkspaceForm`, `JoinWorkspaceForm`, `MemberList` | `SettingsPage` |

- Features trigger their own loads in `useEffect` when the workspace id changes.
- Pages only lay features out: their own CSS Module plus the features.
