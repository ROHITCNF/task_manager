import { describe, expect, it, vi } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { setupMockServer, testConfig, TEST_BASE_URL } from '../../tests/setup/mockServer.js';
import { createDataLayer } from './index.js';
import { HttpClient } from './http/HttpClient.js';
import {
  MappingError, NetworkError, NotFoundError, StaleVersionError, UnauthenticatedError, ValidationError, RateLimitedError, ServerError, ConflictError,
} from './errors/index.js';
import { toTask } from './mappers/index.js';

const server = setupMockServer();
const WS = 'wsp_01J8Z000000000000000000001';

async function signedIn() {
  const data = createDataLayer(testConfig);
  await data.auth.signIn();
  return data;
}

describe('HttpClient', () => {
  const okFetch = () => vi.fn(async () => new Response(JSON.stringify({ data: 1 }), { headers: { 'Content-Type': 'application/json' } }));

  it('encodes queries and sends contract headers', async () => {
    const fetchImpl = okFetch();
    const client = new HttpClient({ baseUrl: TEST_BASE_URL, timeoutMs: 1000, fetchImpl });
    await client.get('/x', { query: { status: ['todo', 'done'], q: '', a: undefined, n: 0, b: false } });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(`${TEST_BASE_URL}/x?status=todo%2Cdone&n=0&b=false`);
    expect(init.credentials).toBe('include');
    expect(init.headers['X-Requested-With']).toBe('dmt-web');
    expect(init.headers['Idempotency-Key']).toBeUndefined();
  });

  it('adds If-Match and Idempotency-Key', async () => {
    const fetchImpl = okFetch();
    const client = new HttpClient({ baseUrl: TEST_BASE_URL, timeoutMs: 1000, fetchImpl });
    await client.patch('/x', { a: 1 }, { ifMatch: 7 });
    await client.post('/y', { b: 2 });
    expect(fetchImpl.mock.calls[0][1].headers['If-Match']).toBe('"7"');
    expect(fetchImpl.mock.calls[0][1].body).toBe('{"a":1}');
    expect(fetchImpl.mock.calls[1][1].headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each([
    [401, UnauthenticatedError], [404, NotFoundError], [409, ConflictError], [412, StaleVersionError],
    [422, ValidationError], [429, RateLimitedError], [503, ServerError],
  ])('maps HTTP %i to %o', async (status, ErrorClass) => {
    const body = { code: 'x', title: 'Nope', status, errors: [{ field: 'name', code: 'required', message: 'Name is required' }] };
    const fetchImpl = async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/problem+json', 'Retry-After': '3' } });
    const client = new HttpClient({ baseUrl: TEST_BASE_URL, timeoutMs: 1000, fetchImpl });
    const error = await client.get('/x').catch((e) => e);
    expect(error).toBeInstanceOf(ErrorClass);
    expect(error.status).toBe(status);
    if (status === 422) expect(error.fieldErrors).toEqual({ name: 'Name is required' });
    if (status === 429) expect(error.retryAfterSec).toBe(3);
  });

  it('wraps network failures and timeouts in NetworkError', async () => {
    const failing = new HttpClient({ baseUrl: TEST_BASE_URL, timeoutMs: 1000, fetchImpl: async () => { throw new TypeError('offline'); } });
    await expect(failing.get('/x')).rejects.toBeInstanceOf(NetworkError);

    const hanging = new HttpClient({
      baseUrl: TEST_BASE_URL, timeoutMs: 20,
      fetchImpl: (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))),
    });
    await expect(hanging.get('/x')).rejects.toMatchObject({ name: 'NetworkError', code: 'timeout' });
  });

  it('lets a caller abort pass through untouched', async () => {
    const controller = new AbortController();
    const client = new HttpClient({
      baseUrl: TEST_BASE_URL, timeoutMs: 1000,
      fetchImpl: (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))),
    });
    const pending = client.get('/x', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('mappers', () => {
  const dto = {
    id: 'tsk_1', title: 'T', status: 'todo', priority: 'urgent', startDate: '2026-09-29', endDate: '2026-09-29', dueDate: null,
    position: 'a1', checklist: { done: 0, total: 1 }, commentCount: 0,
    createdBy: { id: 'usr_1', name: 'N', avatarUrl: null }, createdAt: '2026-09-29T05:00:00Z', updatedAt: '2026-09-29T05:00:00Z',
    assignees: [], clients: [{ id: 'cli_1', name: 'Bounce', colour: '#CA3A32' }], labels: [], version: 3,
  };

  it('maps a task DTO to a frozen domain object', () => {
    const task = toTask(dto);
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.dueDate).toBeNull();
    expect(task.clients[0].colour).toBe('#ca3a32');
    expect(Object.isFrozen(task)).toBe(true);
    expect('description' in task).toBe(false);
  });

  it('rejects unknown enum values (contract drift)', () => {
    expect(() => toTask({ ...dto, status: 'blocked' })).toThrow(MappingError);
    expect(() => toTask({ ...dto, priority: 'p0' })).toThrow(MappingError);
  });
});

describe('services against the mock server', () => {
  it('reports no session until signed in, then the fixture user', async () => {
    const data = createDataLayer(testConfig);
    expect(await data.auth.getSession()).toBeNull();
    const user = await data.auth.signIn();
    expect(user).toMatchObject({ name: 'Rohit Srivastava', email: 'rohitsrivastava@intellicar.in' });
    expect(await data.auth.getSession()).toMatchObject({ id: user.id });
    await data.auth.signOut();
    expect(await data.auth.getSession()).toBeNull();
  });

  it('google mode navigates to the backend OAuth start URL', async () => {
    const navigator = { assign: vi.fn() };
    const data = createDataLayer({ ...testConfig, authMode: 'google' }, { navigator });
    data.auth.signIn({ returnTo: '/tasks' });
    await Promise.resolve();
    expect(navigator.assign).toHaveBeenCalledWith(`${TEST_BASE_URL}/auth/google/start?returnTo=%2Ftasks`);
  });

  it('lists workspaces and members (owner first, join order)', async () => {
    const data = await signedIn();
    expect(await data.workspaces.listMine()).toEqual([expect.objectContaining({ id: WS, name: 'DMT', role: 'MEMBER' })]);
    const members = await data.workspaces.listMembers(WS, { limit: 200 });
    expect(members.items[0]).toMatchObject({ role: 'OWNER', user: { name: 'Neeraj Bhattathiripad' } });
    expect(members.items.slice(1, 4).map((m) => m.user.name)).toEqual(['Prudhviraj P', 'Abhinay Kumar', 'Kavya V']);
  });

  it('reproduces the board column counts', async () => {
    const data = await signedIn();
    const stats = await data.tasks.stats(WS, 'status');
    expect(stats.groups.map((g) => g.count)).toEqual([4, 49, 10, 0, 9, 1]);
  });

  it('reproduces open tasks per person', async () => {
    const data = await signedIn();
    const stats = await data.tasks.stats(WS, 'assignee', { statusGroup: 'open' });
    expect(stats.groups.map((g) => [g.user.name, g.count])).toEqual([
      ['Anantha Krishnan T G', 19], ['Bommidi Satya Durga prasad', 19], ['Pradeep Chandran', 18], ['Devanand P', 5],
      ['Neeraj Bhattathiripad', 4], ['ASWIN', 3], ['Prudhviraj P', 2], ['Abhinay Kumar', 1],
    ]);
    expect(stats.unassignedCount).toBe(1);
  });

  it('pages a column with cursors in position order', async () => {
    const data = await signedIn();
    const first = await data.tasks.list(WS, { status: ['todo'], limit: 20 });
    expect(first.items).toHaveLength(20);
    expect(first.items[0].title).toMatch(/^Re: OF_ITPL/);
    const second = await data.tasks.list(WS, { status: ['todo'], limit: 20, cursor: first.nextCursor });
    const third = await data.tasks.list(WS, { status: ['todo'], limit: 20, cursor: second.nextCursor });
    expect(third.items).toHaveLength(9);
    expect(third.nextCursor).toBeNull();
  });

  it('filters by search, assignee and client', async () => {
    const data = await signedIn();
    const search = await data.tasks.list(WS, { q: 'callisto' });
    expect(search.items.map((t) => t.title)).toEqual(['Re: Callisto Microvolt Project _ Jupiter electric', 'Re: Clarification Required – Callisto Microvolt Project']);
    const bounce = await data.tasks.list(WS, { clientId: ['cli_01J8Z009000000000000000000'] });
    expect(bounce.items).toHaveLength(3);
    const mine = await data.tasks.list(WS, { assigneeId: ['me'] });
    expect(mine.items).toHaveLength(0);
  });

  it('serves the calendar month and the no-due-date list in reference order', async () => {
    const data = await signedIn();
    const month = await data.tasks.listForMonth(WS, '2026-09-01', '2026-09-30');
    expect(month).toHaveLength(64);
    const on30 = month.filter((t) => t.dueDate === '2026-09-30').map((t) => t.title);
    expect(on30).toEqual(['Re: ALVA Request for Quotation : IoT', 'Test10', 'Changes only in BGauss Co pro FW for RUV models.']);
    const perDay = (day) => month.filter((t) => t.dueDate === `2026-09-${day}`).length;
    expect([perDay(21), perDay(22), perDay(23), perDay(28), perDay(29)]).toEqual([16, 9, 4, 6, 5]);

    const noDue = await data.tasks.listWithoutDueDate(WS);
    expect(noDue.map((t) => t.title)).toEqual([
      'Re: Intellicar Track Platform cleanup', 'Bgauss_new vehicle_component FOTA', 'Re: Callisto Microvolt Project _ Jupiter electric',
      'New Vehicle On-boarding', 'CAN Config Test Yukinova_superpower_v7', 'APIs Integration',
      'code for beacon module parser 104/53, 100/99 and 100/99', 'Curd operation on accounts, deals', 'emo device bench test',
    ]);
  });

  it('lists clients in reference order with task counts', async () => {
    const data = await signedIn();
    const { items } = await data.clients.list(WS, { limit: 200 });
    expect(items.slice(0, 9).map((c) => [c.name, c.taskCount])).toEqual([
      ['Aeidith', 1], ['Akasa', 1], ['All Clients', 1], ['Alva Auto', 1], ['Amararaja', 2],
      ['Anantshree Vehicle Pvt. Ltd.', 1], ['BGauss', 6], ['Battery Smart', 3], ['Bounce', 3],
    ]);
  });

  it('returns an all-zero dashboard for the signed-in user', async () => {
    const data = await signedIn();
    const dashboard = await data.dashboard.get(WS, 'Asia/Kolkata');
    expect(dashboard.stats).toEqual({ myOpenTasks: 0, overdue: 0, dueThisWeek: 0, awaitingReview: 0, unreadInbox: 0 });
    expect(dashboard.dueSoon).toEqual([]);
  });

  it('updates with optimistic concurrency', async () => {
    const data = await signedIn();
    const [task] = (await data.tasks.list(WS, { status: ['backlog'], limit: 1 })).items;
    const updated = await data.tasks.update(WS, task, { priority: 'low' });
    expect(updated).toMatchObject({ priority: 'low', version: task.version + 1 });
    await expect(data.tasks.update(WS, task, { priority: 'high' })).rejects.toBeInstanceOf(StaleVersionError);
  });

  it('creates and joins workspaces', async () => {
    const data = await signedIn();
    const created = await data.workspaces.create('  Firmware team ');
    expect(created).toMatchObject({ name: 'Firmware team', role: 'OWNER' });
    await expect(data.workspaces.join('NOPE')).rejects.toBeInstanceOf(NotFoundError);
    expect(await data.workspaces.join('DEMO-123')).toMatchObject({ name: 'Demo Team', role: 'MEMBER' });
    await expect(data.workspaces.join('DEMO-123')).rejects.toBeInstanceOf(ConflictError);
    expect((await data.workspaces.listMine()).map((w) => w.name)).toEqual(['DMT', 'Firmware team', 'Demo Team']);
  });

  it('splits quick-capture text into drafts', async () => {
    const data = await signedIn();
    const drafts = await data.quickCapture.split(WS, '- Follow up with design on mockups\n\n* Send contract to legal\n1. Call Bounce', 'meeting');
    expect(drafts.map((d) => d.title)).toEqual(['Follow up with design on mockups', 'Send contract to legal', 'Call Bounce']);
  });

  it('surfaces 401 from workspace calls when signed out', async () => {
    const data = createDataLayer(testConfig);
    await expect(data.tasks.stats(WS, 'status')).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('can be pointed at any server response (config-only switch)', async () => {
    server.use(mswHttp.get('*/api/v1/me/workspaces', () => HttpResponse.json({ data: [] })));
    const data = await signedIn();
    expect(await data.workspaces.listMine()).toEqual([]);
  });
});
