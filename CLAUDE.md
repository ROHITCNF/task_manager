# CLAUDE.md

## Project

We are rebuilding an existing task management web app. The goal is a UI that matches the reference screenshots in `docs/design/reference/` exactly. We are not redesigning or improving it. When the screenshots and your own judgment disagree, the screenshots win.

## Source of truth: `docs/`

`docs/` defines what gets built. Before starting any task, read the docs that apply to it:

| Folder | Read it when |
|---|---|
| `docs/requirements/` | Always. Find the user story and its acceptance criteria. |
| `docs/design/reference/` | Building or changing anything visible. |
| `docs/design/tokens/` | Writing any styling. |
| `docs/hld/` | Touching module boundaries, data flow, or the stack. |
| `docs/lld/` | Implementing a specific component or module. |
| `docs/adr/` | Before any decision that one of these records may already cover. |

If the docs are missing, ambiguous, or contradict each other, stop and ask. Don't guess. If code and docs disagree, the docs are right, unless the user says to update the docs.

## Rules

1. **Read the spec first.** No work begins until you have read the relevant requirement, reference screenshot, and design docs. In your plan, cite the files you used.
2. **Never invent UI.** Build only elements, states, copy, icons, and interactions that appear in a reference screenshot or a spec. That includes "helpful" extras such as tooltips, empty states, loading spinners, animations, or extra buttons. If a state you need (e.g. error or empty) has no reference, ask instead of designing one.
3. **Use design tokens only.** Every colour, spacing value, font size, font weight, line height, radius, shadow, and breakpoint comes from `docs/design/tokens/`. No hardcoded hex/rgb values, and no raw px/rem values for spacing or type. If a value you need has no token, stop and flag it. Don't add a one-off value.
4. **Never modify tests to make them pass.** When a test fails, fix the code. If you believe the test itself is wrong, stop and explain why. Don't edit, skip, weaken, or delete it without explicit approval.
**Approved exception to rule 2 / pixel parity:** the Calendar uses an equal 7-column grid instead of the reference's misaligned columns (gap C1, decided 2026-09-30). Controls whose target screens are deferred render as in the reference but do nothing (see the decisions log in `docs/requirements/gaps.md`).

5. **One user story at a time.** Pick one story, implement it, and meet all of its acceptance criteria before starting another. Don't bundle unrelated changes or refactors into the same work.

## Workflow per user story

1. Identify the story in `docs/requirements/` and restate its acceptance criteria.
2. Read the matching reference screenshots, tokens, and HLD/LLD sections.
3. Propose a short plan that cites those files. Flag any gaps or conflicts.
4. Implement it, using tokens only.
5. Run the tests and compare the result against the reference screenshots.
6. Report what was done and which acceptance criteria are met, plus anything left open.

## Prompt log

Every task prompt goes into `docs/prompts/` as `NN-short-title.md`, numbered after the highest existing file. Each file records:

- the date
- the tool and model
- the prompt, verbatim, in a code block
- the files it produced
- brief notes on deviations or key findings

Write the entry in the same turn as the work.

## Tech stack

The full design is in `docs/hld/hld.md`. The decisions behind it are in `docs/adr/0001`–`0010`. All ADRs are accepted.

| Concern | Choice | ADR |
|---|---|---|
| Language / UI | React, plain JavaScript (JSDoc for types) | 0001 |
| Styling | Native HTML + our own CSS Modules. No component library. Primitives are kept shadcn/ui-ready in `src/components/ui/` | 0002, 0009 |
| Data layer | Pure JS classes in `src/data/`. No React or Zustand imports. Owns all HTTP and DTO → domain mapping | 0003 |
| UI layer | Pure React. Never calls HTTP and never imports `src/data/` | 0004 |
| State | Zustand, between the UI and the data layer. Services are injected into store factories | 0005 |
| Mocks | MSW. Switch with `VITE_API_MODE=mock\|live` and `VITE_API_BASE_URL` only | 0006 |
| Build | Vite | 0007 |
| Routing | React Router | 0008 |
| Tokens / theming | `docs/design/tokens/*.json` → generated `src/styles/tokens.css`; `.dark` class | 0009 |
| Testing | Vitest + React Testing Library + MSW; Playwright for E2E and visual parity | 0010 |
| API contract | REST `/api/v1`, OpenAPI at `docs/lld/api/openapi.yaml`, which is the source of truth for the backend and the MSW mocks | 0011 |
| Auth | Mock login now (`VITE_AUTH_MODE=mock`); target is Google OAuth with an httpOnly cookie | 0012 |

User stories live in `docs/requirements/user-stories.md` (US-01…US-11). Detailed designs are in `docs/lld/` (data-layer, state, components, routing, testing).

### Layer rules (short form; HLD §2 has the full table)

- `data/` must not import `react` or `zustand`, or any UI or state module.
- `components/`, `features/`, and `pages/` must not import `data/` or call `fetch`.
- Only `features/` (component tier 3) may access stores.
- Only `app/` wires the data layer into the stores.
- `mocks/` act as the server. They use the wire format and never import client mappers.
- Never edit `src/styles/tokens.css` by hand. Change `docs/design/tokens/` instead.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server in mock mode (MSW). Tokens are rebuilt first. |
| `npm run build` / `npm run preview` | Production build (live mode, `.env.production`) and a local preview of it |
| `npm test` | Vitest (unit, component, and integration), TZ=Asia/Kolkata |
| `npm run test:e2e` / `npm run test:visual` | Playwright (needs `npx playwright install chromium` once) |
| `npm run lint` | ESLint (layer boundaries, no `fetch` in UI/state) + Stylelint (tokens only) |
| `npm run tokens` | Regenerate `src/styles/tokens.css` from `docs/design/tokens/*.json`. It runs automatically before dev/build/test. |

Environment variables are documented in `.env.example`. Use `@/` for imports from `src/`.
