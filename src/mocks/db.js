/**
 * In-memory mock database. Acts as the server: stores records, expands them to wire DTOs.
 * Must not import client code (ADR-0006).
 */
import { USERS, WORKSPACES, DMT_WORKSPACE_ID, DMT_MEMBERS, INVITES, MOCK_LOGIN_USER_KEY } from './fixtures/people.js';
import { CLIENTS, DOCS, LABELS } from './fixtures/clients.js';
import { buildTasks } from './fixtures/tasks.js';

const SESSION_KEY = 'dmt.mock.session';
const clone = (value) => structuredClone(value);

function initialState() {
  const clientIdByName = Object.fromEntries(CLIENTS.map((c) => [c.name, c.id]));
  const tasks = buildTasks().map(({ createdByKey, assigneeKeys, clientNames, events, ...rest }) => ({
    ...rest,
    events: events.map(({ byKey, ...e }, i) => ({ ...e, id: `evt_${rest.id.slice(4)}_${i + 1}`, actorId: USERS[byKey].id })),
    workspaceId: DMT_WORKSPACE_ID,
    createdById: USERS[createdByKey].id,
    assigneeIds: assigneeKeys.map((k) => USERS[k].id),
    clientIds: clientNames.map((name) => {
      if (!clientIdByName[name]) throw new Error(`Fixture client "${name}" missing`);
      return clientIdByName[name];
    }),
  }));

  return {
    users: Object.fromEntries(Object.values(USERS).map((u) => [u.id, clone(u)])),
    workspaces: WORKSPACES.map(clone),
    memberships: DMT_MEMBERS.map((m) => ({ workspaceId: DMT_WORKSPACE_ID, userId: USERS[m.userKey].id, role: m.role, joinedAt: m.joinedAt })),
    clients: CLIENTS.map(({ key: _key, ...c }) => ({ ...c, workspaceId: DMT_WORKSPACE_ID })),
    labels: LABELS.map((l) => ({ ...l, workspaceId: DMT_WORKSPACE_ID })),
    docs: DOCS.map((d) => ({ ...d, workspaceId: DMT_WORKSPACE_ID })),
    tasks,
    invites: clone(INVITES),
    sessionUserId: null,
  };
}

const storage = () => {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
};

export const db = {
  state: initialState(),

  reset() {
    this.state = initialState();
    storage()?.removeItem(SESSION_KEY);
  },

  // ── session ──
  sessionUser() {
    const id = this.state.sessionUserId ?? storage()?.getItem(SESSION_KEY) ?? null;
    return id ? this.state.users[id] ?? null : null;
  },
  signIn(email) {
    const user = Object.values(this.state.users).find((u) => u.email === email) ?? USERS[MOCK_LOGIN_USER_KEY];
    this.state.sessionUserId = user.id;
    storage()?.setItem(SESSION_KEY, user.id);
    return this.state.users[user.id];
  },
  signOut() {
    this.state.sessionUserId = null;
    storage()?.removeItem(SESSION_KEY);
  },

  // ── lookups ──
  membership(workspaceId, userId) {
    return this.state.memberships.find((m) => m.workspaceId === workspaceId && m.userId === userId) ?? null;
  },
  workspace(workspaceId) {
    return this.state.workspaces.find((w) => w.id === workspaceId) ?? null;
  },

  // ── DTO expansion ──
  userRef(userId) {
    const u = this.state.users[userId];
    return { id: u.id, name: u.name, avatarUrl: u.avatarUrl };
  },
  clientRef(clientId) {
    const c = this.state.clients.find((x) => x.id === clientId);
    return { id: c.id, name: c.name, colour: c.colour };
  },
  labelRef(labelId) {
    const l = this.state.labels.find((x) => x.id === labelId);
    return { id: l.id, name: l.name, colour: l.colour };
  },
  workspaceDto(workspace, userId) {
    return { id: workspace.id, name: workspace.name, role: this.membership(workspace.id, userId)?.role ?? 'MEMBER', createdAt: workspace.createdAt };
  },
  /** Task permissions for a viewer (gap TD8 default): the creator or a workspace OWNER can edit. */
  permissionsFor(task, viewerId) {
    const owner = this.membership(task.workspaceId, viewerId)?.role === 'OWNER';
    return { canEdit: task.createdById === viewerId || owner, canComment: true };
  },
  /** @param {'card'|'calendar'|'full'} view */
  taskDto(task, view = 'card', viewerId = null) {
    if (view === 'calendar') {
      return { id: task.id, title: task.title, status: task.status, priority: task.priority, dueDate: task.dueDate };
    }
    const dto = {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate,
      endDate: task.endDate,
      dueDate: task.dueDate,
      position: task.position,
      checklist: { ...task.checklist },
      commentCount: task.commentCount,
      createdBy: this.userRef(task.createdById),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignees: task.assigneeIds.map((id) => this.userRef(id)),
      clients: task.clientIds.map((id) => this.clientRef(id)),
      labels: task.labelIds.map((id) => this.labelRef(id)),
      version: task.version,
      permissions: this.permissionsFor(task, viewerId),
    };
    return view === 'full' ? { ...dto, description: task.description } : dto;
  },
  historyDto(task) {
    const created = { id: `evt_${task.id.slice(4)}_0`, type: 'created', actor: this.userRef(task.createdById), createdAt: task.createdAt };
    const events = task.events.map(({ actorId, ...e }) => ({ ...e, actor: this.userRef(actorId) }));
    return {
      stages: [{ status: task.status, enteredAt: task.createdAt, exitedAt: null, approximate: true }],
      events: [created, ...events],
    };
  },
  docDto(doc) {
    return { id: doc.id, title: doc.title, client: doc.clientId ? this.clientRef(doc.clientId) : null, updatedAt: doc.updatedAt };
  },
  clientDto(client) {
    const taskCount = this.state.tasks.filter((t) => t.clientIds.includes(client.id)).length;
    const docCount = this.state.docs.filter((d) => d.clientId === client.id).length;
    return { id: client.id, name: client.name, colour: client.colour, taskCount, docCount, version: client.version, createdAt: client.createdAt };
  },
  memberDto(membership) {
    const u = this.state.users[membership.userId];
    return { user: this.userRef(u.id), email: u.email, role: membership.role, joinedAt: membership.joinedAt };
  },
};
