import { createStore } from 'zustand/vanilla';
import { TASK_STATUSES } from '../domain/status.js';
import { IDLE, LOADING, SUCCESS, createRequestTracker, toFailure } from './request.js';

export const BOARD_PAGE = 50;

const emptyColumns = () => Object.fromEntries(TASK_STATUSES.map((s) => [s, { ids: [], nextCursor: null, req: IDLE }]));
const zeroCounts = () => Object.fromEntries(TASK_STATUSES.map((s) => [s, 0]));
const initialFilters = () => ({ q: '', assigneeId: null, labelId: null, clientId: null });

/** Board filters → TaskQuery. */
function toQuery(filters) {
  return {
    q: filters.q || undefined,
    assigneeId: filters.assigneeId ? [filters.assigneeId] : undefined,
    labelId: filters.labelId ? [filters.labelId] : undefined,
    clientId: filters.clientId ? [filters.clientId] : undefined,
  };
}

const indexById = (tasks) => Object.fromEntries(tasks.map((t) => [t.id, t]));

/**
 * Board state (docs/lld/state.md §2 tasksStore).
 * @param {{ tasks: import('../data/services/TaskService.js').TaskService, labels?: import('../data/services/index.js').LabelService }} services
 * @param {{ getWorkspaceId: () => string|null, onUnauthenticated?: () => void }} deps
 */
export function createTasksStore({ tasks, labels }, deps) {
  const tracker = createRequestTracker();
  /** Bumped whenever the board is (re)loaded or reset; "load more" results from an older board are dropped. */
  let generation = 0;

  const initial = () => ({ filters: initialFilters(), counts: zeroCounts(), columns: emptyColumns(), byId: {}, countsReq: IDLE, labels: [] });

  return createStore((set, get) => ({
    ...initial(),

    async loadBoard() {
      const wsId = deps.getWorkspaceId();
      if (!wsId) return;
      const isCurrent = tracker.start('board');
      generation += 1;
      const query = toQuery(get().filters);

      set((s) => ({
        countsReq: LOADING,
        columns: Object.fromEntries(TASK_STATUSES.map((st) => [st, { ...s.columns[st], req: LOADING }])),
      }));

      const [statsResult, ...columnResults] = await Promise.allSettled([
        tasks.stats(wsId, 'status', query),
        ...TASK_STATUSES.map((st) => tasks.list(wsId, { ...query, status: [st], sort: 'position', limit: BOARD_PAGE })),
      ]);
      if (!isCurrent()) return;

      const byId = { ...get().byId };
      const columns = {};
      TASK_STATUSES.forEach((st, i) => {
        const result = columnResults[i];
        if (result.status === 'fulfilled') {
          Object.assign(byId, indexById(result.value.items));
          columns[st] = { ids: result.value.items.map((t) => t.id), nextCursor: result.value.nextCursor, req: SUCCESS };
        } else {
          columns[st] = { ids: [], nextCursor: null, req: toFailure(result.reason, deps) };
        }
      });

      const counts = statsResult.status === 'fulfilled'
        ? Object.fromEntries(statsResult.value.groups.map((g) => [g.key, g.count]))
        : get().counts;
      set({
        byId,
        columns,
        counts: { ...zeroCounts(), ...counts },
        countsReq: statsResult.status === 'fulfilled' ? SUCCESS : toFailure(statsResult.reason, deps),
      });
    },

    async loadMore(status) {
      const wsId = deps.getWorkspaceId();
      const column = get().columns[status];
      if (!wsId || !column?.nextCursor || column.req.status === 'loading') return;
      const boardGeneration = generation;
      const isCurrent = tracker.start(`more:${status}`);
      set((s) => ({ columns: { ...s.columns, [status]: { ...column, req: LOADING } } }));
      try {
        const page = await tasks.list(wsId, { ...toQuery(get().filters), status: [status], sort: 'position', limit: BOARD_PAGE, cursor: column.nextCursor });
        if (!isCurrent() || boardGeneration !== generation) return;
        set((s) => ({
          byId: { ...s.byId, ...indexById(page.items) },
          columns: { ...s.columns, [status]: { ids: [...s.columns[status].ids, ...page.items.map((t) => t.id)], nextCursor: page.nextCursor, req: SUCCESS } },
        }));
      } catch (error) {
        if (isCurrent() && boardGeneration === generation) {
          set((s) => ({ columns: { ...s.columns, [status]: { ...s.columns[status], req: toFailure(error, deps) } } }));
        }
      }
    },

    /** @param {'q'|'assigneeId'|'labelId'|'clientId'} key */
    setFilter(key, value) {
      set((s) => ({ filters: { ...s.filters, [key]: value ?? (key === 'q' ? '' : null) } }));
      return get().loadBoard();
    },

    /** Card hover status select (US-13): saves the new status, then reloads the board so the card moves. */
    async changeStatus(task, status) {
      const wsId = deps.getWorkspaceId();
      if (!wsId || task.status === status || !task.permissions?.canEdit) return;
      try {
        await tasks.update(wsId, task, { status });
      } catch (error) {
        toFailure(error, deps);
      }
      await get().loadBoard();
    },

    /** Workspace labels for the "All labels" filter (US-05). */
    async loadLabels() {
      const wsId = deps.getWorkspaceId();
      if (!wsId || !labels) return;
      const isCurrent = tracker.start('labels');
      try {
        const list = await labels.list(wsId);
        if (isCurrent()) set({ labels: list });
      } catch (error) {
        toFailure(error, deps);
      }
    },

    reset() {
      tracker.invalidateAll();
      generation += 1;
      set(initial());
    },
  }));
}
