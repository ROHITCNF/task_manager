import { http } from 'msw';
import { db } from '../db.js';
import { API, newId, one, paginate, problem, requireMember, requireUser } from './support.js';

export const workspaceHandlers = [
  http.post(`${API}/workspaces`, async ({ request }) => {
    const auth = requireUser();
    if (auth.response) return auth.response;
    const { name } = await request.json();
    if (!name?.trim()) {
      return problem(422, 'validation_failed', 'Validation failed', [{ field: 'name', code: 'required', message: 'Name is required' }]);
    }
    const workspace = { id: newId('wsp'), name: name.trim(), createdAt: new Date().toISOString() };
    db.state.workspaces.push(workspace);
    db.state.memberships.push({ workspaceId: workspace.id, userId: auth.user.id, role: 'OWNER', joinedAt: workspace.createdAt });
    return one(db.workspaceDto(workspace, auth.user.id), 201);
  }),

  http.post(`${API}/workspaces/join`, async ({ request }) => {
    const auth = requireUser();
    if (auth.response) return auth.response;
    const { inviteCode } = await request.json();
    if (!inviteCode?.trim()) {
      return problem(422, 'validation_failed', 'Validation failed', [{ field: 'inviteCode', code: 'required', message: 'Invite code is required' }]);
    }
    const invite = db.state.invites[inviteCode.trim()];
    if (!invite) return problem(404, 'invalid_invite', 'Invite code not found');

    let workspace = db.workspace(invite.workspace.id);
    if (!workspace) {
      workspace = { ...invite.workspace };
      db.state.workspaces.push(workspace);
    }
    if (db.membership(workspace.id, auth.user.id)) return problem(409, 'already_member', 'Already a member of this workspace');
    db.state.memberships.push({ workspaceId: workspace.id, userId: auth.user.id, role: 'MEMBER', joinedAt: new Date().toISOString() });
    return one(db.workspaceDto(workspace, auth.user.id));
  }),

  http.get(`${API}/workspaces/:workspaceId`, ({ params }) => {
    const ctx = requireMember(params.workspaceId);
    return ctx.response ?? one(db.workspaceDto(ctx.workspace, ctx.user.id));
  }),

  http.get(`${API}/workspaces/:workspaceId/members`, ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const members = db.state.memberships
      .filter((m) => m.workspaceId === params.workspaceId)
      .sort((a, b) => (a.role === 'OWNER' ? -1 : 0) - (b.role === 'OWNER' ? -1 : 0) || a.joinedAt.localeCompare(b.joinedAt))
      .map((m) => db.memberDto(m));
    return Response.json(paginate(members, new URL(request.url)));
  }),
];
