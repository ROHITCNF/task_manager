// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { fakeServices } from '../../../tests/fakes/services.js';
import { ClientsScreen } from './ClientsScreen.jsx';

describe('US-07 Clients', () => {
  it('lists clients with dot, name and pluralised counts in server order', async () => {
    const services = fakeServices();
    services.clients.list.mockResolvedValue({
      items: [
        { id: 'c1', name: 'Aeidith', colour: '#4ca154', taskCount: 1, docCount: 0 },
        { id: 'c2', name: 'BGauss', colour: '#d9622b', taskCount: 6, docCount: 1 },
      ],
      nextCursor: null,
    });
    const view = renderWithStores(<ClientsScreen />, { path: '/clients', services });
    await act(async () => {
      await view.stores.session.getState().signIn();
      await view.stores.workspace.getState().load();
    });
    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1, name: 'Clients' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add client' })).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((r) => r.getAttribute('aria-label'))).toEqual(['Aeidith', 'BGauss']);
    expect(within(rows[0]).getByText('1 task')).toBeInTheDocument();
    expect(within(rows[0]).getByText('0 docs')).toBeInTheDocument();
    expect(within(rows[1]).getByText('6 tasks')).toBeInTheDocument();
    expect(within(rows[1]).getByText('1 doc')).toBeInTheDocument();
    expect(rows[1].querySelector('[style]').style.getPropertyValue('--dot-colour')).toBe('#d9622b');
  });
});
