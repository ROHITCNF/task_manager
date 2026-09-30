import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { createStores } from '../../src/app/stores.js';
import { StoresProvider } from '../../src/state/hooks.js';
import { fakeServices } from '../fakes/services.js';

/**
 * Renders UI inside real stores backed by fake services, at a route.
 * @param {import('react').ReactElement} ui
 * @param {{ path?: string, services?: ReturnType<typeof fakeServices>, routes?: object[] }} [opts]
 */
export function renderWithStores(ui, { path = '/', services = fakeServices(), routes } = {}) {
  const stores = createStores(services, { storage: null, getTz: () => 'Asia/Kolkata', now: () => new Date('2026-09-30T04:00:00Z'), applyTheme: vi.fn() });
  const router = createMemoryRouter(routes ?? [{ path: '*', element: ui }], { initialEntries: [path] });
  const result = render(<StoresProvider stores={stores}><RouterProvider router={router} /></StoresProvider>);
  return { ...result, stores, services, router };
}
