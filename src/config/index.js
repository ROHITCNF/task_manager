/**
 * @typedef {{
 *   apiMode: 'mock'|'live',
 *   apiBaseUrl: string,
 *   authMode: 'mock'|'google',
 *   requestTimeoutMs: number,
 * }} AppConfig
 */

/** @type {Readonly<AppConfig>} */
export const config = Object.freeze({
  apiMode: import.meta.env.VITE_API_MODE === 'live' ? 'live' : 'mock',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  authMode: import.meta.env.VITE_AUTH_MODE === 'google' ? 'google' : 'mock',
  requestTimeoutMs: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS || 15000),
});
