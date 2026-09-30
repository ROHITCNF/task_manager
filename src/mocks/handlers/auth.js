import { http, HttpResponse } from 'msw';
import { db } from '../db.js';
import { API, one, requireUser } from './support.js';

const session = (user) => ({ user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl, email: user.email } });

export const authHandlers = [
  http.get(`${API}/auth/session`, () => {
    const auth = requireUser();
    return auth.response ?? one(session(auth.user));
  }),

  http.post(`${API}/auth/mock-login`, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return one(session(db.signIn(body?.email)));
  }),

  http.post(`${API}/auth/logout`, () => {
    db.signOut();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/me`, () => {
    const auth = requireUser();
    return auth.response ?? one(session(auth.user).user);
  }),

  http.get(`${API}/me/workspaces`, () => {
    const auth = requireUser();
    if (auth.response) return auth.response;
    const mine = db.state.workspaces.filter((w) => db.membership(w.id, auth.user.id));
    return one(mine.map((w) => db.workspaceDto(w, auth.user.id)));
  }),
];
