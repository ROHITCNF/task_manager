// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStores } from '../../../tests/setup/renderWithStores.jsx';
import { CalendarScreen } from './CalendarScreen.jsx';

async function renderCalendar() {
  const view = renderWithStores(<CalendarScreen />, { path: '/calendar' });
  await act(async () => {
    await view.stores.session.getState().signIn();
    await view.stores.workspace.getState().load();
  });
  await act(async () => {});
  return view;
}

describe('US-06 Calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-30T04:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('shows the month header and Sun-first grid with leading blanks', async () => {
    await renderCalendar();
    expect(screen.getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByText('September 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('2026-09-01')).toBeInTheDocument();
    expect(screen.getByLabelText('2026-09-30')).toBeInTheDocument();
    expect(screen.queryByLabelText('2026-10-01')).toBeNull();
  });

  it('shows up to three entries, then "+N more", and marks today', async () => {
    await renderCalendar();
    const day21 = screen.getByLabelText('2026-09-21');
    expect(within(day21).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['A', 'B', 'C']);
    expect(within(day21).getByText('+1 more')).toBeInTheDocument();
    const day30 = screen.getByLabelText('2026-09-30');
    expect(within(day30).getByText('30')).toHaveAttribute('aria-current', 'date');
  });

  it('lists tasks without a due date', async () => {
    await renderCalendar();
    expect(within(screen.getByRole('complementary', { name: 'No due date' })).getByText('No due')).toBeInTheDocument();
  });

  it('navigates months and returns with Today', async () => {
    const { services } = await renderCalendar();
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(services.tasks.listForMonth).toHaveBeenLastCalledWith('wsp_1', '2026-10-01', '2026-10-31');
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('August 2026')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByText('September 2026')).toBeInTheDocument();
  });
});
