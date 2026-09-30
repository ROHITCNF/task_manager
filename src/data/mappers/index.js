/**
 * DTO ↔ domain mappers (docs/lld/data-layer.md §6). The only code that knows wire field names.
 * Domain objects are frozen. LocalDate fields stay strings; instants become Date.
 */
import { isTaskStatus } from '../../domain/status.js';
import { isPriority } from '../../domain/priority.js';
import { MappingError } from '../errors/index.js';

const freeze = Object.freeze;
const toDate = (value) => (value ? new Date(value) : null);

function status(value) {
  if (!isTaskStatus(value)) throw new MappingError(`Unknown task status "${value}"`);
  return value;
}

function priority(value) {
  if (!isPriority(value)) throw new MappingError(`Unknown priority "${value}"`);
  return value;
}

export const toUserRef = (dto) => freeze({ id: dto.id, name: dto.name, avatarUrl: dto.avatarUrl ?? null });

export const toUser = (dto) => freeze({ ...toUserRef(dto), email: dto.email });

export const toWorkspace = (dto) => freeze({ id: dto.id, name: dto.name, role: dto.role, createdAt: toDate(dto.createdAt) });

export const toMember = (dto) => freeze({
  user: toUserRef(dto.user),
  email: dto.email,
  role: dto.role,
  joinedAt: toDate(dto.joinedAt),
});

export const toClientRef = (dto) => freeze({ id: dto.id, name: dto.name, colour: String(dto.colour).toLowerCase() });

export const toClient = (dto) => freeze({
  ...toClientRef(dto),
  taskCount: dto.taskCount ?? 0,
  docCount: dto.docCount ?? 0,
  version: dto.version,
});

export const toLabel = (dto) => freeze({ id: dto.id, name: dto.name, colour: String(dto.colour).toLowerCase() });

export const toTask = (dto) => freeze({
  id: dto.id,
  title: dto.title,
  ...(dto.description !== undefined ? { description: dto.description } : {}),
  status: status(dto.status),
  priority: priority(dto.priority),
  startDate: dto.startDate ?? null,
  endDate: dto.endDate ?? null,
  dueDate: dto.dueDate ?? null,
  position: dto.position,
  checklist: freeze({ done: dto.checklist?.done ?? 0, total: dto.checklist?.total ?? 0 }),
  commentCount: dto.commentCount ?? 0,
  createdBy: toUserRef(dto.createdBy),
  createdAt: toDate(dto.createdAt),
  updatedAt: toDate(dto.updatedAt),
  assignees: freeze((dto.assignees ?? []).map(toUserRef)),
  clients: freeze((dto.clients ?? []).map(toClientRef)),
  labels: freeze((dto.labels ?? []).map(toLabel)),
  version: dto.version,
});

export const toCalendarTask = (dto) => freeze({
  id: dto.id,
  title: dto.title,
  status: status(dto.status),
  priority: priority(dto.priority),
  dueDate: dto.dueDate ?? null,
});

export const toTaskStats = (dto) => freeze({
  groupBy: dto.groupBy,
  total: dto.total,
  groups: freeze(dto.groups.map((g) => freeze({ key: g.key, count: g.count, ...(g.user ? { user: toUserRef(g.user) } : {}) }))),
  ...(dto.unassignedCount !== undefined ? { unassignedCount: dto.unassignedCount } : {}),
});

export const toDashboard = (dto) => freeze({
  today: dto.today,
  stats: freeze({ ...dto.stats }),
  dueSoon: freeze((dto.dueSoon ?? []).map(toTask)),
  awaitingReview: freeze([...(dto.awaitingReview ?? [])]),
});

export const toInboxItem = (dto) => freeze({
  id: dto.id,
  kind: dto.kind,
  read: Boolean(dto.read),
  createdAt: toDate(dto.createdAt),
  actor: toUserRef(dto.actor),
  task: dto.task ? freeze({ id: dto.task.id, title: dto.task.title }) : null,
  excerpt: dto.excerpt ?? null,
});

/** List envelope → Page. */
export const toPage = (envelope, mapItem) => freeze({
  items: freeze(envelope.data.map(mapItem)),
  nextCursor: envelope.meta?.nextCursor ?? null,
});

/** Draft (domain) → TaskCreate DTO. */
export const fromTaskDraft = (draft) => ({
  title: draft.title,
  ...(draft.dueDate ? { dueDate: draft.dueDate } : {}),
  ...(draft.assigneeIds?.length ? { assigneeIds: draft.assigneeIds } : {}),
});

/**
 * Filter object → listTasks/getTaskStats query params. Empty values are dropped by HttpClient.
 * @param {import('../services/TaskService.js').TaskQuery} query
 */
export const toTaskQuery = (query = {}) => ({
  status: query.status,
  statusGroup: query.statusGroup,
  assigneeId: query.assigneeId,
  unassigned: query.unassigned,
  clientId: query.clientId,
  labelId: query.labelId,
  q: query.q?.trim() || undefined,
  dueFrom: query.dueFrom,
  dueTo: query.dueTo,
  hasDueDate: query.hasDueDate,
  view: query.view,
  sort: query.sort,
  limit: query.limit,
  cursor: query.cursor,
});
