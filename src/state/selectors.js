/**
 * Pure selectors for derived data (docs/lld/state.md). Selectors that build new arrays are memoised
 * on their inputs so React subscriptions stay referentially stable.
 */
import { TASK_STATUSES, STATUS_LABEL } from '../domain/status.js';
import { monthGrid, parseLocalDate } from '../domain/dates.js';

/** Memoise a function on the identity of its arguments (last call only). */
function memoLast(fn) {
  let lastArgs = null;
  let lastResult;
  return (...args) => {
    if (lastArgs && args.length === lastArgs.length && args.every((a, i) => a === lastArgs[i])) return lastResult;
    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  };
}

// ── tasks (board) ──
const columnMemos = Object.fromEntries(TASK_STATUSES.map((s) => [s, memoLast((ids, byId) => ids.map((id) => byId[id]))]));

/** @returns {import('../domain/models.js').Task[]} */
export const selectColumnTasks = (status) => (s) => columnMemos[status](s.columns[status].ids, s.byId);
export const selectColumnCount = (status) => (s) => s.counts[status];

// ── dashboard ──
const withRatios = (rows) => {
  const max = Math.max(0, ...rows.map((r) => r.count));
  return rows.map((r) => ({ ...r, ratio: max ? r.count / max : 0 }));
};

/** "All tasks by status": every status in board order, zeros included. */
export const selectStatusBars = memoLast((byStatus) => {
  if (!byStatus) return [];
  const counts = Object.fromEntries(byStatus.groups.map((g) => [g.key, g.count]));
  return withRatios(TASK_STATUSES.map((key) => ({ key, label: STATUS_LABEL[key], count: counts[key] ?? 0 })));
});

/** "Open tasks per person", in server order (count desc). */
export const selectPersonBars = memoLast((byAssignee) => {
  if (!byAssignee) return [];
  return withRatios(byAssignee.groups.map((g) => ({ key: g.key, label: g.user?.name ?? g.key, count: g.count })));
});

// ── calendar ──
export const CALENDAR_ENTRIES_PER_DAY = 3;

/**
 * Month grid with up to 3 entries per day plus the overflow count.
 * @returns {{ date: string|null, day: number|null, entries: object[], more: number, isToday: boolean }[][]}
 */
export const selectCalendarWeeks = memoLast((month, byDate, today) =>
  monthGrid(month.year, month.month).map((week) => week.map((date) => {
    if (!date) return { date: null, day: null, entries: [], more: 0, isToday: false };
    const all = byDate[date] ?? [];
    return {
      date,
      day: parseLocalDate(date).day,
      entries: all.slice(0, CALENDAR_ENTRIES_PER_DAY),
      more: Math.max(0, all.length - CALENDAR_ENTRIES_PER_DAY),
      isToday: date === today,
    };
  })));
