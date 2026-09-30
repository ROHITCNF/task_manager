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

/** @param {string} status */
export const isOpen = (status) => OPEN_STATUSES.includes(status);

/** @param {unknown} value */
export const isTaskStatus = (value) => TASK_STATUSES.includes(/** @type {string} */ (value));
