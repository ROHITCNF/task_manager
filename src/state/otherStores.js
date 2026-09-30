import { createStore } from 'zustand/vanilla';
import { addMonths, monthRange, parseLocalDate } from '../domain/dates.js';
import { IDLE, LOADING, SUCCESS, createRequestTracker, toFailure } from './request.js';

const CLIENTS_PAGE = 50;

/**
 * Calendar month view (US-06).
 * @param {{ tasks: import('../data/services/TaskService.js').TaskService }} services
 * @param {{ getWorkspaceId: () => string|null, today: () => string, onUnauthenticated?: () => void }} deps
 */
export function createCalendarStore({ tasks }, deps) {
  const tracker = createRequestTracker();
  const currentMonth = () => {
    const { year, month } = parseLocalDate(deps.today());
    return { year, month };
  };
  const initial = () => ({ month: currentMonth(), byDate: {}, noDueDate: [], req: IDLE });

  return createStore((set, get) => ({
    ...initial(),

    async load() {
      const wsId = deps.getWorkspaceId();
      if (!wsId) return;
      const { year, month } = get().month;
      const { from, to } = monthRange(year, month);
      const isCurrent = tracker.start('month');
      set({ req: LOADING });
      try {
        const [inMonth, noDueDate] = await Promise.all([tasks.listForMonth(wsId, from, to), tasks.listWithoutDueDate(wsId)]);
        if (!isCurrent()) return;
        const byDate = {};
        for (const t of inMonth) (byDate[t.dueDate] ??= []).push(t);
        set({ byDate, noDueDate, req: SUCCESS });
      } catch (error) {
        if (isCurrent()) set({ req: toFailure(error, deps) });
      }
    },

    prev() { set((s) => ({ month: addMonths(s.month, -1) })); return get().load(); },
    next() { set((s) => ({ month: addMonths(s.month, 1) })); return get().load(); },
    goToday() { set({ month: currentMonth() }); return get().load(); },

    reset() { tracker.invalidateAll(); set(initial()); },
  }));
}

/**
 * Clients list (US-07).
 * @param {{ clients: import('../data/services/index.js').ClientService }} services
 * @param {{ getWorkspaceId: () => string|null, onUnauthenticated?: () => void }} deps
 */
export function createClientsStore({ clients }, deps) {
  const tracker = createRequestTracker();
  const initial = () => ({ items: [], nextCursor: null, req: IDLE });

  return createStore((set, get) => ({
    ...initial(),

    async load({ more = false } = {}) {
      const wsId = deps.getWorkspaceId();
      const { nextCursor, req } = get();
      if (!wsId || (more && (!nextCursor || req.status === 'loading'))) return;
      const isCurrent = tracker.start('clients');
      set({ req: LOADING });
      try {
        const page = await clients.list(wsId, { cursor: more ? nextCursor : undefined, limit: CLIENTS_PAGE });
        if (!isCurrent()) return;
        set((s) => ({ items: more ? [...s.items, ...page.items] : page.items, nextCursor: page.nextCursor, req: SUCCESS }));
      } catch (error) {
        if (isCurrent()) set({ req: toFailure(error, deps) });
      }
    },

    loadMore() { return get().load({ more: true }); },

    reset() { tracker.invalidateAll(); set(initial()); },
  }));
}

/**
 * Home dashboard (US-03).
 * @param {{ dashboard: import('../data/services/index.js').DashboardService, tasks: import('../data/services/TaskService.js').TaskService }} services
 * @param {{ getWorkspaceId: () => string|null, getTz: () => string, onUnauthenticated?: () => void }} deps
 */
export function createDashboardStore({ dashboard, tasks }, deps) {
  const tracker = createRequestTracker();
  const initial = () => ({ dashboard: null, byStatus: null, byAssignee: null, req: IDLE });

  return createStore((set) => ({
    ...initial(),

    async load() {
      const wsId = deps.getWorkspaceId();
      if (!wsId) return;
      const isCurrent = tracker.start('dashboard');
      set({ req: LOADING });
      try {
        const [summary, byStatus, byAssignee] = await Promise.all([
          dashboard.get(wsId, deps.getTz()),
          tasks.stats(wsId, 'status'),
          tasks.stats(wsId, 'assignee', { statusGroup: 'open' }),
        ]);
        if (isCurrent()) set({ dashboard: summary, byStatus, byAssignee, req: SUCCESS });
      } catch (error) {
        if (isCurrent()) set({ req: toFailure(error, deps) });
      }
    },

    reset() { tracker.invalidateAll(); set(initial()); },
  }));
}

/**
 * Quick Capture (US-08). Drafts are stored but not rendered yet (gap S6).
 * @param {{ quickCapture: import('../data/services/index.js').QuickCaptureService }} services
 * @param {{ getWorkspaceId: () => string|null, onUnauthenticated?: () => void }} deps
 */
export function createQuickCaptureStore({ quickCapture }, deps) {
  const initial = () => ({ drafts: [], req: IDLE });

  return createStore((set) => ({
    ...initial(),

    async split(text, source) {
      const wsId = deps.getWorkspaceId();
      if (!wsId || !text?.trim()) return;
      set({ req: LOADING });
      try {
        set({ drafts: await quickCapture.split(wsId, text, source), req: SUCCESS });
      } catch (error) {
        set({ req: toFailure(error, deps) });
      }
    },

    reset() { set(initial()); },
  }));
}

const INBOX_PAGE = 50;

/**
 * Inbox (US-12): All/Unread filter, paged items, mark all as read.
 * @param {{ inbox: import('../data/services/index.js').InboxService }} services
 * @param {{ getWorkspaceId: () => string|null, onUnauthenticated?: () => void }} deps
 */
export function createInboxStore({ inbox }, deps) {
  const tracker = createRequestTracker();
  const initial = () => ({ filter: 'all', items: [], nextCursor: null, req: IDLE, markAllReq: IDLE });

  return createStore((set, get) => ({
    ...initial(),

    async load({ more = false } = {}) {
      const wsId = deps.getWorkspaceId();
      const { filter, nextCursor, req } = get();
      if (!wsId || (more && (!nextCursor || req.status === 'loading'))) return;
      const isCurrent = tracker.start('inbox');
      set({ req: LOADING });
      try {
        const page = await inbox.list(wsId, { unread: filter === 'unread', cursor: more ? nextCursor : undefined, limit: INBOX_PAGE });
        if (!isCurrent()) return;
        set((s) => ({ items: more ? [...s.items, ...page.items] : page.items, nextCursor: page.nextCursor, req: SUCCESS }));
      } catch (error) {
        if (isCurrent()) set({ req: toFailure(error, deps) });
      }
    },

    /** @param {'all'|'unread'} filter */
    setFilter(filter) {
      if (filter === get().filter) return undefined;
      set({ filter, items: [], nextCursor: null });
      return get().load();
    },

    async markAllRead() {
      const wsId = deps.getWorkspaceId();
      if (!wsId || get().markAllReq.status === 'loading') return;
      set({ markAllReq: LOADING });
      try {
        await inbox.markAllRead(wsId);
        set({ markAllReq: SUCCESS });
        await get().load();
      } catch (error) {
        set({ markAllReq: toFailure(error, deps) });
      }
    },

    reset() { tracker.invalidateAll(); set(initial()); },
  }));
}

export const selectHasUnread = (s) => s.items.some((item) => !item.read);

export const THEME_KEY = 'dmt.theme';
const THEMES = ['system', 'light', 'dark'];

/**
 * Theme preference (US-02). applyTheme touches the DOM and is injected from app/.
 * @param {{ storage?: Storage, applyTheme?: (pref: string) => void }} deps
 */
export function createUiStore(deps) {
  let stored = null;
  try { stored = deps.storage?.getItem(THEME_KEY) ?? null; } catch { /* storage unavailable */ }

  return createStore((set) => ({
    /** @type {'system'|'light'|'dark'} */
    themePreference: THEMES.includes(stored) ? stored : 'light',

    setTheme(pref) {
      if (!THEMES.includes(pref)) return;
      try { deps.storage?.setItem(THEME_KEY, pref); } catch { /* keep in memory */ }
      deps.applyTheme?.(pref);
      set({ themePreference: pref });
    },
  }));
}
