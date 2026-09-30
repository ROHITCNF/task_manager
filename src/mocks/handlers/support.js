/** Shared helpers for mock handlers: envelopes, problems, auth checks, filtering, paging. */
import { HttpResponse } from 'msw';
import { db } from '../db.js';

export const API = '*/api/v1';

export const STATUS_ORDER = ['backlog', 'todo', 'in_progress', 'testing_validation', 'done', 'canceled'];
export const OPEN = new Set(['backlog', 'todo', 'in_progress', 'testing_validation']);

export const json = (data, init) => HttpResponse.json(data, init);
export const one = (data, status = 200, headers) => HttpResponse.json({ data }, { status, headers });

export function problem(status, code, title, errors) {
  return HttpResponse.json(
    { type: `https://api.dmt.example/problems/${code}`, title, status, code, ...(errors ? { errors } : {}) },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

/** @returns {{ user: object } | { response: Response }} */
export function requireUser() {
  const user = db.sessionUser();
  return user ? { user } : { response: problem(401, 'unauthenticated', 'Not signed in') };
}

/** @returns {{ user: object, workspace: object } | { response: Response }} */
export function requireMember(workspaceId) {
  const auth = requireUser();
  if (auth.response) return auth;
  const workspace = db.workspace(workspaceId);
  if (!workspace) return { response: problem(404, 'not_found', 'Workspace not found') };
  if (!db.membership(workspaceId, auth.user.id)) return { response: problem(403, 'forbidden', 'Not a member of this workspace') };
  return { user: auth.user, workspace };
}

const encodeCursor = (offset) => btoa(String(offset));
const decodeCursor = (cursor) => (cursor ? Number(atob(cursor)) || 0 : 0);

/** Cursor pagination over an array. */
export function paginate(items, url, defaultLimit = 50) {
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || defaultLimit, 1), 200);
  const offset = decodeCursor(url.searchParams.get('cursor'));
  const page = items.slice(offset, offset + limit);
  const next = offset + limit < items.length ? encodeCursor(offset + limit) : null;
  return { data: page, meta: { nextCursor: next, limit } };
}

export const csv = (url, key) => (url.searchParams.get(key) ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export function bool(url, key) {
  const value = url.searchParams.get(key);
  return value === null ? undefined : value === 'true';
}

/** Applies listTasks/getTaskStats filters (openapi.yaml). */
export function filterTasks(tasks, url, currentUserId) {
  const statuses = csv(url, 'status');
  const statusGroup = url.searchParams.get('statusGroup');
  const assignees = csv(url, 'assigneeId').map((id) => (id === 'me' ? currentUserId : id));
  const unassigned = bool(url, 'unassigned');
  const clients = csv(url, 'clientId');
  const labels = csv(url, 'labelId');
  const q = url.searchParams.get('q')?.trim().toLowerCase();
  const dueFrom = url.searchParams.get('dueFrom');
  const dueTo = url.searchParams.get('dueTo');
  const hasDueDate = bool(url, 'hasDueDate');

  return tasks.filter((t) =>
    (!statuses.length || statuses.includes(t.status)) &&
    (statusGroup !== 'open' || OPEN.has(t.status)) &&
    (statusGroup !== 'closed' || !OPEN.has(t.status)) &&
    (!assignees.length || t.assigneeIds.some((id) => assignees.includes(id))) &&
    (unassigned === undefined || (t.assigneeIds.length === 0) === unassigned) &&
    (!clients.length || t.clientIds.some((id) => clients.includes(id))) &&
    (!labels.length || t.labelIds.some((id) => labels.includes(id))) &&
    (!q || t.title.toLowerCase().includes(q)) &&
    (!dueFrom || (t.dueDate && t.dueDate >= dueFrom)) &&
    (!dueTo || (t.dueDate && t.dueDate <= dueTo)) &&
    (hasDueDate === undefined || (t.dueDate !== null) === hasDueDate));
}

const byBoard = (a, b) =>
  STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || (a.position < b.position ? -1 : a.position > b.position ? 1 : 0);

const SORTS = {
  position: byBoard,
  createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt) || byBoard(a, b),
  dueDate: (a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || byBoard(a, b),
};

export function sortTasks(tasks, sortParam = 'position') {
  const desc = sortParam.startsWith('-');
  const compare = SORTS[sortParam.replace(/^-/, '')] ?? SORTS.position;
  return [...tasks].sort((a, b) => (desc ? -compare(a, b) : compare(a, b)));
}

/** Calendar date in an IANA timezone (the server side of "today"). */
export function todayIn(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function plusDays(localDate, n) {
  const [y, m, d] = localDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Next ULID-shaped id with a prefix. */
let seq = 0;
export function newId(prefix) {
  seq += 1;
  const crock = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let n = Date.now() * 1000 + seq;
  let s = '';
  for (let i = 0; i < 26; i += 1) { s = crock[n % 32] + s; n = Math.floor(n / 32); }
  return `${prefix}_${s}`;
}

export function versionFromIfMatch(request) {
  const header = request.headers.get('If-Match');
  return header === null ? null : Number(header.replace(/"/g, ''));
}
