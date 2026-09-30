// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { fakeServices, user } from '../../../tests/fakes/services.js';
import { InboxScreen } from './InboxScreen.jsx';

async function renderInbox(services = fakeServices()) {
  const view = renderWithStores(<InboxScreen />, { path: '/inbox', services });
  await act(async () => {
    await view.stores.session.getState().signIn();
    await view.stores.workspace.getState().load();
  });
  await act(async () => {});
  return view;
}

describe('US-12 Inbox', () => {
  it('shows the header controls with "All" selected and the empty state', async () => {
    await renderInbox();
    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Unread' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Notification settings' })).toBeEnabled();
    expect(screen.getByText('Nothing here yet. You’ll see @mentions, assignments, status changes on your tasks and due-date reminders here.')).toBeInTheDocument();
  });

  it('switches to Unread and requests unread items', async () => {
    const { services } = await renderInbox();
    await userEvent.click(screen.getByRole('button', { name: 'Unread' }));
    expect(screen.getByRole('button', { name: 'Unread' })).toHaveAttribute('aria-pressed', 'true');
    expect(services.inbox.list).toHaveBeenLastCalledWith('wsp_1', expect.objectContaining({ unread: true }));
  });

  it('enables "Mark all as read" when something is unread, and marks all', async () => {
    const services = fakeServices();
    services.inbox.list.mockResolvedValueOnce({
      items: [{ id: 'i1', kind: 'mention', read: false, createdAt: new Date(), actor: user('u1', 'N'), task: null, excerpt: null }],
      nextCursor: null,
    });
    await renderInbox(services);
    const button = screen.getByRole('button', { name: 'Mark all as read' });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(services.inbox.markAllRead).toHaveBeenCalledWith('wsp_1');
    expect(button).toBeDisabled();
  });
});
