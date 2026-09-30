# Screen Inventory

Source: the eleven screenshots in `docs/design/reference/`. All are light theme and desktop. The app screens are roughly 3440×1900 px and were captured on Wednesday 30 September 2026. The login and inbox screens are smaller captures at 1× scale (about 1905 px wide).

| Screen | File |
|---|---|
| Home | `home_light.png` |
| Tasks (board) | `taskboard_light.png` |
| Calendar | `calendar_light.png` |
| Clients | `clients_light.png` |
| Quick Capture | `quick-capture_light.png` |
| Settings | `settings_light.png` |
| Login | `login_light.png` |
| Inbox | `inbox_light.png` |
| Task card hover (crop) | `card-hover_light.png` |
| Task detail drawer — Details | `card_click_state_light.png` |
| Task detail drawer — History | `card_click_state_history_light.png` |

Legend: **Observed** means visible in a screenshot. **Inferred** means the likely behaviour, which is not confirmed. Every inferred item needs sign-off and is tracked in `gaps.md`.

---

## 0. App shell (every screen)

### Layout regions

| Region | Contents |
|---|---|
| Left sidebar (fixed width, full height, right border) | Workspace header, primary nav, theme toggle pinned to the bottom |
| Main content | Screen-specific content. Home, Quick Capture, and Settings use a centred, max-width column. Tasks, Calendar, and Clients use the full width. |

### Components

| Component | Observed details |
|---|---|
| Workspace header | Small primary-colour status dot, workspace name "DMT" (bold) with a chevron-down, current user email truncated with an ellipsis ("rohitsrivastava@inte…"), and a "Sign out" text link on the right |
| Primary nav | Eight text items: Home, Inbox, Tasks, Calendar, Docs, Clients, Quick Capture, Settings. No icons. |
| Nav item: active variant | Tinted primary background, left accent border, primary-coloured text, rounded corners |
| Nav item: default variant | Plain dark text, no background |
| Theme toggle | Segmented control with three options: System (half-circle icon), Light (sun icon), Dark (moon icon). The selected option has a raised white background. Light is selected in every screenshot. |

### Interactive elements

| Element | Likely behaviour (inferred) |
|---|---|
| Workspace name and chevron | Opens a workspace switcher. The Settings copy confirms this: "Switch between your workspaces from the name at the top left." |
| Sign out | Ends the session and goes to login |
| Nav items | Route to each screen |
| Theme toggle | Sets the theme preference (system/light/dark) and persists it |

### Data

- `currentUser`: `{ id, name: string, email: string, avatarUrl?: string }`
- `currentWorkspace`: `{ id, name: string }`
- `workspaces`: `Workspace[]` (for the switcher)
- `themePreference`: `'system' | 'light' | 'dark'`

---

## 1. Home (`home_light.png`)

### Layout regions

1. Greeting header
2. Stat card row (5 equal cards)
3. Two-column row: "Due soon" and "Waiting for your review" panels
4. Two-column row: "All tasks by status" and "Open tasks per person" bar-chart cards

### Components

| Component | Observed details |
|---|---|
| Greeting | "Good morning, Rohit" (bold) with the subtitle "Wednesday 30 September · here's where things stand." |
| Stat card ×5 | Label (small, muted), large number, caption (small, muted). Bordered and rounded. |
| — My open tasks | 0 · "Assigned to you" |
| — Overdue | 0 · "Past their due date" |
| — Due this week | 0 · "In the next 7 days" |
| — Awaiting your review | 0 · "Change requests" |
| — Unread in inbox | 0 · "Mentions, assignments, updates" (wraps to 2 lines) |
| Panel: "Due soon — assigned to you" | Shown in its empty state: "Nothing overdue or due this week." |
| Panel: "Waiting for your review" | Shown in its empty state: "No change requests on tasks you manage." |
| Bar chart: "All tasks by status" | Rows of label, horizontal primary-colour bar, and count. Values: Backlog 4, To do 49, In progress 10, Testing & Validation 0 (no bar), Done 9, Canceled 1. |
| Bar chart: "Open tasks per person" | Same row pattern. Long names are truncated with an ellipsis ("Bommidi Satya Durga pra…"). Sorted by count, descending. Footer note: "Plus 1 open task with nobody assigned." |

### Interactive elements

None are clearly interactive. Possible (inferred): stat cards link to filtered task views, and bar rows filter the board.

### Variants

- Stat card: one variant. The caption can wrap to 2 lines.
- Bar row: zero value (no bar, count only), small value (a stub bar with rounded ends), and max value (full width).
- Panel: only the empty variant is visible. The populated variant is not shown.

### Data

- `greeting`: derived from local time of day and `currentUser.name` (first name)
- `today`: date, formatted as "Wednesday 30 September"
- `stats`: `{ myOpen: number, overdue: number, dueThisWeek: number, awaitingReview: number, unreadInbox: number }`
- `dueSoon`: `Task[]` (assigned to me, overdue or due within 7 days)
- `awaitingReview`: `ChangeRequest[]` (shape unknown)
- `countsByStatus`: `{ status: TaskStatus, count: number }[]`
- `openByPerson`: `{ userId, name: string, count: number }[]` plus `unassignedOpenCount: number`

---

## 2. Tasks board (`taskboard_light.png`)

### Layout regions

1. Toolbar: title and "+ New task" on the left, then search and three filters on the right
2. Kanban area: horizontally scrollable columns, with a horizontal scrollbar visible at the bottom

### Components

| Component | Observed details |
|---|---|
| Page title | "Tasks" |
| Primary button | "+ New task" (filled primary) |
| Search input | Placeholder "Search tasks…" |
| Select | "Everyone" (assignee filter, wide) |
| Select | "All labels" (label filter, narrow) |
| Select | "All clients" (client filter, wide) |
| Column | Header with the status name on the left and the count (muted) on the right. The card list scrolls vertically (scrollbar visible). The footer has a "+ Add task" text button. Tinted background. |
| Columns visible | Backlog (4), To do (49), In progress (10), Testing & Validation (0, empty), Done (count cut off). "Canceled" is presumably further right, off-screen. |
| Task card | See the anatomy below |

### Task card anatomy (top to bottom; optional parts in brackets)

1. **Title**: medium weight, wraps across multiple lines, no truncation
2. **Meta row** (wraps as needed): priority pill · date range "23 Sept – 28 Sept" · [due date] · [checklist "☑ 0/1"] · [comment count "1 comment"] · [client pill(s)]
3. **Author line**: "by {creator name} · {created date}" (muted)
4. **Assignee avatars**: one or more, overlapping when there are several

### Variants

| Component | Variants observed |
|---|---|
| Priority pill | Outline pill with a coloured dot and a label: **Urgent** (red), **High** (orange), **Medium** (amber), **Low** (blue), **No priority** (grey) |
| Client pill | Tinted fill and border in the client's own colour, with a dot and a name. Seen: Bounce (red), BGauss (orange), Jupiter Wagon Limited (green), Alva Auto (green), Jupiter Electric Mobility (green), Mr. Med (pink), Tum Tum (pink), Tata Motors (pink), Multiple Clients (purple). The colours match the client dots on the Clients screen. |
| Due date | **Overdue**: red text ("Due 29/09/2026" in To do, "Due 23/09/2026" in In progress). **Normal**: muted text ("Due 30/09/2026", which is today). **Done column**: muted even when the date is past ("Due 24/09/2026", "Due 22/09/2026"). |
| Checklist counter | Checkbox icon with "done/total" (0/1, 0/2, 0/3). Only shown when the task has checklist items. |
| Comment count | "1 comment". Hidden when zero. Plural form assumed to be "N comments". |
| Avatar | Photo · initial letter on a coloured circle ("B", teal) · "?" on grey (unassigned) · generated/gradient image · stacked group of 2 |
| Column | Populated · empty (Testing & Validation, which shows only the header and "+ Add task") |
| Card placement | Client pill inline in the meta row, or wrapped onto its own line when space runs out |

### Interactive elements

| Element | Likely behaviour (inferred) |
|---|---|
| + New task | Opens a create-task form (modal or page, **not shown**) |
| Search | Filters cards by text (fields unknown) |
| Everyone | Assignee filter (Everyone / specific member / probably "Me" and "Unassigned") |
| All labels | Label filter. Labels are **not visibly rendered** on cards, unless the client pills are labels. |
| All clients | Client filter |
| Task card click | Opens task detail (**not shown**) |
| Card drag | Probably moves the card between columns to change its status (**not confirmed**) |
| + Add task (per column) | Quick-add a task with that column's status preset |
| Horizontal/vertical scroll | Board scrolls horizontally; each column scrolls vertically |

### Data

```ts
type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'testing_validation' | 'done' | 'canceled';
type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  startDate: Date;          // "23 Sept" in the range
  endDate: Date;            // "28 Sept" in the range
  dueDate?: Date;           // separate from the range; optional
  checklist?: { done: number; total: number };
  commentCount: number;
  clientIds: string[];      // 0..n client pills
  labelIds?: string[];      // implied by the "All labels" filter; not rendered
  createdBy: UserRef;
  createdAt: Date;
  assignees: UserRef[];     // empty → "?" avatar
}
interface UserRef { id: string; name: string; avatarUrl?: string; initial: string; colour: string }
```

Two date formats are in use: a short date ("23 Sept", en-GB style with "Sept") and a numeric date ("29/09/2026", dd/mm/yyyy).

---

## 3. Calendar (`calendar_light.png`)

### Layout regions

1. Header: title on the left; previous arrow, "September 2026", next arrow, and a "Today" button on the right
2. Month grid (horizontally scrollable, scrollbar visible)
3. Right side panel: "No due date" list

### Components

| Component | Observed details |
|---|---|
| Page title | "Calendar" |
| Month navigator | "‹" and "›" icon buttons around a month label |
| Today button | Outline/secondary button |
| Weekday header | Sun … Sat (muted) |
| Day cell | Bordered, rounded box. Day number at top left (muted). Up to 3 task entries, then "+N more" (muted, small). |
| Day number: today variant | Filled primary circle with white text (30) |
| Calendar task entry | Coloured dot and task title on a single line, clipped by the cell width |
| "No due date" panel | Muted heading; list of task titles truncated with an ellipsis |

### Variants

- Task entry dot colour = task priority: red (Urgent), amber (Medium, e.g. "Re: ALVA Request…"), grey (No priority, "Test10").
- Day cell: empty · with entries · with a "+N more" overflow · today.
- Leading empty cells before day 1 (September 2026 starts on a Tuesday).

### Layout anomaly (must resolve; see `gaps.md`)

In the screenshot the grid columns are **not equal widths** and do not line up with the weekday headers. Sun is very narrow, Mon is very wide, and a single cell spans the Tue–Fri headers ("1", "8", "15", "22", "29"). The next cell sits under Sat ("2", "9", …), and the rest overflow to the right behind the horizontal scrollbar. This looks like long, untruncated task titles are driving the column widths, i.e. a bug in the existing app. Whether to replicate this is an open decision.

### Interactive elements

| Element | Likely behaviour (inferred) |
|---|---|
| ‹ / › | Previous/next month |
| Today | Jump to the current month |
| Task entry | Opens task detail |
| "+N more" | Expands the day or opens a day list/popover |
| "No due date" item | Opens task detail |
| Day cell click | Unknown (possibly quick-add with that due date) |

### Data

- `month`: year and month
- `tasksByDueDate`: `Map<date, Task[]>` (uses `Task.dueDate`, **not** the start/end range)
- `tasksWithoutDueDate`: `Task[]`. Note: "Re: Intellicar Track Platform cleanup" has a date range but appears in "No due date", which confirms that `dueDate` is a separate field.
- Calendar entries need only `id`, `title`, and `priority`.

---

## 4. Clients (`clients_light.png`)

### Layout regions

1. Header: title on the left, "+ Add client" primary button on the right
2. Full-width vertical list of client rows (continues past the viewport)

### Components

| Component | Observed details |
|---|---|
| Page title | "Clients" |
| Primary button | "+ Add client" |
| Client row | Bordered, rounded, full-width row. Coloured dot, client name (medium weight), then right-aligned muted counts: "{n} task(s)" and "{n} docs". |

### Variants

- Dot colour: per-client (green, pink, orange, teal, indigo, red, purple, blue, lime…).
- Pluralisation: "1 task" vs "2 tasks". Every row shows "0 docs" (the singular "1 doc" is assumed).
- Pseudo-clients exist as ordinary rows: "All Clients" (and "Multiple Clients" appears on a task card).

### Ordering

Alphabetical and **case-sensitive (ASCII)**: "BGauss" sorts before "Battery Smart" because uppercase letters sort before lowercase ones.

### Interactive elements

| Element | Likely behaviour (inferred) |
|---|---|
| + Add client | Opens a create-client form (**not shown**) |
| Client row | Opens a client detail page or a filtered task/doc view (**not shown**) |

### Data

```ts
interface Client { id: string; name: string; colour: string; taskCount: number; docCount: number }
```

---

## 5. Quick Capture (`quick-capture_light.png`)

### Layout regions

A centred, narrow column with the title, description, textarea, and action row.

### Components

| Component | Observed details |
|---|---|
| Title | "Quick Capture" |
| Description | "Paste meeting notes or a list of to-dos below. Each line becomes a draft task you can edit before creating." (muted) |
| Textarea | Large and resizable (resize handle visible). Multi-line placeholder: "Paste meeting notes or a list, one item per line… / - Follow up with design on mockups / - Send contract to legal" |
| Select | "From a meeting" (source type) |
| Primary button | "Split into tasks", shown **disabled** (faded primary) while the textarea is empty |

### Variants

- Primary button: disabled (observed) and enabled (inferred).

### Interactive elements

| Element | Likely behaviour (inferred) |
|---|---|
| Textarea | Free-text input |
| "From a meeting" select | Chooses the source type. Other options are unknown (e.g. "From a list"?). May change how the text is parsed. |
| Split into tasks | Parses lines into draft tasks and shows an editable draft list (**not shown**), which is then committed as real tasks |

### Data

- `rawText: string`
- `sourceType: string` (enum values unknown)
- Output: `DraftTask[]` (at minimum `title`; other editable fields are unknown)

---

## 6. Settings (`settings_light.png`)

### Layout regions

A centred column with three stacked sections: Create a new workspace, Join another workspace, and Members.

### Components

| Component | Observed details |
|---|---|
| Page title | "Workspace settings", with the subtitle "DMT" (current workspace name, muted) |
| Section heading | "Create a new workspace" |
| Helper text | "You'll be its owner. Switch between your workspaces from the name at the top left." |
| Text input | Placeholder "Workspace name" |
| Primary button | "Create workspace", shown **disabled** while the input is empty |
| Section heading | "Join another workspace" |
| Helper text | "Got an invite code from another team? Join it without leaving this one — you can switch between workspaces from the sidebar." |
| Text input | Placeholder "Invite code" |
| Secondary button | "Join workspace" (outline), shown **enabled** even though the input is empty, unlike Create |
| Section heading | "Members" |
| Member row | Avatar (32 px-ish circle), name, and role in uppercase muted small text below it |

### Variants

- Avatar: coloured circle with an initial (purple, pink, orange, green, blue, indigo, dark green, slate…) · photo · generated gradient image.
- Role: **OWNER**, **MEMBER**.
- Button: primary disabled · secondary enabled.

### Interactive elements

| Element | Likely behaviour (inferred) |
|---|---|
| Workspace name + Create workspace | Creates a workspace owned by the current user. Probably switches to it afterwards. |
| Invite code + Join workspace | Joins another workspace by code |
| Member rows | No visible actions (no remove, role change, or invite) |

### Data

```ts
interface Member { userId: string; name: string; avatarUrl?: string; initial: string; colour: string; role: 'OWNER' | 'MEMBER' }
```

The member list order appears to be the owner first, then join order (it is not alphabetical).

---

## 7. Login (`login_light.png`)

### Layout regions

- **No app shell**: no sidebar and no theme toggle.
- A plain background with a single card centred both horizontally and vertically.

### Components

| Component | Observed details |
|---|---|
| Auth card | White, thin border, rounded corners, and a soft **primary-tinted glow shadow** (indigo, diffuse). Contents are centre-aligned. |
| Title | "Sign in" (bold) |
| Subtitle | "Team action items, all in one place." (muted, small) |
| Primary button | "Continue with Google". Full width within the card, filled primary, white text. **No Google logo or icon.** |

### Variants

- Primary button: a full-width variant, which is new; the other screens use content-width buttons.
- Card: an elevated variant with a glow shadow, which is new; the other cards have a border only and no shadow.

### Interactive elements

| Element | Likely behaviour (inferred) |
|---|---|
| Continue with Google | Starts the Google OAuth sign-in and, on success, redirects into the app (probably Home) |

Observed: there is no email/password option, no sign-up link, no "forgot password", and no terms/privacy links. Google is the **only** auth method.

### Data

- None before sign-in.
- After sign-in, `currentUser` (name, email, avatar) comes from the Google profile. This matches the photo avatars seen elsewhere.

---

## 8. Inbox (`inbox_light.png`)

Captured at 1× scale, 1905×929. Only the **empty state** is shown.

### Layout regions

1. Header bar: 53 px tall with a bottom border. The title and filter pills are on the left, and two buttons are on the right.
2. Main area: a single empty-state line, centred horizontally, about 24 px below the header.

### Components

| Component | Observed details |
|---|---|
| Page title | "Inbox" (18 px, semibold) |
| Filter pill: selected | "All". Filled primary, white text, fully rounded, 26 px tall |
| Filter pill: default | "Unread". White with a `#e5e5e5` border and dark text, fully rounded, 26 px tall |
| Button: secondary, disabled look | "Mark all as read". Lighter border (`#f2f2f2`) and grey text (`#8b8b8b`), 27 px tall, 12 px text |
| Button: secondary | "Notification settings". Border `#e5e5e5` and dark text, 27 px tall, 12 px text |
| Empty state | "Nothing here yet. You'll see @mentions, assignments, status changes on your tasks and due-date reminders here." Muted (`#999`), about 13 px, centred |

### Interactive elements

| Element | Likely behaviour (inferred) |
|---|---|
| All / Unread | Switches the list between all notifications and unread only (`GET …/inbox?unread=`) |
| Mark all as read | Marks every item read (`POST …/inbox/read-all`). It looks disabled when there is nothing unread. |
| Notification settings | Opens notification preferences. **That screen is not shown.** |
| Inbox item (not shown) | Probably opens the related task |

### Variants

- Filter pill: selected / default.
- Button: secondary enabled / secondary disabled (a new variant — earlier references only showed a disabled *primary* button).

### Data

- `filter: 'all' | 'unread'`
- `items: InboxItem[]` (contract: `kind` = mention / assignment / update, `read`, `createdAt`, `actor`, `task`, `excerpt`), plus `nextCursor`
- The empty copy lists four kinds: @mentions, assignments, status changes, and due-date reminders. The contract has three (`mention`, `assignment`, `update`); see gap IN5.

---

## 9. Task card hover (`card-hover_light.png`)

A 332×222 crop at 1× scale showing the first Backlog card while the pointer is over it.

- The card gains a **status select** at the bottom-right, on the same row as the avatars: 128×21 px, showing "Backlog".
- In the reference the select is **greyed** (text `#a5a5a5`) because the viewer (Rohit) cannot edit this task (see §10, permissions).
- Inferred: changing it moves the card to another column (a status PATCH).

## 10. Task detail drawer (`card_click_state_light.png`, `card_click_state_history_light.png`)

Opened by clicking a task card. Both captures are at 1× scale (1896×942 and 1907×928). **This resolves gap S3: task detail is a right-side drawer over the board, not a page.**

### Layout regions

1. **Scrim:** 20% black over the whole app, sidebar included (white becomes `#ccc`).
2. **Drawer:** about 433 px wide, full height, white, fixed to the right edge. Content padding is 24 px on the left and 20 px on the right. It scrolls vertically: the Details tab continues below the fold at "Subtasks".

### Common header (both tabs)

| Component | Observed details |
|---|---|
| Close | Text button, top-left, muted (`#7f7f7f`), 13 px |
| Tabs | "Details" / "History" chips at the top-right, 28 px tall. Selected = filled primary, default = outlined (same style as the Inbox filter chips). |

### Details tab (`card_click_state_light.png`)

| Component | Observed details |
|---|---|
| Created line | 14 px avatar + "Created by Anantha Krishnan T G on 23 Sept, 19:56" (muted `#999`, 12 px) |
| Permission notice | Bordered, rounded box: "Only the task's creator and owners can change it. You can still comment." (`#4b4b4b`, 12 px, 2 lines) + secondary button "Ask to be assigned" |
| Title | "Re: Intellicar Track Platform cleanup" (bold, about 18 px) |
| Description | Bordered box, 90 px tall, containing the description ("CSM - NIRANJAN BALAJI.") |
| Assignees | Label + a wrap of **chips, one per workspace member** (14 px avatar + name, 12 px, 26 px tall). Assigned members' chips are filled primary with white text (Anantha). |
| Status | Label + full-width select ("Backlog") |
| Priority · Client | Two equal columns of label + select ("High", "Bounce") |
| Start date · End date | Two columns of label + input showing "23 Sept 2026" / "28 Sept 2026" |
| Due date | Label + input with the placeholder "Set due date" |
| Subtasks | Label only: the section is cut off at the fold (gap TD1) |

- **Read-only state:** the viewer is neither the creator nor an owner, so every field is disabled. Disabled selects have background `#fbfbfb` and text `#a4a4a4`; disabled inputs have background `#fafafa` and text `#7d7d7d`.
- **Labels** are muted (`#999`, 12 px). The gap from a label to its control is 8 px, and from one control to the next label 16 px.
- **Members:** the chip list shows 24 members. It includes 10 not visible in `settings_light.png` (that list was cut off): Anusha P, Karan Aneja, Saksham Tulani, Joseph MJ, Rohit Srivastava, Bikky K S, Balapriya Priya, Ayush Mhaskar, Kriti Anand, and Debnath Mondal.
- **Avatar palette:** these chips reveal 5 more initial-avatar colours (blue-grey, deep purple, crimson, brown, teal-green), so the palette is extended from 9 to 14.

### History tab (`card_click_state_history_light.png`)

| Component | Observed details |
|---|---|
| Title | Task title (bold, about 18 px). There is no created line or notice on this tab. |
| Stages | Muted label, then an indented row of **stage pills**: outlined pill with the status dot, status name, and muted duration ("Backlog ~6d 18h · now") |
| Stage section | 3 px left bar in the status colour (grey `#9ca3ae` for Backlog). Contents: status name (bold), the muted range "23 Sept, 19:56 → now · 6d 18h so far", and the muted note "Status changes before history tracking started weren't recorded, so this stage is approximate." |
| Events | Indented list: 20 px avatar, "<actor> <action>" (14 px), and the time below it (muted, 11 px): "created this task" · "added subtask “test 1”" · "changed the end date from 23 Sept 2026 to 28 Sept 2026" |

### Interactive elements (inferred unless noted)

| Element | Behaviour |
|---|---|
| Task card click | Opens the drawer (observed: clicked-card state) |
| Close, scrim click, Esc | Close the drawer (Close is observed; the scrim and Esc are standard) |
| Details / History | Switch tabs (observed) |
| Ask to be assigned | Requests assignment from the task's owner. The outcome is not shown (gap TD3). |
| Fields (when editable) | Save on change. The editable appearance is not shown (gap TD2). |

### Data

- A full task (with description), `permissions.canEdit`, the workspace members, and clients.
- History: `stages[] { status, enteredAt, exitedAt|null, approximate }`, `events[] { type, actor, createdAt, … }`.
- Formats: "23 Sept, 19:56" (date and time), "23 Sept 2026" (date with year), and durations like "6d 18h".

---

## 11. Shared components

| Component | Used on | Notes |
|---|---|---|
| App shell / sidebar | All except Login (Inbox included) | Workspace header, nav, theme toggle |
| Nav item | All except Login | Default and active variants |
| Theme toggle (segmented control) | All except Login | 3 options |
| Page header (title + optional actions) | Tasks, Calendar, Clients | Title on the left, actions on the right |
| Page intro (title + muted subtitle/description) | Home, Quick Capture, Settings | Centred column layout |
| Button: primary | Tasks, Clients, Quick Capture, Settings, Login | Enabled and disabled; "+ label" prefix pattern; full-width variant on Login |
| Button: secondary/outline | Calendar (Today), Settings (Join), Inbox | Inbox adds a disabled secondary variant and a compact 27 px size |
| Filter pill (toggle) | Inbox, task drawer tabs | Selected = filled primary; default = outlined |
| Member chip | Task drawer | 14 px avatar + name; assigned = filled primary |
| Drawer + scrim | Task detail | Right panel over a 20% black scrim |
| Form field (label + control) | Task drawer | Muted label; disabled look when read-only |
| Button: text/ghost | Tasks ("+ Add task"), sidebar ("Sign out") | |
| Icon button | Calendar (‹ ›) | |
| Text input | Tasks (search), Settings (×2) | Placeholder style |
| Textarea | Quick Capture | Resizable |
| Select | Tasks (×3), Quick Capture | Native-looking, with a chevron |
| Card / panel (bordered, rounded) | Home, Tasks, Clients rows, Calendar cells, Login | Flat on the app screens; elevated with a primary glow shadow on Login |
| Avatar | Tasks, Settings | Photo / initial / "?" / gradient; stacked group |
| Status dot | Sidebar, Clients, Calendar, pills | Colour from priority or client |
| Priority pill | Tasks | 5 variants |
| Client pill | Tasks | Colour per client |
| Horizontal bar row | Home (×2 charts) | Label, bar, count |
| Muted meta text | Everywhere | Captions, counts, dates |
| Empty-state text | Home panels | Single muted sentence |
| Scroll container | Tasks (both axes), Calendar (horizontal) | Scrollbars visible |

### Shared enums and colour mappings

- **Status order**: Backlog → To do → In progress → Testing & Validation → Done → Canceled
- **Priority → colour**: Urgent = red, High = orange, Medium = amber, Low = blue, No priority = grey. The same mapping is used for pill dots and calendar dots.
- **Client → colour**: stored per client and reused in client pills and the client list.
