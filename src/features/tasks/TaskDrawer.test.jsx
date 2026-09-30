// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { fakeServices, task } from '../../../tests/fakes/services.js';
import { TaskCard } from '../../components/domain/task.jsx';
import { TaskDrawer } from './TaskDrawer.jsx';

async function renderDrawer(services = fakeServices(), onClose = vi.fn()) {
  const view = renderWithStores(<TaskDrawer taskId="tsk_1" onClose={onClose} />, { path: '/tasks/tsk_1', services });
  await act(async () => {
    await view.stores.session.getState().signIn();
    await view.stores.workspace.getState().load();
    await view.stores.workspace.getState().loadMembers();
    await view.stores.clients.getState().load();
  });
  await act(async () => {});
  return { ...view, onClose };
}

describe('US-13 card hover status select', () => {
  it('is disabled without edit permission and does not open the card', async () => {
    const onOpen = vi.fn();
    const onStatusChange = vi.fn();
    renderWithStores(<TaskCard task={task('t1', 'backlog', { title: 'Card' })} today="2026-09-30" timeZone="Asia/Kolkata" onOpen={onOpen} onStatusChange={onStatusChange} />);
    const select = screen.getByRole('combobox', { name: 'Status of Card' });
    expect(select).toBeDisabled();
    expect(select).toHaveDisplayValue('Backlog');
    await userEvent.click(select);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('changes status when editable; clicking the title opens the card', async () => {
    const onOpen = vi.fn();
    const onStatusChange = vi.fn();
    const t = task('t1', 'backlog', { title: 'Card', permissions: { canEdit: true, canComment: true } });
    renderWithStores(<TaskCard task={t} today="2026-09-30" timeZone="Asia/Kolkata" onOpen={onOpen} onStatusChange={onStatusChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status of Card' }), 'done');
    expect(onStatusChange).toHaveBeenCalledWith(t, 'done');
    expect(onOpen).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Card' }));
    expect(onOpen).toHaveBeenCalledWith(t);
  });
});

describe('US-14 drawer — Details (read-only viewer)', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-09-30T08:30:00Z')); });
  afterEach(() => vi.useRealTimers());

  it('shows the header, created line, notice and read-only fields', async () => {
    await renderDrawer();
    const drawer = screen.getByRole('dialog', { name: 'Re: Intellicar Track Platform cleanup' });
    expect(within(drawer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Details' })).toHaveAttribute('aria-pressed', 'true');
    expect(drawer).toHaveTextContent('Created by Anantha Krishnan T G on 23 Sept, 19:56');
    expect(drawer).toHaveTextContent('Only the task’s creator and owners can change it. You can still comment.');
    expect(within(drawer).getByRole('button', { name: 'Ask to be assigned' })).toBeInTheDocument();
    expect(within(drawer).getByRole('heading', { level: 2, name: 'Re: Intellicar Track Platform cleanup' })).toBeInTheDocument();
    expect(within(drawer).getByRole('textbox', { name: 'Description' })).toHaveValue('CSM - NIRANJAN BALAJI.');
    expect(within(drawer).getByRole('combobox', { name: 'Status' })).toBeDisabled();
    expect(within(drawer).getByRole('combobox', { name: 'Priority' })).toHaveDisplayValue('High');
    expect(within(drawer).getByRole('textbox', { name: 'Start date' })).toHaveValue('23 Sept 2026');
    expect(within(drawer).getByRole('textbox', { name: 'End date' })).toHaveValue('28 Sept 2026');
    expect(within(drawer).getByRole('textbox', { name: 'Due date' })).toHaveAttribute('placeholder', 'Set due date');
    expect(drawer).toHaveTextContent('Subtasks');
  });

  it('shows one chip per member with assignees selected', async () => {
    await renderDrawer();
    const chips = within(screen.getByRole('group', { name: 'Assignees' })).getAllByRole('button');
    expect(chips.map((c) => [c.textContent, c.getAttribute('aria-pressed')])).toEqual([
      ['NNeeraj Bhattathiripad', 'false'], ['Anantha Krishnan T G', 'true'],
    ]);
    expect(chips[0]).toBeDisabled();
  });

  it('closes with the Close button, the scrim and Escape', async () => {
    const { onClose, container } = await renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(container.querySelector('[aria-hidden="true"]'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('US-14 drawer — editable viewer', () => {
  it('saves field changes with the task version and refreshes the board', async () => {
    const services = fakeServices();
    const base = await services.tasks.get('wsp_1', 'tsk_1');
    services.tasks.get.mockResolvedValue({ ...base, permissions: { canEdit: true, canComment: true } });
    await renderDrawer(services);
    expect(screen.queryByText(/Only the task’s creator/)).toBeNull();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Priority' }), 'low');
    expect(services.tasks.update).toHaveBeenCalledWith('wsp_1', expect.objectContaining({ id: 'tsk_1', version: 1 }), { priority: 'low' });
    await act(async () => {});
    expect(services.tasks.list).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /Neeraj Bhattathiripad/ }));
    expect(services.tasks.update).toHaveBeenLastCalledWith('wsp_1', expect.anything(), { assigneeIds: ['u2', 'u1'] });
  });
});

describe('US-15 drawer — History', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-09-30T08:45:00Z')); });
  afterEach(() => vi.useRealTimers());

  it('shows stages, the approximate note and referenced events only', async () => {
    const { services } = await renderDrawer();
    await userEvent.click(screen.getByRole('button', { name: 'History' }));
    await act(async () => {});
    expect(services.tasks.history).toHaveBeenCalledWith('wsp_1', 'tsk_1');
    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveTextContent('Stages');
    expect(drawer).toHaveTextContent('Backlog~6d 18h · now');
    expect(drawer).toHaveTextContent('23 Sept, 19:56 → now · 6d 18h so far');
    expect(drawer).toHaveTextContent('Status changes before history tracking started weren’t recorded, so this stage is approximate.');
    const events = within(drawer).getAllByRole('listitem').filter((li) => li.querySelector('p'));
    expect(events.map((li) => li.textContent)).toEqual([
      'AAnantha Krishnan T G created this task23 Sept, 19:56', // leading "A" = avatar initial
      'AAnantha Krishnan T G added subtask “test 1”24 Sept, 16:27',
      'AAnantha Krishnan T G changed the end date from 23 Sept 2026 to 28 Sept 202625 Sept, 12:21',
    ]);
  });
});
