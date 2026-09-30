import { lazy } from 'react';
import { RequireAuth, PublicOnly } from './guards.jsx';
import { AppShell, PublicLayout } from './layouts.jsx';
import { Sidebar } from '../features/shell/Sidebar.jsx';

/**
 * Route table (docs/lld/routing.md §2). Pages are lazy-loaded; each story swaps its BlankPage
 * for the real page.
 */
const Blank = lazy(() => import('../pages/BlankPage.jsx'));
const LoginPage = lazy(() => import('../pages/LoginPage.jsx'));
const HomePage = lazy(() => import('../pages/HomePage.jsx'));
const TasksPage = lazy(() => import('../pages/TasksPage.jsx'));
const InboxPage = lazy(() => import('../pages/InboxPage.jsx'));
const TaskDetailPage = lazy(() => import('../pages/TaskDetailPage.jsx'));
const CalendarPage = lazy(() => import('../pages/CalendarPage.jsx'));
const ClientsPage = lazy(() => import('../pages/ClientsPage.jsx'));
const QuickCapturePage = lazy(() => import('../pages/QuickCapturePage.jsx'));
const SettingsPage = lazy(() => import('../pages/SettingsPage.jsx'));

export const routes = [
  {
    element: <PublicOnly />,
    children: [{ element: <PublicLayout />, children: [{ path: '/login', element: <LoginPage /> }] }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell sidebar={<Sidebar />} />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/inbox', element: <InboxPage /> },
          { path: '/tasks', element: <TasksPage />, children: [{ path: ':taskId', element: <TaskDetailPage /> }] },
          { path: '/calendar', element: <CalendarPage /> },
          { path: '/docs', element: <Blank /> }, // deferred: gap S2
          { path: '/clients', element: <ClientsPage /> },
          { path: '/quick-capture', element: <QuickCapturePage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Blank /> }, // deferred: gap S12
];
