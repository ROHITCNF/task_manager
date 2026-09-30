/**
 * Data layer entry point (docs/lld/data-layer.md §8). The only symbol src/app imports from src/data.
 */
import { HttpClient } from './http/HttpClient.js';
import { AuthApi, ClientApi, DashboardApi, LabelApi, MeApi, QuickCaptureApi, TaskApi, WorkspaceApi } from './api/index.js';
import {
  AuthService, ClientService, DashboardService, LabelService, QuickCaptureService, TaskService, WorkspaceService,
} from './services/index.js';

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {{ fetchImpl?: typeof fetch, navigator?: { assign: (url: string) => void } }} [overrides]  for tests
 */
export function createDataLayer(config, { fetchImpl, navigator } = {}) {
  const http = new HttpClient({ baseUrl: config.apiBaseUrl, timeoutMs: config.requestTimeoutMs, fetchImpl });
  const meApi = new MeApi(http);

  return Object.freeze({
    auth: new AuthService(new AuthApi(http, config.apiBaseUrl), config, navigator),
    workspaces: new WorkspaceService(meApi, new WorkspaceApi(http)),
    tasks: new TaskService(new TaskApi(http)),
    dashboard: new DashboardService(new DashboardApi(http)),
    clients: new ClientService(new ClientApi(http)),
    labels: new LabelService(new LabelApi(http)),
    quickCapture: new QuickCaptureService(new QuickCaptureApi(http)),
  });
}

export * from './errors/index.js';
