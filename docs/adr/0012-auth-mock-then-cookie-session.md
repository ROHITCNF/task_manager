# ADR-0012: Auth — a mock session now, an httpOnly cookie with Google OAuth later

- **Status:** Accepted for the mock phase (user decision, 2026-09-30). The target design is Proposed.
- **Date:** 2026-09-30

## Context

The login screen offers only "Continue with Google" (`login_light.png`). The user chose a mock login for now, with the real wiring later. The switch must not touch UI code.

## Decision

**Now (mock mode):**

- "Continue with Google" calls `AuthService`. When the config says mock, `AuthService` sends `POST /auth/mock-login`. MSW handles it and marks the fixture user as signed in (in-memory, persisted to `sessionStorage` so a reload keeps the session).
- `GET /auth/session` returns the user or 401. It is the single source of truth on app boot.
- `POST /auth/logout` clears the mock session.

**Target (live mode):**

- The backend runs the Google OAuth flow. "Continue with Google" becomes a **full-page navigation** to `GET /api/v1/auth/google/start?returnTo=…`. The backend sets an **httpOnly, Secure, SameSite=Lax cookie** (`dmt_session`) and redirects back.
- The frontend never sees a token. All requests use `credentials: 'include'`.
- The frontend and API are deployed **same-site** (for example `app.example.com` with `/api` proxied), which avoids third-party-cookie and CORS problems.
- If cross-site hosting is ever needed, the fallback is CORS with credentials plus `SameSite=None`. A bearer-token scheme would be a separate ADR.

**Switch mechanism:** config `VITE_AUTH_MODE=mock|google`. It is read by `AuthService` only. UI components call a single store action (`signIn`) and don't know which mode is active.

## Consequences

- There is no token in JavaScript, so an XSS attack can't steal the session. The trade-off is that CSRF protection is needed for mutations. SameSite=Lax covers most of it, and the backend should also require a custom header (e.g. `X-Requested-With`), which the HTTP client always sends.
- Signing in with a real Google account isn't possible until the backend exists. That is acceptable for UI parity work.
- `/auth/mock-login` must be absent from production builds of the backend.
- Gaps L1–L5 (loading, error, domain restriction, no-workspace landing, return URL) remain open for the live flow.
