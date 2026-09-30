/**
 * Resource gateways (docs/lld/data-layer.md §5). They know endpoint paths and return raw DTO bodies.
 * Paths follow docs/lld/api/openapi.yaml.
 */

const ws = (wsId) => `/workspaces/${encodeURIComponent(wsId)}`;
const id = (value) => encodeURIComponent(value);

export class AuthApi {
  /** @param {import('../http/HttpClient.js').HttpClient} http @param {string} baseUrl */
  constructor(http, baseUrl) { this.http = http; this.baseUrl = baseUrl; }
  async getSession() { return (await this.http.get('/auth/session')).body; }
  async mockLogin(email) { return (await this.http.post('/auth/mock-login', email ? { email } : {})).body; }
  async logout() { await this.http.post('/auth/logout'); }
  /** Full-page navigation target for Google sign-in (not fetched). */
  googleStartUrl(returnTo) {
    const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    return `${this.baseUrl.replace(/\/$/, '')}/auth/google/start${query}`;
  }
}

export class MeApi {
  constructor(http) { this.http = http; }
  async getMe() { return (await this.http.get('/me')).body; }
  async listWorkspaces() { return (await this.http.get('/me/workspaces')).body; }
}

export class WorkspaceApi {
  constructor(http) { this.http = http; }
  async create(name) { return (await this.http.post('/workspaces', { name })).body; }
  async join(inviteCode) { return (await this.http.post('/workspaces/join', { inviteCode })).body; }
  async get(wsId) { return (await this.http.get(ws(wsId))).body; }
  async listMembers(wsId, { limit, cursor } = {}) {
    return (await this.http.get(`${ws(wsId)}/members`, { query: { limit, cursor } })).body;
  }
}

export class TaskApi {
  constructor(http) { this.http = http; }
  async list(wsId, query) { return (await this.http.get(`${ws(wsId)}/tasks`, { query })).body; }
  async stats(wsId, query) { return (await this.http.get(`${ws(wsId)}/tasks/stats`, { query })).body; }
  async get(wsId, taskId) { return (await this.http.get(`${ws(wsId)}/tasks/${id(taskId)}`)).body; }
  async create(wsId, dto) { return (await this.http.post(`${ws(wsId)}/tasks`, dto)).body; }
  async createBulk(wsId, dtos) { return (await this.http.post(`${ws(wsId)}/tasks/bulk`, { tasks: dtos })).body; }
  async update(wsId, taskId, patch, version) {
    return (await this.http.patch(`${ws(wsId)}/tasks/${id(taskId)}`, patch, { ifMatch: version })).body;
  }
  async remove(wsId, taskId, version) {
    await this.http.delete(`${ws(wsId)}/tasks/${id(taskId)}`, { ifMatch: version });
  }
}

export class DashboardApi {
  constructor(http) { this.http = http; }
  async get(wsId, tz) { return (await this.http.get(`${ws(wsId)}/dashboard`, { query: { tz } })).body; }
}

export class ClientApi {
  constructor(http) { this.http = http; }
  async list(wsId, { q, limit, cursor } = {}) {
    return (await this.http.get(`${ws(wsId)}/clients`, { query: { q, limit, cursor } })).body;
  }
  async create(wsId, dto) { return (await this.http.post(`${ws(wsId)}/clients`, dto)).body; }
  async update(wsId, clientId, patch, version) {
    return (await this.http.patch(`${ws(wsId)}/clients/${id(clientId)}`, patch, { ifMatch: version })).body;
  }
  async remove(wsId, clientId, version) {
    await this.http.delete(`${ws(wsId)}/clients/${id(clientId)}`, { ifMatch: version });
  }
}

export class LabelApi {
  constructor(http) { this.http = http; }
  async list(wsId) { return (await this.http.get(`${ws(wsId)}/labels`)).body; }
}

export class QuickCaptureApi {
  constructor(http) { this.http = http; }
  async split(wsId, text, source) {
    return (await this.http.post(`${ws(wsId)}/quick-capture/split`, { text, source })).body;
  }
}
