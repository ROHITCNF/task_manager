import { createStore } from 'zustand/vanilla';
import { IDLE, LOADING, SUCCESS, createRequestTracker, toFailure } from './request.js';

/**
 * Task detail drawer (US-14/15): the open task (full view), its history, and saving edits.
 * @param {{ tasks: import('../data/services/TaskService.js').TaskService }} services
 * @param {{ getWorkspaceId: () => string|null, onUnauthenticated?: () => void, onTaskChanged?: () => void }} deps
 */
export function createTaskDetailStore({ tasks }, deps) {
  const tracker = createRequestTracker();
  const initial = () => ({ taskId: null, task: null, history: null, req: IDLE, historyReq: IDLE, saveReq: IDLE });

  return createStore((set, get) => ({
    ...initial(),

    async open(taskId) {
      const wsId = deps.getWorkspaceId();
      if (!wsId || !taskId) return;
      if (taskId !== get().taskId) set({ ...initial(), taskId });
      const isCurrent = tracker.start('task');
      set({ req: LOADING });
      try {
        const task = await tasks.get(wsId, taskId);
        if (isCurrent()) set({ task, req: SUCCESS });
      } catch (error) {
        if (isCurrent()) set({ req: toFailure(error, deps) });
      }
    },

    async loadHistory() {
      const wsId = deps.getWorkspaceId();
      const { taskId } = get();
      if (!wsId || !taskId) return;
      const isCurrent = tracker.start('history');
      set({ historyReq: LOADING });
      try {
        const history = await tasks.history(wsId, taskId);
        if (isCurrent()) set({ history, historyReq: SUCCESS });
      } catch (error) {
        if (isCurrent()) set({ historyReq: toFailure(error, deps) });
      }
    },

    /** Saves a partial update with If-Match; refreshes the board on success. */
    async save(patch) {
      const wsId = deps.getWorkspaceId();
      const { task } = get();
      if (!wsId || !task || !task.permissions.canEdit) return;
      set({ saveReq: LOADING });
      try {
        const saved = await tasks.update(wsId, task, patch);
        set({ task: saved, history: null, saveReq: SUCCESS });
        deps.onTaskChanged?.();
      } catch (error) {
        set({ saveReq: toFailure(error, deps) });
      }
    },

    close() {
      tracker.invalidateAll();
      set(initial());
    },

    reset() {
      tracker.invalidateAll();
      set(initial());
    },
  }));
}
