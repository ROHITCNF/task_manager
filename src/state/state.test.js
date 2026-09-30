import { describe, expect, it, vi } from 'vitest';
import { UnauthenticatedError } from '../data/errors/index.js';
import { WS, deferred, fakeServices, memoryStorage, task } from '../../tests/fakes/services.js';
import {
  createSessionStore, createWorkspaceStore, createTasksStore, createCalendarStore, createClientsStore,
  createDashboardStore, createQuickCaptureStore, createUiStore,
  selectColumnTasks, selectStatusBars, selectPersonBars, selectCalendarWeeks, selectCurrentWorkspace,
  CURRENT_WORKSPACE_KEY, THEME_KEY,
} from './index.js';

const baseDeps = (extra = {}) => ({ getWorkspaceId: () => WS, onUnauthenticated: vi.fn(), ...extra });

describe('sessionStore', () => {
  it('bootstraps to signedOut, signs in and out', async () => {
    const services = fakeServices();
    const onSignedOut = vi.fn();
    const store = createSessionStore(services, { onSignedOut });
    expect(store.getState().phase).toBe('unknown');

    await store.getState().bootstrap();
    expect(store.getState().phase).toBe('signedOut');

    await store.getState().signIn();
    expect(store.getState()).toMatchObject({ phase: 'signedIn', user: { name: 'Rohit Srivastava' } });

    await store.getState().signOut();
    expect(onSignedOut).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({ phase: 'signedOut', user: null });
  });

  it('handles a 401 from elsewhere once', async () => {
    const onSignedOut = vi.fn();
    const store = createSessionStore(fakeServices(), { onSignedOut });
    await store.getState().signIn();
    store.getState().handleUnauthenticated();
    store.getState().handleUnauthenticated();
    expect(onSignedOut).toHaveBeenCalledTimes(1);
    expect(store.getState().phase).toBe('signedOut');
  });

  it('keeps the phase and records the error when sign-in fails', async () => {
    const services = fakeServices();
    services.auth.signIn.mockRejectedValueOnce(new Error('boom'));
    const store = createSessionStore(services, { onSignedOut: vi.fn() });
    await store.getState().signIn();
    expect(store.getState().req.status).toBe('error');
    expect(store.getState().phase).toBe('unknown');
  });
});

describe('workspaceStore', () => {
  it('keeps a stored workspace that still exists, else falls back to the first', async () => {
    const storage = memoryStorage({ [CURRENT_WORKSPACE_KEY]: 'wsp_2' });
    const store = createWorkspaceStore(fakeServices(), { storage });
    await store.getState().load();
    expect(store.getState().currentId).toBe('wsp_2');

    const stale = createWorkspaceStore(fakeServices(), { storage: memoryStorage({ [CURRENT_WORKSPACE_KEY]: 'gone' }) });
    await stale.getState().load();
    expect(stale.getState().currentId).toBe(WS);
    expect(selectCurrentWorkspace(stale.getState()).name).toBe('DMT');
  });

  it('create switches to the new workspace; join does not', async () => {
    const onWorkspaceChanged = vi.fn();
    const storage = memoryStorage();
    const services = fakeServices();
    const store = createWorkspaceStore(services, { storage, onWorkspaceChanged });
    await store.getState().load();

    await store.getState().create('New team');
    expect(store.getState().currentId).toBe('wsp_new');
    expect(storage.dump()[CURRENT_WORKSPACE_KEY]).toBe('wsp_new');
    expect(onWorkspaceChanged).toHaveBeenCalledTimes(1);

    await store.getState().join('DEMO-123');
    expect(store.getState().currentId).toBe('wsp_new');
    expect(store.getState().workspaces.map((w) => w.id)).toContain('wsp_join');
  });

  it('sends nothing for empty names or codes', async () => {
    const services = fakeServices();
    const store = createWorkspaceStore(services, {});
    expect(await store.getState().create('   ')).toBeNull();
    expect(await store.getState().join('')).toBeNull();
    expect(services.workspaces.create).not.toHaveBeenCalled();
    expect(services.workspaces.join).not.toHaveBeenCalled();
  });

  it('reports 401 through onUnauthenticated', async () => {
    const services = fakeServices();
    services.workspaces.listMine.mockRejectedValueOnce(new UnauthenticatedError('no'));
    const onUnauthenticated = vi.fn();
    const store = createWorkspaceStore(services, { onUnauthenticated });
    await store.getState().load();
    expect(onUnauthenticated).toHaveBeenCalled();
    expect(store.getState().req.status).toBe('error');
  });
});

describe('tasksStore', () => {
  it('loads counts and all six columns', async () => {
    const services = fakeServices();
    const store = createTasksStore(services, baseDeps());
    await store.getState().loadBoard();
    const s = store.getState();
    expect(s.counts).toEqual({ backlog: 1, todo: 2, in_progress: 0, testing_validation: 0, done: 0, canceled: 0 });
    expect(services.tasks.list).toHaveBeenCalledTimes(6);
    expect(selectColumnTasks('todo')(s).map((t) => t.id)).toEqual(['t1']);
    expect(selectColumnTasks('todo')(s)).toBe(selectColumnTasks('todo')(s)); // memoised
  });

  it('appends the next page on loadMore', async () => {
    const services = fakeServices();
    const store = createTasksStore(services, baseDeps());
    await store.getState().loadBoard();
    services.tasks.list.mockResolvedValueOnce({ items: [task('t2', 'todo')], nextCursor: null });
    await store.getState().loadMore('todo');
    expect(store.getState().columns.todo).toMatchObject({ ids: ['t1', 't2'], nextCursor: null });
    await store.getState().loadMore('todo'); // no cursor → no request
    expect(services.tasks.list).toHaveBeenCalledTimes(7);
  });

  it('passes filters and ignores stale board responses', async () => {
    const services = fakeServices();
    const slow = deferred();
    services.tasks.stats.mockImplementationOnce(() => slow.promise);
    const store = createTasksStore(services, baseDeps());

    const first = store.getState().setFilter('q', 'old');
    const second = store.getState().setFilter('q', 'new');
    await second;
    slow.resolve({ groupBy: 'status', total: 99, groups: [{ key: 'todo', count: 99 }] });
    await first;

    expect(store.getState().counts.todo).toBe(2);
    expect(services.tasks.list).toHaveBeenLastCalledWith(WS, expect.objectContaining({ q: 'new' }));

    await store.getState().setFilter('clientId', 'c1');
    expect(services.tasks.list).toHaveBeenLastCalledWith(WS, expect.objectContaining({ q: 'new', clientId: ['c1'] }));
  });

  it('does nothing without a workspace', async () => {
    const services = fakeServices();
    const store = createTasksStore(services, baseDeps({ getWorkspaceId: () => null }));
    await store.getState().loadBoard();
    expect(services.tasks.list).not.toHaveBeenCalled();
  });
});

describe('calendarStore', () => {
  it('groups by due date and navigates months', async () => {
    const services = fakeServices();
    const store = createCalendarStore(services, baseDeps({ today: () => '2026-09-30' }));
    expect(store.getState().month).toEqual({ year: 2026, month: 9 });
    await store.getState().load();
    expect(services.tasks.listForMonth).toHaveBeenCalledWith(WS, '2026-09-01', '2026-09-30');
    expect(store.getState().byDate['2026-09-21']).toHaveLength(4);
    expect(store.getState().noDueDate).toHaveLength(1);

    await store.getState().next();
    expect(store.getState().month).toEqual({ year: 2026, month: 10 });
    await store.getState().goToday();
    expect(store.getState().month).toEqual({ year: 2026, month: 9 });
  });

  it('builds weeks with 3 entries and "+N more"', async () => {
    const store = createCalendarStore(fakeServices(), baseDeps({ today: () => '2026-09-30' }));
    await store.getState().load();
    const s = store.getState();
    const weeks = selectCalendarWeeks(s.month, s.byDate, '2026-09-30');
    const day21 = weeks.flat().find((c) => c.date === '2026-09-21');
    expect(day21.entries.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(day21.more).toBe(1);
    expect(weeks.flat().find((c) => c.isToday).date).toBe('2026-09-30');
    expect(weeks[0][0]).toMatchObject({ date: null });
  });
});

describe('clientsStore', () => {
  it('loads and pages', async () => {
    const store = createClientsStore(fakeServices(), baseDeps());
    await store.getState().load();
    await store.getState().loadMore();
    expect(store.getState().items.map((c) => c.name)).toEqual(['Aeidith', 'Bounce']);
    expect(store.getState().nextCursor).toBeNull();
  });
});

describe('dashboardStore and selectors', () => {
  it('loads summary and both charts', async () => {
    const services = fakeServices();
    const store = createDashboardStore(services, baseDeps({ getTz: () => 'Asia/Kolkata' }));
    await store.getState().load();
    expect(services.dashboard.get).toHaveBeenCalledWith(WS, 'Asia/Kolkata');
    expect(services.tasks.stats).toHaveBeenCalledWith(WS, 'assignee', { statusGroup: 'open' });

    const s = store.getState();
    const bars = selectStatusBars(s.byStatus);
    expect(bars.map((b) => [b.label, b.count, b.ratio])).toEqual([
      ['Backlog', 1, 0.5], ['To do', 2, 1], ['In progress', 0, 0], ['Testing & Validation', 0, 0], ['Done', 0, 0], ['Canceled', 0, 0],
    ]);
    expect(selectPersonBars(s.byAssignee).map((b) => [b.label, b.ratio])).toEqual([['N', 1], ['P', 0.5]]);
  });
});

describe('quickCaptureStore', () => {
  it('ignores blank text and stores drafts', async () => {
    const services = fakeServices();
    const store = createQuickCaptureStore(services, baseDeps());
    await store.getState().split('  ', 'meeting');
    expect(services.quickCapture.split).not.toHaveBeenCalled();
    await store.getState().split('a\nb', 'meeting');
    expect(store.getState().drafts).toEqual([{ title: 'a' }, { title: 'b' }]);
  });
});

describe('uiStore', () => {
  it('defaults to light, persists and applies the preference', () => {
    const storage = memoryStorage();
    const applyTheme = vi.fn();
    const store = createUiStore({ storage, applyTheme });
    expect(store.getState().themePreference).toBe('light');
    store.getState().setTheme('dark');
    expect(applyTheme).toHaveBeenCalledWith('dark');
    expect(storage.dump()[THEME_KEY]).toBe('dark');
    store.getState().setTheme('purple');
    expect(store.getState().themePreference).toBe('dark');
    expect(createUiStore({ storage }).getState().themePreference).toBe('dark');
  });
});
