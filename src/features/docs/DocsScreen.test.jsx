// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { DocsScreen } from './DocsScreen.jsx';

describe('US-16 Docs list', () => {
  it('shows the header buttons and one row per doc title in server order', async () => {
    const view = renderWithStores(<DocsScreen />, { path: '/docs' });
    await act(async () => {
      await view.stores.session.getState().signIn();
      await view.stores.workspace.getState().load();
    });
    await act(async () => {});
    expect(screen.getByRole('heading', { level: 1, name: 'Docs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload document' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ New doc' })).toBeInTheDocument();
    const rows = within(screen.getByRole('list', { name: 'Documents' })).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual(['Untitled', 'image (1)', 'Test1']);
    expect(view.services.docs.list).toHaveBeenCalledWith('wsp_1', expect.objectContaining({ limit: 50 }));
  });
});
