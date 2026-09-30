import { http, HttpResponse } from 'msw';
import { db } from '../db.js';
import {
  API, OPEN, STATUS_ORDER, filterTasks, newId, one, paginate, plusDays, problem, requireMember, sortTasks, todayIn, versionFromIfMatch,
} from './support.js';

const tasksOf = (workspaceId) => db.state.tasks.filter((t) => t.workspaceId === workspaceId);

function nextPosition(workspaceId, status) {
  const positions = tasksOf(workspaceId).filter((t) => t.status === status).map((t) => t.position).sort();
  const last = positions.at(-1);
  return last ? `${last}V` : 'a0001';
}

function createTask(workspaceId, userId, input) {
  const now = new Date().toISOString();
  const status = input.status ?? 'todo';
  const task = {
    id: newId('tsk'),
    workspaceId,
    title: input.title.trim(),
    description: input.description ?? null,
    status,
    priority: input.priority ?? 'none',
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    dueDate: input.dueDate ?? null,
    position: nextPosition(workspaceId, status),
    checklist: { done: 0, total: 0 },
    commentCount: 0,
    createdById: userId,
    createdAt: now,
    updatedAt: now,
    assigneeIds: input.assigneeIds ?? [],
    clientIds: input.clientIds ?? [],
    labelIds: input.labelIds ?? [],
    events: [],
    version: 1,
  };
  db.state.tasks.push(task);
  return task;
}

const titleError = () => problem(422, 'validation_failed', 'Validation failed', [{ field: 'title', code: 'required', message: 'Title is required' }]);

export const taskHandlers = [
  http.get(`${API}/workspaces/:workspaceId/tasks/stats`, ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const url = new URL(request.url);
    const tasks = filterTasks(tasksOf(params.workspaceId), url, ctx.user.id);
    const groupBy = url.searchParams.get('groupBy');

    if (groupBy === 'status') {
      const groups = STATUS_ORDER.map((key) => ({ key, count: tasks.filter((t) => t.status === key).length }));
      return one({ groupBy, total: tasks.length, groups });
    }
    if (groupBy === 'assignee') {
      const counts = new Map();
      for (const t of tasks) for (const id of t.assigneeIds) counts.set(id, (counts.get(id) ?? 0) + 1);
      const groups = [...counts].map(([id, count]) => ({ key: id, count, user: db.userRef(id) }))
        .sort((a, b) => b.count - a.count || a.user.name.localeCompare(b.user.name));
      const unassignedCount = tasks.filter((t) => t.assigneeIds.length === 0).length;
      return one({ groupBy, total: tasks.length, groups, unassignedCount });
    }
    return problem(422, 'validation_failed', 'Validation failed', [{ field: 'groupBy', code: 'invalid', message: 'groupBy must be status or assignee' }]);
  }),

  http.get(`${API}/workspaces/:workspaceId/tasks`, ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const url = new URL(request.url);
    const view = url.searchParams.get('view') ?? 'card';
    const tasks = sortTasks(filterTasks(tasksOf(params.workspaceId), url, ctx.user.id), url.searchParams.get('sort') ?? 'position');
    const page = paginate(tasks, url);
    return Response.json({ ...page, data: page.data.map((t) => db.taskDto(t, view, ctx.user.id)) });
  }),

  http.post(`${API}/workspaces/:workspaceId/tasks/bulk`, async ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const { tasks = [] } = await request.json();
    if (!tasks.length || tasks.length > 100 || tasks.some((t) => !t.title?.trim())) return titleError();
    const created = tasks.map((input) => createTask(params.workspaceId, ctx.user.id, input));
    return one(created.map((t) => db.taskDto(t, 'full', ctx.user.id)), 201);
  }),

  http.post(`${API}/workspaces/:workspaceId/tasks`, async ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const input = await request.json();
    if (!input.title?.trim()) return titleError();
    const task = createTask(params.workspaceId, ctx.user.id, input);
    return one(db.taskDto(task, 'full', ctx.user.id), 201, { ETag: `"${task.version}"` });
  }),

  http.get(`${API}/workspaces/:workspaceId/tasks/:taskId`, ({ params }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const task = tasksOf(params.workspaceId).find((t) => t.id === params.taskId);
    if (!task) return problem(404, 'not_found', 'Task not found');
    return one(db.taskDto(task, 'full', ctx.user.id), 200, { ETag: `"${task.version}"` });
  }),

  http.get(`${API}/workspaces/:workspaceId/tasks/:taskId/history`, ({ params }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const task = tasksOf(params.workspaceId).find((t) => t.id === params.taskId);
    if (!task) return problem(404, 'not_found', 'Task not found');
    return one(db.historyDto(task));
  }),

  http.patch(`${API}/workspaces/:workspaceId/tasks/:taskId`, async ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const task = tasksOf(params.workspaceId).find((t) => t.id === params.taskId);
    if (!task) return problem(404, 'not_found', 'Task not found');
    const version = versionFromIfMatch(request);
    if (version === null) return problem(428, 'precondition_required', 'If-Match header required');
    if (version !== task.version) return problem(412, 'precondition_failed', 'Task was changed by someone else');

    if (!db.permissionsFor(task, ctx.user.id).canEdit) return problem(403, 'forbidden', 'Only the creator or an owner can change this task');
    const patch = await request.json();
    const fields = ['title', 'description', 'priority', 'startDate', 'endDate', 'dueDate', 'assigneeIds', 'clientIds', 'labelIds'];
    for (const field of fields) if (field in patch) task[field] = patch[field];
    if (patch.status && patch.status !== task.status) {
      task.status = patch.status;
      task.position = nextPosition(params.workspaceId, patch.status);
    }
    task.version += 1;
    task.updatedAt = new Date().toISOString();
    return one(db.taskDto(task, 'full', ctx.user.id), 200, { ETag: `"${task.version}"` });
  }),

  http.delete(`${API}/workspaces/:workspaceId/tasks/:taskId`, ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const index = db.state.tasks.findIndex((t) => t.workspaceId === params.workspaceId && t.id === params.taskId);
    if (index < 0) return problem(404, 'not_found', 'Task not found');
    if (versionFromIfMatch(request) !== db.state.tasks[index].version) return problem(412, 'precondition_failed', 'Task was changed by someone else');
    db.state.tasks.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/workspaces/:workspaceId/dashboard`, ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const tz = new URL(request.url).searchParams.get('tz') || 'UTC';
    const today = todayIn(tz);
    const weekEnd = plusDays(today, 6);
    const mine = tasksOf(params.workspaceId).filter((t) => OPEN.has(t.status) && t.assigneeIds.includes(ctx.user.id));
    const overdue = mine.filter((t) => t.dueDate && t.dueDate < today);
    const thisWeek = mine.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate <= weekEnd);
    const dueSoon = [...overdue, ...thisWeek].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 20);
    return one({
      today,
      stats: { myOpenTasks: mine.length, overdue: overdue.length, dueThisWeek: thisWeek.length, awaitingReview: 0, unreadInbox: 0 },
      dueSoon: dueSoon.map((t) => db.taskDto(t, 'card', ctx.user.id)),
      awaitingReview: [],
    });
  }),
];
