/**
 * Composition root for state: wires data-layer services into the store factories (ADR-0005).
 * The only place that connects src/data to src/state.
 */
import {
  createSessionStore, createWorkspaceStore, createTasksStore, createTaskDetailStore, createCalendarStore, createClientsStore,
  createDashboardStore, createDocsStore, createInboxStore, createQuickCaptureStore, createUiStore,
} from '../state/index.js';
import { currentTimeZone, todayLocal } from '../domain/dates.js';
import { applyTheme as defaultApplyTheme } from './theme.js';

function safeLocalStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {ReturnType<typeof import('../data/index.js').createDataLayer>} data
 * @param {{ storage?: Storage|null, getTz?: () => string, now?: () => Date, applyTheme?: (pref: string) => void }} [env]
 */
export function createStores(data, env = {}) {
  const storage = env.storage === undefined ? safeLocalStorage() : env.storage;
  const getTz = env.getTz ?? currentTimeZone;
  const now = env.now ?? (() => new Date());
  const today = () => todayLocal(getTz(), now());

  /** Filled below; the callbacks only run after every store exists. */
  const stores = {};

  const resetWorkspaceScoped = () => {
    for (const name of ['tasks', 'taskDetail', 'calendar', 'clients', 'dashboard', 'quickCapture', 'inbox', 'docs']) stores[name].getState().reset();
  };
  const onUnauthenticated = () => stores.session.getState().handleUnauthenticated();
  const getWorkspaceId = () => stores.workspace.getState().currentId;
  const scoped = { getWorkspaceId, onUnauthenticated };

  stores.ui = createUiStore({ storage, applyTheme: env.applyTheme ?? defaultApplyTheme });
  stores.session = createSessionStore(data, {
    onSignedOut: () => {
      resetWorkspaceScoped();
      stores.workspace.getState().reset();
    },
  });
  stores.workspace = createWorkspaceStore(data, { storage, onUnauthenticated, onWorkspaceChanged: resetWorkspaceScoped });
  stores.tasks = createTasksStore(data, scoped);
  stores.calendar = createCalendarStore(data, { ...scoped, today });
  stores.clients = createClientsStore(data, scoped);
  stores.dashboard = createDashboardStore(data, { ...scoped, getTz });
  stores.quickCapture = createQuickCaptureStore(data, scoped);
  stores.inbox = createInboxStore(data, scoped);
  stores.docs = createDocsStore(data, scoped);
  stores.taskDetail = createTaskDetailStore(data, { ...scoped, onTaskChanged: () => stores.tasks.getState().loadBoard() });

  return Object.freeze(stores);
}
