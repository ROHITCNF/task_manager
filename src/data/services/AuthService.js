import { UnauthenticatedError } from '../errors/index.js';
import { toUser } from '../mappers/index.js';

export class AuthService {
  /**
   * @param {import('../api/index.js').AuthApi} authApi
   * @param {{ authMode: 'mock'|'google' }} config
   * @param {{ assign: (url: string) => void }} [navigator]  full-page navigation (window.location in the browser)
   */
  constructor(authApi, config, navigator = globalThis.location) {
    this.authApi = authApi;
    this.config = config;
    this.navigator = navigator;
  }

  /** @returns {Promise<import('../../domain/models.js').User|null>} null when signed out */
  async getSession() {
    try {
      const body = await this.authApi.getSession();
      return toUser(body.data.user);
    } catch (error) {
      if (error instanceof UnauthenticatedError) return null;
      throw error;
    }
  }

  /**
   * mock: signs in via POST /auth/mock-login.
   * google: navigates away to the backend OAuth flow; the promise never resolves.
   * @param {{ returnTo?: string }} [opts]
   */
  async signIn({ returnTo } = {}) {
    if (this.config.authMode === 'google') {
      this.navigator.assign(this.authApi.googleStartUrl(returnTo));
      return new Promise(() => {});
    }
    const body = await this.authApi.mockLogin();
    return toUser(body.data.user);
  }

  async signOut() {
    await this.authApi.logout();
  }
}
