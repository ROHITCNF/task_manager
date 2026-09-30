import { describe, expect, it } from 'vitest';
import {
  TASK_STATUSES, STATUS_LABEL, isOpen,
  PRIORITY_LABEL, PRIORITY_TOKEN,
  formatShort, formatNumeric, formatLong, formatMonthYear, formatInstantShort,
  todayLocal, hourIn, addDays, addMonths, monthRange, monthGrid,
  isOverdue, pluralise, greetingFor, firstName,
  initialOf, avatarToken,
} from './index.js';

describe('status', () => {
  it('keeps board order and labels from the reference', () => {
    expect(TASK_STATUSES).toEqual(['backlog', 'todo', 'in_progress', 'testing_validation', 'done', 'canceled']);
    expect(TASK_STATUSES.map((s) => STATUS_LABEL[s])).toEqual(['Backlog', 'To do', 'In progress', 'Testing & Validation', 'Done', 'Canceled']);
  });
  it('treats done and canceled as closed', () => {
    expect(isOpen('testing_validation')).toBe(true);
    expect(isOpen('done')).toBe(false);
    expect(isOpen('canceled')).toBe(false);
  });
});

describe('priority', () => {
  it('labels "none" as "No priority" and maps tokens', () => {
    expect(PRIORITY_LABEL.none).toBe('No priority');
    expect(PRIORITY_TOKEN.urgent).toBe('--color-priority-urgent');
  });
});

describe('dates', () => {
  it('formats like the reference', () => {
    expect(formatShort('2026-09-23')).toBe('23 Sept');
    expect(formatShort('2026-09-01')).toBe('1 Sept');
    expect(formatNumeric('2026-09-29')).toBe('29/09/2026');
    expect(formatLong('2026-09-30')).toBe('Wednesday 30 September');
    expect(formatMonthYear(2026, 9)).toBe('September 2026');
  });

  it('computes today and hour in a timezone', () => {
    const now = new Date('2026-09-29T20:00:00Z'); // 01:30 on the 30th in Kolkata
    expect(todayLocal('Asia/Kolkata', now)).toBe('2026-09-30');
    expect(todayLocal('UTC', now)).toBe('2026-09-29');
    expect(hourIn('Asia/Kolkata', now)).toBe(1);
    expect(formatInstantShort(new Date('2026-09-23T05:00:00Z'), 'Asia/Kolkata')).toBe('23 Sept');
  });

  it('does date arithmetic across month and year edges', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(monthRange(2026, 2)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('builds a Sunday-first grid (September 2026 starts on a Tuesday)', () => {
    const weeks = monthGrid(2026, 9);
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([null, null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']);
    expect(weeks[4]).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', null, null, null]);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});

describe('rules', () => {
  const today = '2026-09-30';
  it('isOverdue: due before today and open only', () => {
    expect(isOverdue({ dueDate: '2026-09-29', status: 'todo' }, today)).toBe(true);
    expect(isOverdue({ dueDate: '2026-09-30', status: 'todo' }, today)).toBe(false);
    expect(isOverdue({ dueDate: '2026-09-24', status: 'done' }, today)).toBe(false);
    expect(isOverdue({ dueDate: '2026-09-24', status: 'canceled' }, today)).toBe(false);
    expect(isOverdue({ dueDate: null, status: 'todo' }, today)).toBe(false);
  });
  it('pluralises', () => {
    expect(pluralise(1, 'task')).toBe('1 task');
    expect(pluralise(0, 'doc')).toBe('0 docs');
    expect(pluralise(2, 'comment')).toBe('2 comments');
  });
  it('greets by hour', () => {
    expect(greetingFor(0)).toBe('Good morning');
    expect(greetingFor(11)).toBe('Good morning');
    expect(greetingFor(12)).toBe('Good afternoon');
    expect(greetingFor(17)).toBe('Good evening');
  });
  it('takes the first name', () => {
    expect(firstName('Rohit Srivastava')).toBe('Rohit');
    expect(firstName('  ASWIN ')).toBe('ASWIN');
  });
});

describe('avatar', () => {
  it('derives the initial', () => {
    expect(initialOf('neeraj')).toBe('N');
    expect(initialOf('')).toBe('?');
  });
  it('maps ids to a stable palette token 1–9', () => {
    expect(avatarToken('usr_01J8Z00100000000000000000J')).toBe('--color-avatar-1');
    expect(avatarToken('usr_01J8Z00E000000000000000006')).toBe('--color-avatar-9');
    expect(avatarToken('usr_01J8Z00F000000000000000006')).toBe('--color-avatar-12');
    expect(avatarToken('x')).toBe(avatarToken('x'));
  });
});

describe('task drawer formats and history wording', async () => {
  const { formatDateYear, formatInstantDateTime, formatDuration, describeEvent } = await import('./index.js');

  it('formats dates, date-times and durations like the references', () => {
    expect(formatDateYear('2026-09-23')).toBe('23 Sept 2026');
    expect(formatInstantDateTime(new Date('2026-09-23T14:26:00Z'), 'Asia/Kolkata')).toBe('23 Sept, 19:56');
    const sixDays18h = ((6 * 24) + 18) * 3600e3 + 25 * 60e3;
    expect(formatDuration(sixDays18h)).toBe('6d 18h');
    expect(formatDuration(5 * 3600e3)).toBe('5h');
    expect(formatDuration(12 * 60e3)).toBe('12m');
  });

  it('describes the referenced event types and skips unknown ones', () => {
    expect(describeEvent({ type: 'created' })).toBe('created this task');
    expect(describeEvent({ type: 'subtask_added', subtaskTitle: 'test 1' })).toBe('added subtask “test 1”');
    expect(describeEvent({ type: 'field_changed', field: 'endDate', from: '2026-09-23', to: '2026-09-28' }))
      .toBe('changed the end date from 23 Sept 2026 to 28 Sept 2026');
    expect(describeEvent({ type: 'field_changed', field: 'priority', from: 'low', to: 'high' })).toBe('changed the priority from Low to High');
    expect(describeEvent({ type: 'mystery' })).toBeNull();
  });
});
