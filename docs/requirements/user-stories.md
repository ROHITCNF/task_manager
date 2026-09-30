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

## Deferred (need a reference first — see gaps.md)

Inbox (S1) · Docs (S2) · Task detail (S3) · New task form (S4) · Quick Capture draft review (S6) · Add client (S7) · Client detail (S8) · Workspace switcher (S9) · Change requests (S10) · Dark theme palette (T1) · Loading, error, and hover states (G1–G3).
