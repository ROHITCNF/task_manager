# LLD — Testing

Implements HLD §9 and ADR-0010.

## 1. Commands (planned)

| Script | Runs |
|---|---|
| `npm test` | Vitest: domain, data, state, and component tests (colocated `*.test.js(x)`) |
| `npm run test:e2e` | Playwright: `tests/e2e/` against the Vite dev server (mock mode, port 4173) |
| `npm run test:visual` | Playwright: `tests/visual/` screenshot comparison against the references |
| `npm run lint` | ESLint (layer boundaries) and Stylelint (tokens only) |

## 2. Vitest setup

- Vitest config lives in the `test` block of `vite.config.js`.
- `environment: 'node'` is the default. Component tests add `// @vitest-environment jsdom` at the top of the file.
- `tests/setup/mockServer.js` exports `setupMockServer()`, which starts the MSW node server (`src/mocks/node.js`) for a test file with `onUnhandledRequest: 'error'` and resets the mock db after each test.
- `src/mocks/contract.test.js` validates every mock response body against `openapi.yaml` (Ajv 2020).
- Clock: `vi.setSystemTime(new Date('2026-09-30T04:00:00Z'))` (09:30 Asia/Kolkata, which gives "Good morning"). The TZ env is set to `Asia/Kolkata` in the test script.
- Store tests use hand-written fake services (`tests/fakes/`). They do not use MSW.

## 3. What each layer must cover

| Layer | Must cover |
|---|---|
| `domain/` | Every rule/formatter: overdue boundaries (due today is not overdue; done is never overdue), `'Sept'`, pluralisation, `monthGrid` (Sep 2026 starts on a Tuesday), greeting cut-offs |
| `data/http` | Query encoding, headers, `If-Match`, timeouts, each problem code → error class |
| `data/mappers` | A fixture DTO → domain for every type. An unknown enum throws. Missing arrays default. |
| `data/services` | Against MSW: pagination follow, filters passed through, 401 → `null` session |
| `state/` | Each action's status transitions, stale-response ignoring, reset rules, selectors |
| Tier 1–2 components | Every variant in `screen-inventory.md` (e.g. all 5 priority pills, 3 due-date states, 4 avatar kinds) |
| Features and pages | Integration with real stores + MSW: renders the fixture data, filters narrow the board, disabled/enabled buttons |

## 4. Visual parity (`tests/visual/`)

| Setting | Value |
|---|---|
| Browser | Chromium (Playwright's bundled version), in the pinned Playwright Docker image in CI |
| Viewport | **1720×950, deviceScaleFactor 2** (app screens) · **1908×948, DPR 1** (login) |
| Clock | `page.clock.setFixedTime('2026-09-30T04:00:00Z')`, timezone `Asia/Kolkata` |
| Data | MSW fixtures (screenshot data) |
| Comparison | `expect(page).toHaveScreenshot()` with the **reference PNG copied in as the baseline** (`tests/visual/__screenshots__/…`) |
| Threshold | `maxDiffPixelRatio: 0.02` to start, then tightened per screen as parity improves. The final numbers are recorded here. |
| Calendar | Compared with a **mask over the grid area** (approved deviation, gap C1). A separate baseline of our fixed grid is stored after the first review. |
| Fonts | Must be installed in the image (see the token open question on the font family) |

A visual test that fails is fixed in the code or the tokens. Changing the threshold or the baseline needs explicit approval (CLAUDE.md rule 4).

## 5. E2E flows (mock mode)

1. Signed out → `/tasks` → redirected to `/login` → Continue → lands on `/`.
2. Navigate through every nav item; the active state follows.
3. Board: type in search → the cards and counts update; pick a client → only that client's tasks remain.
4. Calendar: › → October 2026; Today → September 2026.
5. Settings: create a workspace → its name appears as the subtitle; join with the code `DEMO-123` → it is added to the list.
6. Sign out → `/login`.
