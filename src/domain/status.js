/** Board order. */
export const TASK_STATUSES = Object.freeze(['backlog', 'todo', 'in_progress', 'testing_validation', 'done', 'canceled']);

export const STATUS_LABEL = Object.freeze({
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  testing_validation: 'Testing & Validation',
  done: 'Done',
  canceled: 'Canceled',
});

export const OPEN_STATUSES = Object.freeze(['backlog', 'todo', 'in_progress', 'testing_validation']);

/** Stage colour token per status (task history). Only Backlog is referenced (gap TD5). */
export const STATUS_TOKEN = Object.freeze({
  backlog: '--color-status-backlog',
  todo: '--color-status-todo',
  in_progress: '--color-status-in-progress',
  testing_validation: '--color-status-testing-validation',
  done: '--color-status-done',
  canceled: '--color-status-canceled',
});

/** @param {string} status */
export const isOpen = (status) => OPEN_STATUSES.includes(status);

/** @param {unknown} value */
export const isTaskStatus = (value) => TASK_STATUSES.includes(/** @type {string} */ (value));
