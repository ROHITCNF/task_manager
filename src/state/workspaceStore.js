import { createStore } from 'zustand/vanilla';
import { IDLE, LOADING, SUCCESS, createRequestTracker, toFailure } from './request.js';

export const CURRENT_WORKSPACE_KEY = 'dmt.currentWorkspaceId';
const MEMBERS_PAGE = 50;

const read = (storage, key) => {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
};
const write = (storage, key, value) => {
  try { storage?.setItem(key, value); } catch { /* storage unavailable: keep in memory only */ }
};

/**
 * @param {{ workspaces: import('../data/services/WorkspaceService.js').WorkspaceService }} services
 * @param {{ storage?: Storage, onUnauthenticated?: () => void, onWorkspaceChanged?: () => void }} deps
 */
export function createWorkspaceStore({ workspaces }, deps) {
  const tracker = createRequestTracker();

  const membersInitial = { members: [], membersCursor: null, membersReq: IDLE };

  return createStore((set, get) => ({
    /** @type {import('../domain/models.js').Workspace[]} */
    workspaces: [],
    /** @type {string|null} */
    currentId: read(deps.storage, CURRENT_WORKSPACE_KEY),
    req: IDLE,
    createReq: IDLE,
    joinReq: IDLE,
    ...membersInitial,

    async load() {
      set({ req: LOADING });
      try {
        const list = await workspaces.listMine();
        const stored = get().currentId;
        const currentId = list.some((w) => w.id === stored) ? stored : (list[0]?.id ?? null);
        if (currentId) write(deps.storage, CURRENT_WORKSPACE_KEY, currentId);
        set({ workspaces: list, currentId, req: SUCCESS });
      } catch (error) {
        set({ req: toFailure(error, deps) });
      }
    },

    select(id) {
      if (id === get().currentId) return;
      write(deps.storage, CURRENT_WORKSPACE_KEY, id);
      tracker.invalidateAll();
      set({ currentId: id, ...membersInitial });
      deps.onWorkspaceChanged?.();
    },

    /** Creates a workspace owned by the user and switches to it (US-09). */
    async create(name) {
      if (!name?.trim()) return null;
      set({ createReq: LOADING });
      try {
        const created = await workspaces.create(name);
        set((s) => ({ workspaces: [...s.workspaces, created], createReq: SUCCESS }));
        get().select(created.id);
        return created;
      } catch (error) {
        set({ createReq: toFailure(error, deps) });
        return null;
      }
    },

    /** Joins by invite code without switching (US-10). Empty codes send nothing. */
    async join(inviteCode) {
      if (!inviteCode?.trim()) return null;
      set({ joinReq: LOADING });
      try {
        const joined = await workspaces.join(inviteCode);
        set((s) => ({ workspaces: [...s.workspaces, joined], joinReq: SUCCESS }));
        return joined;
      } catch (error) {
        set({ joinReq: toFailure(error, deps) });
        return null;
      }
    },

    async loadMembers({ more = false } = {}) {
      const { currentId, membersCursor } = get();
      if (!currentId || (more && !membersCursor)) return;
      const isCurrent = tracker.start('members');
      set({ membersReq: LOADING });
      try {
        const page = await workspaces.listMembers(currentId, { cursor: more ? membersCursor : undefined, limit: MEMBERS_PAGE });
        if (!isCurrent()) return;
        set((s) => ({ members: more ? [...s.members, ...page.items] : page.items, membersCursor: page.nextCursor, membersReq: SUCCESS }));
      } catch (error) {
        if (isCurrent()) set({ membersReq: toFailure(error, deps) });
      }
    },

    /** Sign-out reset. The stored workspace id is kept; load() falls back if it is no longer valid. */
    reset() {
      tracker.invalidateAll();
      set({ workspaces: [], req: IDLE, createReq: IDLE, joinReq: IDLE, ...membersInitial });
    },
  }));
}

export const selectCurrentWorkspace = (s) => s.workspaces.find((w) => w.id === s.currentId) ?? null;
