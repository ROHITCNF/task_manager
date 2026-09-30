# User Stories — Phase 1 (referenced screens only)

- **Scope:** only the 7 screens with a reference in `docs/design/reference/`. The deferred screens are listed at the end.
- **Rules:** one story at a time (CLAUDE.md rule 5). "Matches reference" means the Playwright visual test for that screen passes its threshold (`docs/lld/testing.md`). Controls marked **inert** render exactly as in the reference but do nothing yet.
- **Shared test fixture:** MSW mock mode, today = Wed 30 Sep 2026 (morning), signed in as Rohit, workspace DMT.

---

## US-01 — Sign in

**As** a team member, **I want** to sign in with Google **so that** I can reach my workspace.
Reference: `login_light.png`

1. Visiting any app route while signed out redirects to `/login`.
2. `/login` shows a centred card with the title "Sign in", the subtitle "Team action items, all in one place.", and a full-width primary button "Continue with Google". There is no Google icon and no sidebar.
3. The card has a border and a primary glow shadow, as in the reference.
4. Clicking the button signs in (a mock session in mock mode) and navigates to `/`.
5. Visiting `/login` while signed in redirects to `/`.
6. A reload keeps the session (the `GET /auth/session` check on boot).
7. Matches reference.

## US-02 — App shell and navigation

**As** a signed-in user, **I want** a persistent sidebar **so that** I can move between areas.
Reference: all app screens

1. The sidebar shows a primary dot, the workspace name "DMT" with a chevron, the user's email truncated with an ellipsis, and a "Sign out" link.
2. The nav shows, in order: Home, Inbox, Tasks, Calendar, Docs, Clients, Quick Capture, Settings.
3. The item for the current route has the active style (tinted background, 2px left indicator, primary text).
4. Nav items route to `/`, `/inbox`, `/tasks`, `/calendar`, `/docs`, `/clients`, `/quick-capture`, `/settings`. Inbox and Docs render the shell with an empty main area (deferred).
5. "Sign out" ends the session and goes to `/login`.
6. The theme toggle shows System / Light / Dark, with the stored preference selected (default Light, as in the reference). Selecting an option persists it. **Dark has no palette yet** (deferred), so selecting Dark or System changes only the toggle state and the `.dark` class. Nothing else is visibly styled.
7. The workspace name chevron is **inert** (the switcher is deferred, gap S9).
8. Matches the sidebar region of every reference.

## US-03 — Home dashboard

**As** a user, **I want** a summary of my work and the team's **so that** I know where things stand.
Reference: `home_light.png`

1. The greeting "Good morning, Rohit" (morning/afternoon/evening by local hour, using the first name), with the subtitle "Wednesday 30 September · here's where things stand."
2. Five stat cards in the order and with the copy of the reference: My open tasks / Assigned to you; Overdue / Past their due date; Due this week / In the next 7 days; Awaiting your review / Change requests; Unread in inbox / Mentions, assignments, updates. Values come from `dashboard.stats`.
3. The "Due soon — assigned to you" panel shows "Nothing overdue or due this week." when `dueSoon` is empty. (The populated state is deferred, gap H1.)
4. The "Waiting for your review" panel shows "No change requests on tasks you manage." when empty. (The populated state is deferred, gap H2.)
5. "All tasks by status": one row per status in board order, including zero (no bar when 0). The bar length is proportional to the max count.
6. "Open tasks per person": rows sorted by count descending, long names truncated with an ellipsis, and the footer "Plus N open task(s) with nobody assigned." (hidden when N = 0).
7. Matches reference.

## US-04 — Tasks board

**As** a user, **I want** to see all tasks as a board by status **so that** I can track progress.
Reference: `taskboard_light.png`

1. The header shows the title "Tasks" and the primary button "+ New task" (**inert**, gap S4).
2. The columns are Backlog, To do, In progress, Testing & Validation, Done, Canceled, each with its count from `tasks/stats`. The board scrolls horizontally.
3. Each column lists its tasks sorted by `position`, scrolls vertically, and loads the next page on reaching the end.
4. An empty column shows only its header and "+ Add task".
5. "+ Add task" in the column footer is **inert** (gap B5).
6. Each card shows:
   - the title (wrapped)
   - the priority pill (5 variants)
   - the date range "D Mon – D Mon" if dates are present
   - "Due dd/mm/yyyy": red when overdue (open and due before today), muted otherwise
   - the checklist "☑ done/total" when `total` > 0
   - "N comment(s)" when > 0
   - client pills in the client's colour
   - "by {creator} · {created date}"
   - the assignee avatars: photo, initial, or "?" when unassigned; overlapping when there are several
7. Clicking a card is **inert** (gap S3).
8. Matches reference.

## US-05 — Board search and filters

**As** a user, **I want** to narrow the board **so that** I can find tasks quickly.
Reference: `taskboard_light.png`

1. The search input (placeholder "Search tasks…") filters by title after a 300 ms debounce.
2. The "Everyone" select lists Everyone plus the members. Choosing a member shows only tasks assigned to them.
3. The "All labels" select lists All labels plus the workspace labels.
4. The "All clients" select lists All clients plus the clients.
5. The filters combine (AND). The column counts and card lists both reflect the active filters.
6. The controls look like the reference. The open-state and no-results visuals are native select or empty columns; nothing is invented (gaps B3 and B4).

## US-06 — Calendar

**As** a user, **I want** a month view of due dates **so that** I can plan.
Reference: `calendar_light.png`, with the **approved deviation**: an equal 7-column grid (gap C1)

1. The header shows the title "Calendar", "‹", "September 2026", "›", and a "Today" button. The arrows change the month, and Today returns to the current month.
2. The grid has Sun–Sat headers and **equal-width columns aligned with the headers**, with leading blank days before the 1st.
3. A day cell shows its day number and up to 3 tasks due that day (priority dot + title on one line, truncated with an ellipsis), then "+N more" (display only, **inert**, gap C2).
4. Today's number shows the filled primary circle.
5. The right panel "No due date" lists the titles of tasks without a due date, truncated with an ellipsis.
6. Clicking an entry is **inert** (gap S3).
7. Matches the reference **except** for the grid column widths.

## US-07 — Clients list

**As** a user, **I want** to see all clients with their task and doc counts.
Reference: `clients_light.png`

1. The header shows the title "Clients" and the primary button "+ Add client" (**inert**, gap S7).
2. One bordered row per client, in server order: the client's colour dot, the name, and right-aligned "N task(s)" and "N doc(s)".
3. The list scrolls and pages via cursor.
4. Clicking a row is **inert** (gap S8).
5. Matches reference.

## US-08 — Quick Capture input

**As** a user, **I want** to paste notes to split them into tasks.
Reference: `quick-capture_light.png`

1. Shows the title "Quick Capture", the description copy, a resizable textarea with the 3-line placeholder, the "From a meeting" select, and the "Split into tasks" button.
2. "Split into tasks" is disabled while the textarea is empty or whitespace, and enabled otherwise.
3. Clicking it calls `quick-capture/split`. The draft review step is **deferred** (gap S6); for now, nothing visible changes after the call.
4. Matches reference (empty state).

## US-09 — Create a workspace

**As** a user, **I want** to create a new workspace that I own.
Reference: `settings_light.png`

1. The title "Workspace settings" with the current workspace name as the subtitle.
2. The "Create a new workspace" section shows the helper copy, the "Workspace name" input, and the "Create workspace" button, which is disabled while the name is empty or whitespace.
3. Submitting creates the workspace, adds it to the switcher list, switches to it, and clears the input.
4. Server validation errors are not shown yet (no reference, gap ST1). The button re-enables.
5. Matches reference.

## US-10 — Join a workspace

**As** a user with an invite code, **I want** to join another team's workspace.
Reference: `settings_light.png`

1. The "Join another workspace" section shows the helper copy, the "Invite code" input, and the secondary button "Join workspace". **The button is enabled even when the input is empty**, as in the reference.
2. Submitting an empty code does nothing (no request).
3. A valid code joins the workspace, adds it to the list, and clears the input. It **does not** switch workspace ("without leaving this one").
4. An invalid code shows no visible error yet (gap ST2).
5. Matches reference.

## US-11 — Members list

**As** a user, **I want** to see who is in the workspace.
Reference: `settings_light.png`

1. The "Members" heading, then one row per member in server order (OWNER first, then join order).
2. Each row shows the avatar (photo, or an initial on a palette colour chosen by hashing the user id), the name, and the role in uppercase muted text.
3. The list pages via cursor if it is long.
4. Matches reference.

---

## US-12 — Inbox

**As** a user, **I want** an inbox of my notifications **so that** I see mentions, assignments and updates.
Reference: `inbox_light.png` (added 2026-09-30)

1. `/inbox` shows a 53 px header with the title "Inbox", the filter pills "All" (selected by default) and "Unread", and on the right the buttons "Mark all as read" and "Notification settings".
2. Selecting a pill switches the filter: All loads `GET …/inbox`, Unread loads `GET …/inbox?unread=true`. The selected pill is filled primary; the other is outlined.
3. With no items, the main area shows the centred text "Nothing here yet. You'll see @mentions, assignments, status changes on your tasks and due-date reminders here."
4. "Mark all as read" is disabled when no loaded item is unread (as in the reference). When enabled, it calls `POST …/inbox/read-all` and reloads.
5. "Notification settings" is **inert** (gap IN4).
6. Item rows are **not rendered** until their design has a reference (gap IN1).
7. Matches reference.

## US-13 — Card hover: quick status change

**As** a user, **I want** to change a task's status from its card.
Reference: `card-hover_light.png`

1. Hovering over or focusing a card reveals a status select at the bottom-right of the avatar row, showing the current status.
2. The select is disabled when the viewer cannot edit the task (`permissions.canEdit`), as in the reference.
3. When enabled, choosing a status saves it (PATCH with `If-Match`) and the board reloads so the card moves column.
4. Using the select does not open the drawer.

## US-14 — Task detail drawer: Details

**As** a user, **I want** to open a task and see all its details.
Reference: `card_click_state_light.png`

1. Clicking (or pressing Enter on) a card opens `/tasks/:taskId`: a 20% black scrim over the app and a right-side drawer.
2. The header shows "Close" and the Details / History chips, with Details selected. Close, a scrim click, and Esc all return to `/tasks`.
3. The created line shows "Created by <avatar> <name> on 23 Sept, 19:56".
4. When the viewer cannot edit, the permission notice and the "Ask to be assigned" button are shown (the button is inert, gap TD3), and every field is disabled with the greyed look.
5. The fields are title, description, assignee chips for **all members** (assigned ones filled), Status, Priority, Client, Start date, End date, and Due date ("Set due date" placeholder), then the "Subtasks" label.
6. When the viewer can edit (not referenced, gap TD2), the same controls are enabled and each change is saved immediately with `If-Match`. The board refreshes afterwards.
7. Matches the reference for the drawer region.

## US-15 — Task detail drawer: History

**As** a user, **I want** to see how a task moved through stages and who changed what.
Reference: `card_click_state_history_light.png`

1. Selecting "History" shows the title, the "Stages" label, and one pill per stage ("Backlog ~6d 18h · now").
2. Each stage section has a status-coloured left bar, the stage name, "23 Sept, 19:56 → now · 6d 18h so far", and the approximate-stage note when applicable.
3. Events are listed oldest first, with avatar, "<actor> <action>" and a timestamp: created this task · added subtask “X” · changed the <field> from A to B. Unknown event types are not rendered (gap TD4).
4. Matches the reference for the drawer region.

## Deferred (need a reference first — see gaps.md)

Docs (S2) · New task form (S4) · Quick Capture draft review (S6) · Add client (S7) · Client detail (S8) · Workspace switcher (S9) · Change requests (S10) · Dark theme palette (T1) · Loading, error, and hover states (G1–G3).
