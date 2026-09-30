// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { fakeServices, user } from '../../../tests/fakes/services.js';
import { HomeDashboard } from './HomeDashboard.jsx';

async function renderHome(services = fakeServices()) {
  const view = renderWithStores(<HomeDashboard />, { services });
  await act(async () => {
    await view.stores.session.getState().signIn();
    await view.stores.workspace.getState().load();
  });
  await act(async () => {}); // let the dashboard load settle
  return view;
}

describe('US-03 HomeDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-30T04:00:00Z')); // 09:30 Asia/Kolkata (TZ set by npm test)
  });
  afterEach(() => vi.useRealTimers());

  it('greets by time of day with the first name and the long date', async () => {
    await renderHome();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good morning, Rohit');
    expect(screen.getByText('Wednesday 30 September · here’s where things stand.')).toBeInTheDocument();
  });

  it('renders the five stat cards in reference order with their captions', async () => {
    await renderHome();
    const cards = screen.getAllByRole('article');
    expect(cards.map((c) => [within(c).getByRole('heading').textContent, c.textContent])).toEqual([
      ['My open tasks', 'My open tasks0Assigned to you'],
      ['Overdue', 'Overdue0Past their due date'],
      ['Due this week', 'Due this week0In the next 7 days'],
      ['Awaiting your review', 'Awaiting your review0Change requests'],
      ['Unread in inbox', 'Unread in inbox0Mentions, assignments, updates'],
    ]);
  });

  it('shows the empty panel copy', async () => {
    await renderHome();
    expect(within(screen.getByRole('region', { name: 'Due soon — assigned to you' })).getByText('Nothing overdue or due this week.')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Waiting for your review' })).getByText('No change requests on tasks you manage.')).toBeInTheDocument();
  });

  it('lists every status in board order, including zeros', async () => {
    await renderHome();
    const chart = screen.getByRole('region', { name: 'All tasks by status' });
    expect(within(chart).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Backlog1', 'To do2', 'In progress0', 'Testing & Validation0', 'Done0', 'Canceled0',
    ]);
  });

  it('shows people by count and the unassigned footer (singular)', async () => {
    await renderHome();
    const chart = screen.getByRole('region', { name: 'Open tasks per person' });
    expect(within(chart).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['N2', 'P1']);
    expect(within(chart).getByText('Plus 1 open task with nobody assigned.')).toBeInTheDocument();
  });

  it('pluralises the footer and hides it at zero', async () => {
    const services = fakeServices();
    services.tasks.stats.mockImplementation(async (_ws, groupBy) => (groupBy === 'status'
      ? { groupBy, total: 0, groups: [] }
      : { groupBy, total: 1, groups: [{ key: 'u1', count: 1, user: user('u1', 'N') }], unassignedCount: 3 }));
    const { unmount } = await renderHome(services);
    expect(screen.getByText('Plus 3 open tasks with nobody assigned.')).toBeInTheDocument();
    unmount();

    services.tasks.stats.mockImplementation(async (_ws, groupBy) => ({ groupBy, total: 0, groups: [], unassignedCount: 0 }));
    await renderHome(services);
    expect(screen.queryByText(/nobody assigned/)).toBeNull();
  });
});
