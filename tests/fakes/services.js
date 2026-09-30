/**
 * Hand-written fake services for store tests (docs/lld/testing.md §2). No MSW, no HTTP.
 * Each method is a vi.fn so tests can override behaviour per case.
 */
import { vi } from 'vitest';

export const WS = 'wsp_1';

export const user = (id, name) => Object.freeze({ id, name, avatarUrl: null });

export const task = (id, status, extra = {}) => Object.freeze({
  id, title: `Task ${id}`, status, priority: 'none', startDate: null, endDate: null, dueDate: null, position: id,
  checklist: { done: 0, total: 0 }, commentCount: 0, createdBy: user('u1', 'N'), createdAt: new Date(), updatedAt: new Date(),
  assignees: [], clients: [], labels: [], version: 1, permissions: { canEdit: false, canComment: true }, ...extra,
});

/** A deferred promise, to control response ordering. */
export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

export function fakeServices() {
  return {
    auth: {
      getSession: vi.fn(async () => null),
      signIn: vi.fn(async () => ({ id: 'u9', name: 'Rohit Srivastava', email: 'r@x', avatarUrl: null })),
      signOut: vi.fn(async () => {}),
    },
    workspaces: {
      listMine: vi.fn(async () => [{ id: WS, name: 'DMT', role: 'MEMBER' }, { id: 'wsp_2', name: 'Other', role: 'OWNER' }]),
      create: vi.fn(async (name) => ({ id: 'wsp_new', name, role: 'OWNER' })),
      join: vi.fn(async () => ({ id: 'wsp_join', name: 'Joined', role: 'MEMBER' })),
      listMembers: vi.fn(async () => ({
        items: [
          { user: user('u1', 'Neeraj Bhattathiripad'), email: 'n@x', role: 'OWNER' },
          { user: { ...user('u2', 'Anantha Krishnan T G'), avatarUrl: '/a.png' }, email: 'a@x', role: 'MEMBER' },
        ],
        nextCursor: null,
      })),
    },
    tasks: {
      stats: vi.fn(async (_ws, groupBy) => (groupBy === 'status'
        ? { groupBy, total: 3, groups: [{ key: 'backlog', count: 1 }, { key: 'todo', count: 2 }] }
        : { groupBy, total: 3, groups: [{ key: 'u1', count: 2, user: user('u1', 'N') }, { key: 'u2', count: 1, user: user('u2', 'P') }], unassignedCount: 1 })),
      list: vi.fn(async (_ws, { status }) => {
        if (status[0] === 'backlog') return { items: [task('b1', 'backlog')], nextCursor: null };
        if (status[0] === 'todo') return { items: [task('t1', 'todo')], nextCursor: 'c1' };
        return { items: [], nextCursor: null };
      }),
      listForMonth: vi.fn(async () => [
        { id: 'a', title: 'A', status: 'todo', priority: 'urgent', dueDate: '2026-09-21' },
        { id: 'b', title: 'B', status: 'todo', priority: 'urgent', dueDate: '2026-09-21' },
        { id: 'c', title: 'C', status: 'todo', priority: 'urgent', dueDate: '2026-09-21' },
        { id: 'd', title: 'D', status: 'todo', priority: 'urgent', dueDate: '2026-09-21' },
        { id: 'e', title: 'E', status: 'todo', priority: 'none', dueDate: '2026-09-30' },
      ]),
      listWithoutDueDate: vi.fn(async () => [{ id: 'n', title: 'No due', status: 'backlog', priority: 'high', dueDate: null }]),
      get: vi.fn(async (_ws, id) => task(id, 'backlog', {
        title: 'Re: Intellicar Track Platform cleanup', description: 'CSM - NIRANJAN BALAJI.', priority: 'high',
        startDate: '2026-09-23', endDate: '2026-09-28', createdAt: new Date('2026-09-23T14:26:00Z'),
        createdBy: { ...user('u2', 'Anantha Krishnan T G'), avatarUrl: '/a.png' },
        assignees: [{ ...user('u2', 'Anantha Krishnan T G'), avatarUrl: '/a.png' }],
        clients: [{ id: 'c1', name: 'Aeidith', colour: '#4ca154' }],
      })),
      history: vi.fn(async () => ({
        stages: [{ status: 'backlog', enteredAt: new Date('2026-09-23T14:26:00Z'), exitedAt: null, approximate: true }],
        events: [
          { id: 'e0', type: 'created', actor: user('u2', 'Anantha Krishnan T G'), createdAt: new Date('2026-09-23T14:26:00Z') },
          { id: 'e1', type: 'subtask_added', actor: user('u2', 'Anantha Krishnan T G'), createdAt: new Date('2026-09-24T10:57:00Z'), subtaskTitle: 'test 1' },
          { id: 'e2', type: 'field_changed', actor: user('u2', 'Anantha Krishnan T G'), createdAt: new Date('2026-09-25T06:51:00Z'), field: 'endDate', from: '2026-09-23', to: '2026-09-28' },
          { id: 'e3', type: 'mystery', actor: user('u2', 'Anantha Krishnan T G'), createdAt: new Date('2026-09-26T06:51:00Z') },
        ],
      })),
      update: vi.fn(async (_ws, t, patch) => ({ ...t, ...patch, version: t.version + 1 })),
    },
    labels: {
      list: vi.fn(async () => [{ id: 'l1', name: 'Firmware', colour: '#418faf' }]),
    },
    dashboard: {
      get: vi.fn(async () => ({ today: '2026-09-30', stats: { myOpenTasks: 0, overdue: 0, dueThisWeek: 0, awaitingReview: 0, unreadInbox: 0 }, dueSoon: [], awaitingReview: [] })),
    },
    clients: {
      list: vi.fn(async (_ws, { cursor }) => (cursor
        ? { items: [{ id: 'c2', name: 'Bounce' }], nextCursor: null }
        : { items: [{ id: 'c1', name: 'Aeidith' }], nextCursor: 'p2' })),
    },
    docs: {
      list: vi.fn(async () => ({
        items: ['Untitled', 'image (1)', 'Test1'].map((title, i) => ({ id: `d${i}`, title, client: null, updatedAt: new Date() })),
        nextCursor: null,
      })),
    },
    inbox: {
      list: vi.fn(async () => ({ items: [], nextCursor: null })),
      markAllRead: vi.fn(async () => {}),
    },
    quickCapture: {
      split: vi.fn(async (_ws, text) => text.split('\n').map((title) => ({ title }))),
    },
  };
}

/** Minimal in-memory Storage. */
export function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}
