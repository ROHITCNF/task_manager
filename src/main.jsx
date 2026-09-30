import '@fontsource-variable/geist/wght.css';
import './styles/tokens.css';
import './styles/base.css';

import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { config } from './config';
import { createDataLayer } from './data';
import { createStores } from './app/stores.js';
import { routes } from './app/routes.jsx';
import { applyTheme } from './app/theme.js';
import { StoresProvider } from './state/hooks.js';

async function boot() {
  // Compare import.meta.env directly (not config) so live builds drop the mocks chunk entirely (ADR-0006).
  if (import.meta.env.VITE_API_MODE !== 'live') {
    const { startMockWorker } = await import('./mocks/browser.js');
    await startMockWorker();
  }

  const stores = createStores(createDataLayer(config));
  applyTheme(stores.ui.getState().themePreference);
  stores.session.getState().bootstrap();

  createRoot(document.getElementById('root')).render(
    <StoresProvider stores={stores}>
      <RouterProvider router={createBrowserRouter(routes)} />
    </StoresProvider>,
  );
}

boot();
