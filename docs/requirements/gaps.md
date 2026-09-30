# Gaps: Not Covered by the Reference Screenshots

Everything below is needed to build the app but is **not visible** in `docs/design/reference/`. Under the project rule "never invent UI", each item needs a screenshot, a spec, or an explicit decision before we build it.

Priority: **P0** blocks core flows · **P1** needed for parity · **P2** polish or edge cases.

Suggested capture method: take a screenshot from the existing app for each item, named `{screen}-{state}_{theme}.png`.

## Decisions log (2026-09-30)

| Gap | Decision |
|---|---|
| S1, S2, S3, S4, S6, S7, S8, S9, S10 | **Deferred.** Phase 1 builds only the referenced screens. Controls that lead to these screens render as in the reference but are **inert**. Inbox and Docs routes show the shell with an empty main area. |
| C1 | **Fix.** Use an equal 7-column grid aligned with the weekday headers, with titles truncated by an ellipsis. |
| T1 | **Deferred.** The toggle and theme plumbing are built; the dark palette stays empty. |
| Auth (L1–L5) | Mock login for now (ADR-0012). L1–L5 are revisited when Google is wired. |
| R2 overdue | Default: `dueDate < today` and the task is open (not done or canceled). |
| R3 dates | Default: `startDate`, `endDate`, and `dueDate` are independent and each is optional. |
| R6 client sort | Keep the reference order (binary collation, applied server-side). |
| R11 locale | en-GB: "23 Sept" and "29/09/2026", as in the reference. |
| A1 API contract | Designed by Claude: `docs/lld/api/openapi.yaml` (ADR-0011). |

Unlisted gaps are still open.

---

## 1. Missing screens

| # | Screen | Why it's needed | Pri |
|---|---|---|---|
| S1 | **Inbox** | In the nav; the Home card "Unread in inbox" links to it. Item types: mentions, assignments, updates. | P0 |
| S2 | **Docs** | In the nav; clients show "N docs" counts | P0 |
| S3 | **Task detail** (view/edit) | Opened by every task card and calendar entry. Should show fields, checklist, comments, change requests, activity. | P0 |
| S4 | **New task form** | From "+ New task" and "+ Add task". Modal or page? Which fields are required? | P0 |
| S5 | ~~Login~~ **Covered** by `login_light.png` (Google-only sign-in). The remaining auth gaps are listed in the Login table under §3. | — |
| S6 | **Quick Capture draft review** | The step after "Split into tasks": the editable draft list and the create action | P0 |
| S7 | **Add client form** | From "+ Add client": fields (name, colour?) | P1 |
| S8 | **Client detail** | If client rows are clickable | P1 |
| S9 | **Workspace switcher dropdown** | Opened from "DMT ⌄" in the sidebar | P1 |
| S10 | **Change request** view/flow | Referenced by "Awaiting your review" and "Waiting for your review", never shown | P1 |
| S11 | **Onboarding / no-workspace state** | A user with zero workspaces | P2 |
| S12 | 404 / not-found page | | P2 |

## 2. Missing theme

| # | Item | Pri |
|---|---|---|
| T1 | **Dark theme screenshots for every screen.** The toggle exists but only light is shown, so there are no dark token values to go on. | P0 |
| T2 | Behaviour of the "System" option (does it follow the OS live?) | P2 |

## 3. Missing states

### Global
| # | State | Pri |
|---|---|---|
| G1 | Loading (skeletons? spinners?) on every screen | P0 |
| G2 | Error states (failed fetch, failed save), including toasts/banners if any | P0 |
| G3 | Hover, focus, pressed, and disabled states for buttons, nav items, cards, rows, and inputs | P1 |
| G4 | Keyboard focus ring style | P1 |
| G5 | Responsive layouts (tablet/mobile). Does the sidebar collapse? | P1 |
| G6 | Tooltips (e.g. on truncated names and titles) | P2 |

### Login
| # | State | Pri |
|---|---|---|
| L1 | Loading/redirecting state after clicking "Continue with Google" | P1 |
| L2 | OAuth error or cancelled sign-in, and how the error is displayed | P1 |
| L3 | Signed in but **not a member of any workspace**: where does the user land? (Links to S11.) | P0 |
| L4 | Domain restriction: can any Google account sign in, or only company domains? What is the rejected state? | P1 |
| L5 | Post-login redirect: always Home, or back to the originally requested URL? | P2 |
| L6 | Login screen in dark theme (card glow in dark) | P2 |
| L7 | Button hover/focus state | P2 |

### Home
| # | State | Pri |
|---|---|---|
| H1 | "Due soon" panel **with tasks** (row design) | P0 |
| H2 | "Waiting for your review" panel **with items** | P0 |
| H3 | Stat cards with non-zero values. Is "Overdue" highlighted red? | P1 |
| H4 | Greeting variants: "Good afternoon" / "Good evening" and their time cut-offs | P2 |
| H5 | Bar chart with no data at all | P2 |
| H6 | "Open tasks per person" when there are no unassigned tasks (is the footer hidden?) | P2 |

### Tasks board
| # | State | Pri |
|---|---|---|
| B1 | **Canceled column** (off-screen) and the Done column count (cut off) | P0 |
| B2 | **Drag-and-drop** (drag preview, drop target, reorder within a column?) | P0 |
| B3 | Search with results and with **no results** | P1 |
| B4 | Open state and options for each filter dropdown: Everyone, All labels, All clients | P1 |
| B5 | Inline "+ Add task" input state | P1 |
| B6 | Card hover/selected state | P1 |
| B7 | **Labels**: the "All labels" filter exists but no label appears on any card. What is a label, and how does it render? | P1 |
| B8 | Card with 3+ assignees (overflow "+N"?) | P2 |
| B9 | Card with a checklist completed (e.g. 2/2) — is it styled differently? | P2 |
| B10 | Card with multiple client pills (vs the "Multiple Clients" pseudo-client) | P2 |
| B11 | Card with no date range | P2 |

### Calendar
| # | State | Pri |
|---|---|---|
| C1 | **Column-width bug**: the grid columns are unequal and misaligned with the weekday headers (see `screen-inventory.md` §3). Should we replicate it exactly or fix it to an equal 7-column grid? **Decision needed.** | P0 |
| C2 | "+N more" expanded (popover or day view?) | P1 |
| C3 | The full month, including the days hidden behind horizontal scroll | P1 |
| C4 | Hover state of an entry; entry click target | P2 |
| C5 | Empty "No due date" panel | P2 |
| C6 | Months with 6 week rows | P2 |
| C7 | Week-start setting (Sun assumed) | P2 |

### Clients
| # | State | Pri |
|---|---|---|
| CL1 | The end of the list (the screenshot is cut off). Is there pagination or search? | P1 |
| CL2 | Empty state (no clients) | P1 |
| CL3 | Row hover; any row actions (edit, delete, colour change) | P1 |
| CL4 | Singular "1 doc" wording | P2 |

### Quick Capture
| # | State | Pri |
|---|---|---|
| Q1 | Options in the "From a meeting" select, and how each option changes parsing | P0 |
| Q2 | Enabled "Split into tasks" button; processing/loading state | P1 |
| Q3 | Parse failure / nothing to split | P2 |

### Settings
| # | State | Pri |
|---|---|---|
| ST1 | Create workspace: enabled state, success, and error (duplicate name?) | P1 |
| ST2 | Join workspace: invalid-code error, success. Why is the button enabled while the input is empty? | P1 |
| ST3 | Member management: invite, remove, change role. Is there an owner-only view? Nothing is visible. | P1 |
| ST4 | The full member list (cut off at Pradeep Chandran) | P2 |
| ST5 | Workspace rename/delete, if these exist for owners | P2 |

## 4. Unclear interactions and business rules

| # | Question | Pri |
|---|---|---|
| R1 | What exactly is a **change request**? Who creates it, who reviews it, what is "tasks you manage"? | P0 |
| R2 | The **overdue rule**: due date < today and status ∉ {Done, Canceled}? (Suggested by the Done cards showing past dates in muted text.) | P0 |
| R3 | What is the relationship between the **date range** (start–end) and the **due date**? Is the due date optional and independent? | P0 |
| R4 | **Permissions**: what can OWNER do that MEMBER cannot? | P0 |
| R5 | Are "All Clients" and "Multiple Clients" real client records or special values? | P1 |
| R6 | Client sort order is case-sensitive (BGauss before Battery Smart). Keep that or fix it? | P2 |
| R7 | What does search match (title only, or also comments and client)? | P1 |
| R8 | Are filters persisted in the URL or storage? | P2 |
| R9 | What counts as an "unread" inbox item, and how does it get marked read? | P1 |
| R10 | Bar-chart scaling: 19, 19, and 18 render at nearly the same length. Is it linear against the max? | P2 |
| R11 | **Locale and date formats**: "23 Sept" and "29/09/2026" are both used. Confirm en-GB and where each format is used. | P1 |
| R12 | How are avatar colours assigned (hashed from the user id?), and where do gradient avatars come from? | P2 |
| R13 | **Real-time updates**: do board and inbox changes appear live? | P2 |

## 5. Design tokens not derivable

The screenshots let us estimate these values, but not specify them exactly. We need the source values in `docs/design/tokens/` (CSS or a Figma export from the existing app):

- The exact colour palette (primary indigo, priority colours, client colours, muted greys, borders, tints)
- Font family (it looks like a geometric/grotesque sans such as Inter), the size scale, and weights
- Spacing, radius, and border widths; sidebar width; the max width of the content column
- The dark theme palette (see T1)
