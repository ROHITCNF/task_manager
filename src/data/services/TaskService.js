import { fromTaskDraft, toCalendarTask, toPage, toTask, toTaskQuery, toTaskStats } from '../mappers/index.js';

/**
 * @typedef {{ status?: string[], statusGroup?: 'open'|'closed', assigneeId?: string[], unassigned?: boolean,
 *   clientId?: string[], labelId?: string[], q?: string, dueFrom?: string, dueTo?: string,
 *   hasDueDate?: boolean, view?: 'card'|'calendar'|'full', sort?: string, limit?: number, cursor?: string }} TaskQuery
 */

const CALENDAR_PAGE_LIMIT = 200;
const MAX_CALENDAR_PAGES = 10;

export class TaskService {
  /** @param {import('../api/index.js').TaskApi} taskApi */
  constructor(taskApi) {
    this.taskApi = taskApi;
  }

  /** @param {TaskQuery} query */
  async list(wsId, query = {}) {
    const envelope = await this.taskApi.list(wsId, toTaskQuery({ view: 'card', ...query }));
    return toPage(envelope, toTask);
  }

  /** All tasks due within [fromDate, toDate], following cursors (bounded). */
  async listForMonth(wsId, fromDate, toDate) {
    return this.collectCalendar(wsId, { dueFrom: fromDate, dueTo: toDate, sort: 'dueDate' });
  }

  async listWithoutDueDate(wsId) {
    return this.collectCalendar(wsId, { hasDueDate: false });
  }

  /** @param {'status'|'assignee'} groupBy @param {TaskQuery} [query] */
  async stats(wsId, groupBy, query = {}) {
    const body = await this.taskApi.stats(wsId, { groupBy, ...toTaskQuery(query) });
    return toTaskStats(body.data);
  }

  /** Sends task.version as If-Match. */
  async update(wsId, task, patch) {
    const body = await this.taskApi.update(wsId, task.id, patch, task.version);
    return toTask(body.data);
  }

  async createBulk(wsId, drafts) {
    const body = await this.taskApi.createBulk(wsId, drafts.map(fromTaskDraft));
    return body.data.map(toTask);
  }

  /** @private */
  async collectCalendar(wsId, query) {
    const items = [];
    let cursor;
    for (let page = 0; page < MAX_CALENDAR_PAGES; page += 1) {
      const envelope = await this.taskApi.list(wsId, toTaskQuery({ ...query, view: 'calendar', limit: CALENDAR_PAGE_LIMIT, cursor }));
      items.push(...envelope.data.map(toCalendarTask));
      cursor = envelope.meta?.nextCursor;
      if (!cursor) break;
    }
    return items;
  }
}
