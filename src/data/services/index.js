import { toClient, toDashboard, toInboxItem, toLabel, toPage } from '../mappers/index.js';

export { AuthService } from './AuthService.js';
export { WorkspaceService } from './WorkspaceService.js';
export { TaskService } from './TaskService.js';

export class DashboardService {
  /** @param {import('../api/index.js').DashboardApi} dashboardApi */
  constructor(dashboardApi) { this.dashboardApi = dashboardApi; }

  async get(wsId, tz) {
    const body = await this.dashboardApi.get(wsId, tz);
    return toDashboard(body.data);
  }
}

export class ClientService {
  /** @param {import('../api/index.js').ClientApi} clientApi */
  constructor(clientApi) { this.clientApi = clientApi; }

  async list(wsId, { cursor, limit, q } = {}) {
    return toPage(await this.clientApi.list(wsId, { cursor, limit, q }), toClient);
  }
}

export class LabelService {
  /** @param {import('../api/index.js').LabelApi} labelApi */
  constructor(labelApi) { this.labelApi = labelApi; }

  async list(wsId) {
    const body = await this.labelApi.list(wsId);
    return body.data.map(toLabel);
  }
}

export class InboxService {
  /** @param {import('../api/index.js').InboxApi} inboxApi */
  constructor(inboxApi) { this.inboxApi = inboxApi; }

  /** @param {{ unread?: boolean, cursor?: string, limit?: number }} [opts] */
  async list(wsId, { unread, cursor, limit } = {}) {
    return toPage(await this.inboxApi.list(wsId, { unread: unread || undefined, cursor, limit }), toInboxItem);
  }

  async markAllRead(wsId) {
    await this.inboxApi.readAll(wsId);
  }
}

export class QuickCaptureService {
  /** @param {import('../api/index.js').QuickCaptureApi} quickCaptureApi */
  constructor(quickCaptureApi) { this.quickCaptureApi = quickCaptureApi; }

  /** @returns {Promise<{ title: string }[]>} */
  async split(wsId, text, source) {
    const body = await this.quickCaptureApi.split(wsId, text, source);
    return body.data.drafts.map((d) => Object.freeze({ title: d.title }));
  }
}
