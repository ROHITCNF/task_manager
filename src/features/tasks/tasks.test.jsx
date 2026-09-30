// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { fakeServices, task, user } from '../../../tests/fakes/services.js';
import { TaskCard } from '../../components/domain/task.jsx';
import { TasksScreen, SEARCH_DEBOUNCE_MS } from './TasksScreen.jsx';

async function renderScreen(services = fakeServices()) {
  const view = renderWithStores(<TasksScreen />, { path: '/tasks', services });
  await act(async () => {
    await view.stores.session.getState().signIn();
    await view.stores.workspace.getState().load();
  });
  await act(async () => {});
  return view;
}

describe('US-04 TaskCard variants', () => {
  const today = '2026-09-30';
  const tz = 'Asia/Kolkata';

  it('renders the full card anatomy', () => {
    const t = task('t1', 'todo', {
      title: 'Re: MrMed <> Intellicar', priority: 'urgent', startDate: '2026-09-29', endDate: '2026-09-29', dueDate: '2026-09-29',
      checklist: { done: 0, total: 3 }, commentCount: 1, clients: [{ id: 'c', name: 'Mr. Med', colour: '#ca3b76' }],
      createdBy: user('u1', 'Neeraj Bhattathiripad'), createdAt: new Date('2026-09-29T05:00:00Z'),
      assignees: [{ ...user('u2', 'Anantha'), avatarUrl: '/a.png' }],
    });
    renderWithStores(<TaskCard task={t} today={today} timeZone={tz} />);
    const card = screen.getByRole('article', { name: 'Re: MrMed <> Intellicar' });
    expect(card).toHaveTextContent('Urgent');
    expect(card).toHaveTextContent('29 Sept – 29 Sept');
    expect(within(card).getByText('Due 29/09/2026').className).toMatch(/overdue/);
    expect(within(card).getByLabelText('Checklist 0 of 3')).toHaveTextContent('0/3');
    expect(card).toHaveTextContent('1 comment');
    expect(card).toHaveTextContent('Mr. Med');
    expect(card).toHaveTextContent('by Neeraj Bhattathiripad · 29 Sept');
    expect(within(card).getByRole('img', { name: 'Anantha' })).toHaveAttribute('src', '/a.png');
  });

  it('hides optional parts and shows "?" when unassigned', () => {
    renderWithStores(<TaskCard task={task('t2', 'in_progress', { title: 'Bare' })} today={today} timeZone={tz} />);
    const card = screen.getByRole('article', { name: 'Bare' });
    expect(card).toHaveTextContent('No priority');
    expect(card).not.toHaveTextContent(/Due|comment|Checklist/);
    expect(within(card).getByRole('img', { name: 'Unassigned' })).toHaveTextContent('?');
  });

  it('does not colour past due dates on done tasks or today', () => {
    renderWithStores(
      <>
        <TaskCard task={task('d', 'done', { title: 'Done one', dueDate: '2026-09-24' })} today={today} timeZone={tz} />
        <TaskCard task={task('n', 'todo', { title: 'Due today', dueDate: '2026-09-30' })} today={today} timeZone={tz} />
      </>,
    );
    expect(screen.getByText('Due 24/09/2026').className).not.toMatch(/overdue/);
    expect(screen.getByText('Due 30/09/2026').className).not.toMatch(/overdue/);
  });
});

describe('US-04 board', () => {
  it('shows six columns with counts and cards in order', async () => {
    await renderScreen();
    const columns = screen.getAllByRole('region');
    expect(columns.map((c) => within(c).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Backlog', 'To do', 'In progress', 'Testing & Validation', 'Done', 'Canceled',
    ]);
    expect(within(columns[1]).getByText('2')).toBeInTheDocument();
    expect(within(columns[1]).getByRole('article', { name: 'Task t1' })).toBeInTheDocument();
    expect(within(columns[3]).queryAllByRole('article')).toHaveLength(0);
    expect(within(columns[3]).getByRole('button', { name: '+ Add task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ New task' })).toBeInTheDocument();
  });
});

describe('US-05 search and filters', () => {
  it('fills filter options from members, labels and clients', async () => {
    await renderScreen();
    const options = (name) => within(screen.getByRole('combobox', { name })).getAllByRole('option').map((o) => o.textContent);
    expect(options('Assignee')).toEqual(['Everyone', 'Neeraj Bhattathiripad', 'Anantha Krishnan T G']);
    expect(options('Label')).toEqual(['All labels', 'Firmware']);
    expect(options('Client')).toEqual(['All clients', 'Aeidith']);
  });

  it('debounces search and combines filters', async () => {
    const services = fakeServices();
    const { stores } = await renderScreen(services);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search tasks' }), 'can');
    expect(stores.tasks.getState().filters.q).toBe('');
    await waitFor(() => expect(stores.tasks.getState().filters.q).toBe('can'), { timeout: SEARCH_DEBOUNCE_MS * 3 });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Client' }), 'c1');
    await act(async () => {});
    expect(services.tasks.list).toHaveBeenLastCalledWith('wsp_1', expect.objectContaining({ q: 'can', clientId: ['c1'] }));
    expect(services.tasks.stats).toHaveBeenLastCalledWith('wsp_1', 'status', expect.objectContaining({ q: 'can', clientId: ['c1'] }));
  });
});
