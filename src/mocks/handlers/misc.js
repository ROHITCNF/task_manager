import { http, HttpResponse } from 'msw';
import { db } from '../db.js';
import { API, newId, one, paginate, problem, requireMember, versionFromIfMatch } from './support.js';

const clientsOf = (workspaceId) => db.state.clients.filter((c) => c.workspaceId === workspaceId);
const emptyPage = (request) => Response.json(paginate([], new URL(request.url)));

export const miscHandlers = [
  // ── clients ──
  http.get(`${API}/workspaces/:workspaceId/clients`, ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim().toLowerCase();
    // Binary (code-unit) collation: uppercase sorts first, e.g. "BGauss" < "Battery Smart" (api-contract.md §4).
    const clients = clientsOf(params.workspaceId)
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map((c) => db.clientDto(c));
    return Response.json(paginate(clients, url));
  }),

  http.post(`${API}/workspaces/:workspaceId/clients`, async ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const { name, colour } = await request.json();
    if (!name?.trim()) return problem(422, 'validation_failed', 'Validation failed', [{ field: 'name', code: 'required', message: 'Name is required' }]);
    if (clientsOf(params.workspaceId).some((c) => c.name === name.trim())) return problem(409, 'conflict', 'A client with this name already exists');
    const client = { id: newId('cli'), workspaceId: params.workspaceId, name: name.trim(), colour: colour ?? '#418faf', docCount: 0, version: 1, createdAt: new Date().toISOString() };
    db.state.clients.push(client);
    return one(db.clientDto(client), 201);
  }),

  http.patch(`${API}/workspaces/:workspaceId/clients/:clientId`, async ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const client = clientsOf(params.workspaceId).find((c) => c.id === params.clientId);
    if (!client) return problem(404, 'not_found', 'Client not found');
    if (versionFromIfMatch(request) !== client.version) return problem(412, 'precondition_failed', 'Client was changed by someone else');
    const patch = await request.json();
    if (patch.name) client.name = patch.name.trim();
    if (patch.colour) client.colour = patch.colour;
    client.version += 1;
    return one(db.clientDto(client));
  }),

  http.delete(`${API}/workspaces/:workspaceId/clients/:clientId`, ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const index = db.state.clients.findIndex((c) => c.workspaceId === params.workspaceId && c.id === params.clientId);
    if (index < 0) return problem(404, 'not_found', 'Client not found');
    if (versionFromIfMatch(request) !== db.state.clients[index].version) return problem(412, 'precondition_failed', 'Client was changed by someone else');
    db.state.clients.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── labels ──
  http.get(`${API}/workspaces/:workspaceId/labels`, ({ params }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    return one(db.state.labels.filter((l) => l.workspaceId === params.workspaceId).map((l) => db.labelRef(l.id)));
  }),

  // ── quick capture ──
  http.post(`${API}/workspaces/:workspaceId/quick-capture/split`, async ({ params, request }) => {
    const ctx = requireMember(params.workspaceId);
    if (ctx.response) return ctx.response;
    const { text } = await request.json();
    if (!text?.trim()) return problem(422, 'validation_failed', 'Validation failed', [{ field: 'text', code: 'required', message: 'Text is required' }]);
    const drafts = text.split('\n')
      .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)]|\[[ xX]?\])\s*/, '').trim())
      .filter(Boolean)
      .map((title) => ({ title }));
    return one({ drafts });
  }),

  // ── future UI (empty but contract-shaped) ──
  http.get(`${API}/workspaces/:workspaceId/inbox`, ({ params, request }) => requireMember(params.workspaceId).response ?? emptyPage(request)),
  http.get(`${API}/workspaces/:workspaceId/docs`, ({ params, request }) => requireMember(params.workspaceId).response ?? emptyPage(request)),
  http.get(`${API}/workspaces/:workspaceId/change-requests`, ({ params, request }) => requireMember(params.workspaceId).response ?? emptyPage(request)),
];
