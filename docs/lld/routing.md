# LLD — Routing and Boot (`src/app/`, `src/main.jsx`)

Implements HLD §5, ADR-0008, and ADR-0012.

## 1. Boot sequence (`src/main.jsx`)

1. `import { config } from './config'`.
2. If `config.apiMode === 'mock'`: `const { startMockWorker } = await import('./mocks/browser.js'); await startMockWorker();`. This is a dynamic import, so the mocks are tree-shaken out of live builds.
3. `const data = createDataLayer(config)`, then `const stores = createStores(data)` (in `src/app/stores.js`).
4. `applyTheme(stores.ui.getState().themePreference)`.
5. `createRoot(#root).render(<StoresProvider stores={stores}><RouterProvider router={router} /></StoresProvider>)`.
6. `stores.session.getState().bootstrap()` starts immediately. Until `phase !== 'unknown'`, the guards render `null`: there is no splash, because none is referenced (gap G1).

## 2. Route table (`src/app/router.jsx`)

Uses `createBrowserRouter`. Pages are `React.lazy`.

```
/login                → <PublicOnly>  → <PublicLayout>  → LoginPage
/                     → <RequireAuth> → <AppShell>      → HomePage           (index)
  /inbox                                                → InboxPage
  /tasks                                                → TasksPage
    :taskId                                             → TaskDetailPage (drawer via <Outlet/> inside the board screen)
  /calendar                                             → CalendarPage
  /docs                                                 → DocsPage
  /clients                                              → ClientsPage
  /quick-capture                                        → QuickCapturePage
  /settings                                             → SettingsPage
*                     → BlankPage (deferred S12)
```

- `RequireAuth`: if `phase === 'signedOut'`, `<Navigate to="/login" replace state={{ from: location }} />`.
- `PublicOnly`: if `phase === 'signedIn'`, `<Navigate to="/" replace />`. The `returnTo` behaviour is gap L5; for now it always goes to `/`.
- `AppShell`: the `Sidebar` feature plus `<main><Outlet/></main>`. After sign-in it calls `workspace.load()` once.
- `BlankPage` renders an empty `<main>` region. That is not invented UI, just an absence of UI.
- `/tasks/:taskId` is **not registered** until gap S3 is resolved.
- Nav active state uses `NavLink` (`end` for `/`).

## 3. Document titles

Titles are not visible in the references. Use `"<Page> · DMT"`, which is harmless and not visual UI.
