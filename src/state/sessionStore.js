import { createStore } from 'zustand/vanilla';
import { IDLE, LOADING, SUCCESS, failure } from './request.js';

/**
 * @param {{ auth: import('../data/services/AuthService.js').AuthService }} services
 * @param {{ onSignedOut: () => void }} deps  resets the other stores
 */
export function createSessionStore({ auth }, deps) {
  return createStore((set, get) => ({
    /** @type {import('../domain/models.js').User|null} */
    user: null,
    /** @type {'unknown'|'signedOut'|'signedIn'} */
    phase: 'unknown',
    req: IDLE,

    async bootstrap() {
      set({ req: LOADING });
      try {
        const user = await auth.getSession();
        set({ user, phase: user ? 'signedIn' : 'signedOut', req: SUCCESS });
      } catch (error) {
        set({ user: null, phase: 'signedOut', req: failure(error) });
      }
    },

    async signIn(opts) {
      set({ req: LOADING });
      try {
        const user = await auth.signIn(opts);
        set({ user, phase: 'signedIn', req: SUCCESS });
      } catch (error) {
        set({ req: failure(error) });
      }
    },

    async signOut() {
      try {
        await auth.signOut();
      } catch {
        // The local session ends regardless; the server session expires on its own.
      }
      deps.onSignedOut();
      set({ user: null, phase: 'signedOut', req: IDLE });
    },

    /** Called by any store that receives a 401. */
    handleUnauthenticated() {
      if (get().phase === 'signedOut') return;
      deps.onSignedOut();
      set({ user: null, phase: 'signedOut', req: IDLE });
    },
  }));
}
