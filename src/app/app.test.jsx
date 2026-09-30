// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { setupMockServer, testConfig } from '../../tests/setup/mockServer.js';
import { createDataLayer } from '../data/index.js';
import { StoresProvider } from '../state/hooks.js';
import { createStores } from './stores.js';
import { routes } from './routes.jsx';
import { applyTheme } from './theme.js';

setupMockServer();

function renderApp(path) {
  const stores = createStores(createDataLayer(testConfig), { storage: null, getTz: () => 'Asia/Kolkata', applyTheme: vi.fn() });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<StoresProvider stores={stores}><RouterProvider router={router} /></StoresProvider>);
  return { stores, router };
}

describe('app wiring (real stores + data layer + MSW)', () => {
  it('redirects signed-out users to /login, then home after sign-in', async () => {
    const { stores, router } = renderApp('/tasks');
    await act(() => stores.session.getState().bootstrap());
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));

    await act(() => stores.session.getState().signIn());
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    await waitFor(() => expect(stores.workspace.getState().currentId).toBe('wsp_01J8Z000000000000000000001'));
  });

  it('loads the board through the real layers', async () => {
    const { stores } = renderApp('/');
    await act(() => stores.session.getState().signIn());
    await waitFor(() => expect(stores.workspace.getState().currentId).not.toBeNull());
    await act(() => stores.tasks.getState().loadBoard());
    expect(stores.tasks.getState().counts).toEqual({ backlog: 4, todo: 49, in_progress: 10, testing_validation: 0, done: 9, canceled: 1 });
  });

  it('signing out resets workspace-scoped data and returns to /login', async () => {
    const { stores, router } = renderApp('/');
    await act(() => stores.session.getState().signIn());
    await waitFor(() => expect(stores.workspace.getState().currentId).not.toBeNull());
    await act(() => stores.tasks.getState().loadBoard());
    await act(() => stores.session.getState().signOut());
    expect(stores.tasks.getState().counts.todo).toBe(0);
    expect(stores.workspace.getState().workspaces).toEqual([]);
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});

describe('applyTheme', () => {
  it('toggles .dark and follows the system preference', () => {
    const root = document.createElement('html');
    const listeners = new Set();
    const query = { matches: true, addEventListener: (_e, fn) => listeners.add(fn), removeEventListener: (_e, fn) => listeners.delete(fn) };
    const matchMedia = () => query;

    applyTheme('dark', { root, matchMedia });
    expect(root.classList.contains('dark')).toBe(true);
    applyTheme('light', { root, matchMedia });
    expect(root.classList.contains('dark')).toBe(false);

    applyTheme('system', { root, matchMedia });
    expect(root.classList.contains('dark')).toBe(true);
    query.matches = false;
    listeners.forEach((fn) => fn());
    expect(root.classList.contains('dark')).toBe(false);

    applyTheme('light', { root, matchMedia });
    expect(listeners.size).toBe(0);
  });
});
