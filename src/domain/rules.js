import { isOpen } from './status.js';

/**
 * Overdue: has a due date before today and is still open (gaps.md decision R2).
 * @param {{ dueDate: string|null, status: string }} task
 * @param {string} today LocalDate
 */
export const isOverdue = (task, today) => task.dueDate != null && task.dueDate < today && isOpen(task.status);

/** pluralise(1, 'task') → '1 task'; pluralise(2, 'task') → '2 tasks' */
export const pluralise = (n, singular, plural = `${singular}s`) => `${n} ${n === 1 ? singular : plural}`;

/** @param {number} hour 0–23 */
export function greetingFor(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const firstName = (name) => name.trim().split(/\s+/)[0] ?? '';
