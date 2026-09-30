import { UnauthenticatedError } from '../data/errors/index.js';

/** @typedef {{ status: 'idle'|'loading'|'success'|'error', error: Error|null }} Req */

export const IDLE = Object.freeze({ status: 'idle', error: null });
export const LOADING = Object.freeze({ status: 'loading', error: null });
export const SUCCESS = Object.freeze({ status: 'success', error: null });
export const failure = (error) => Object.freeze({ status: 'error', error });

/**
 * Tracks the latest request per key so stale responses can be ignored
 * (e.g. fast filter changes). start(key) returns isCurrent().
 */
export function createRequestTracker() {
  const tokens = new Map();
  return {
    start(key) {
      const token = (tokens.get(key) ?? 0) + 1;
      tokens.set(key, token);
      return () => tokens.get(key) === token;
    },
    invalidateAll() {
      for (const key of tokens.keys()) tokens.set(key, tokens.get(key) + 1);
    },
  };
}

/**
 * Normalises a caught error: triggers sign-out handling on 401 and returns the failed Req.
 * @param {unknown} error
 * @param {{ onUnauthenticated?: () => void }} deps
 */
export function toFailure(error, deps) {
  if (error instanceof UnauthenticatedError) deps.onUnauthenticated?.();
  return failure(error);
}
