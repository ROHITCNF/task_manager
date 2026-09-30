// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { Sidebar } from './Sidebar.jsx';

async function renderSignedIn(path = '/') {
  const view = renderWithStores(<Sidebar />, { path });
  await act(async () => {
    await view.stores.session.getState().signIn();
    await view.stores.workspace.getState().load();
  });
  return view;
}

describe('US-02 Sidebar', () => {
  it('shows the workspace, email and Sign out', async () => {
    await renderSignedIn();
    expect(screen.getByRole('button', { name: 'Workspace DMT' })).toHaveTextContent('DMT');
    expect(screen.getByText('r@x')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('lists the eight nav items in reference order', async () => {
    await renderSignedIn();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Home', '/'], ['Inbox', '/inbox'], ['Tasks', '/tasks'], ['Calendar', '/calendar'],
      ['Docs', '/docs'], ['Clients', '/clients'], ['Quick Capture', '/quick-capture'], ['Settings', '/settings'],
    ]);
  });

  it('marks only the current route active (Home matches "/" exactly)', async () => {
    await renderSignedIn('/tasks');
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('theme toggle defaults to Light and persists changes through the ui store', async () => {
    const { stores } = await renderSignedIn();
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: 'System' }));
    expect(stores.ui.getState().themePreference).toBe('system');
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
  });

  it('Sign out ends the session', async () => {
    const { stores, services } = await renderSignedIn();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(stores.session.getState().phase).toBe('signedOut'));
    expect(services.auth.signOut).toHaveBeenCalled();
  });
});
