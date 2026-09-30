import { toClient, toDashboard, toLabel, toPage } from '../mappers/index.js';

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

export class QuickCaptureService {
  /** @param {import('../api/index.js').QuickCaptureApi} quickCaptureApi */
  constructor(quickCaptureApi) { this.quickCaptureApi = quickCaptureApi; }

  /** @returns {Promise<{ title: string }[]>} */
  async split(wsId, text, source) {
    const body = await this.quickCaptureApi.split(wsId, text, source);
    return body.data.drafts.map((d) => Object.freeze({ title: d.title }));
  }
}
