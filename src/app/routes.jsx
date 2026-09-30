import { lazy } from 'react';
import { RequireAuth, PublicOnly } from './guards.jsx';
import { AppShell, PublicLayout } from './layouts.jsx';

/**
 * Route table (docs/lld/routing.md §2). Pages are lazy-loaded; each story swaps its BlankPage
 * for the real page.
 */
const Blank = lazy(() => import('../pages/BlankPage.jsx'));

export const routes = [
  {
    element: <PublicOnly />,
    children: [{ element: <PublicLayout />, children: [{ path: '/login', element: <Blank /> }] }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Blank /> },
          { path: '/inbox', element: <Blank /> }, // deferred: gap S1
          { path: '/tasks', element: <Blank /> },
          { path: '/calendar', element: <Blank /> },
          { path: '/docs', element: <Blank /> }, // deferred: gap S2
          { path: '/clients', element: <Blank /> },
          { path: '/quick-capture', element: <Blank /> },
          { path: '/settings', element: <Blank /> },
        ],
      },
    ],
  },
  { path: '*', element: <Blank /> }, // deferred: gap S12
];
