import { formatDateYear } from './dates.js';
import { PRIORITY_LABEL } from './priority.js';
import { STATUS_LABEL } from './status.js';

const FIELD_LABEL = Object.freeze({
  title: 'title',
  description: 'description',
  priority: 'priority',
  status: 'status',
  startDate: 'start date',
  endDate: 'end date',
  dueDate: 'due date',
});

const DATE_FIELDS = new Set(['startDate', 'endDate', 'dueDate']);

function formatValue(field, value) {
  if (value == null || value === '') return 'none';
  if (DATE_FIELDS.has(field)) return formatDateYear(value);
  if (field === 'priority') return PRIORITY_LABEL[value] ?? value;
  if (field === 'status') return STATUS_LABEL[value] ?? value;
  return value;
}

/**
 * Action text for a history event, following card_click_state_history_light.png:
 * "created this task", "added subtask “test 1”", "changed the end date from 23 Sept 2026 to 28 Sept 2026".
 * Returns null for event types without a reference (gap TD4) so the UI skips them.
 * @param {{ type: string, subtaskTitle?: string, field?: string, from?: string|null, to?: string|null }} event
 */
export function describeEvent(event) {
  switch (event.type) {
    case 'created':
      return 'created this task';
    case 'subtask_added':
      return `added subtask “${event.subtaskTitle}”`;
    case 'field_changed': {
      const label = FIELD_LABEL[event.field];
      if (!label) return null;
      return `changed the ${label} from ${formatValue(event.field, event.from)} to ${formatValue(event.field, event.to)}`;
    }
    default:
      return null;
  }
}
