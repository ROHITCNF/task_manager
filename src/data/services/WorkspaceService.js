import { toMember, toPage, toWorkspace } from '../mappers/index.js';

export class WorkspaceService {
  /**
   * @param {import('../api/index.js').MeApi} meApi
   * @param {import('../api/index.js').WorkspaceApi} workspaceApi
   */
  constructor(meApi, workspaceApi) {
    this.meApi = meApi;
    this.workspaceApi = workspaceApi;
  }

  async listMine() {
    const body = await this.meApi.listWorkspaces();
    return body.data.map(toWorkspace);
  }

  async create(name) {
    const body = await this.workspaceApi.create(name.trim());
    return toWorkspace(body.data);
  }

  async join(inviteCode) {
    const body = await this.workspaceApi.join(inviteCode.trim());
    return toWorkspace(body.data);
  }

  /** @returns {Promise<import('../../domain/models.js').Page<import('../../domain/models.js').Member>>} */
  async listMembers(wsId, { cursor, limit } = {}) {
    return toPage(await this.workspaceApi.listMembers(wsId, { cursor, limit }), toMember);
  }
}
