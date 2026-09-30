export const PRIORITIES = Object.freeze(['urgent', 'high', 'medium', 'low', 'none']);

export const PRIORITY_LABEL = Object.freeze({
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
});

/** CSS custom property holding each priority's colour (docs/design/tokens/color.json). */
export const PRIORITY_TOKEN = Object.freeze({
  urgent: '--color-priority-urgent',
  high: '--color-priority-high',
  medium: '--color-priority-medium',
  low: '--color-priority-low',
  none: '--color-priority-none',
});

/** @param {unknown} value */
export const isPriority = (value) => PRIORITIES.includes(/** @type {string} */ (value));
