import { NetworkError, toApiError } from '../errors/index.js';

/**
 * The single HTTP client (docs/lld/data-layer.md §3). Wraps fetch with the contract conventions:
 * credentials, CSRF header, JSON, If-Match, Idempotency-Key, timeouts, and problem+json errors.
 */
export class HttpClient {
  /** @param {{ baseUrl: string, timeoutMs: number, fetchImpl?: typeof fetch }} opts */
  constructor({ baseUrl, timeoutMs, fetchImpl }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl ?? ((...args) => globalThis.fetch(...args));
  }

  /**
   * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
   * @param {string} path  relative to baseUrl, starting with '/'
   * @param {{ query?: Record<string, unknown>, body?: unknown, ifMatch?: number, idempotencyKey?: string, signal?: AbortSignal }} [opts]
   * @returns {Promise<{ status: number, body: any, etag: string|null }>}
   */
  async request(method, path, { query, body, ifMatch, idempotencyKey, signal } = {}) {
    const headers = { Accept: 'application/json', 'X-Requested-With': 'dmt-web' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (ifMatch !== undefined) headers['If-Match'] = `"${ifMatch}"`;
    if (method === 'POST') headers['Idempotency-Key'] = idempotencyKey ?? globalThis.crypto.randomUUID();

    const timeout = AbortSignal.timeout(this.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    let res;
    try {
      res = await this.fetchImpl(this.url(path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'include',
        signal: combined,
      });
    } catch (error) {
      if (signal?.aborted) throw error; // caller cancelled: let AbortError through untouched
      const timedOut = timeout.aborted;
      throw new NetworkError(timedOut ? 'Request timed out' : 'Network request failed', { cause: error, code: timedOut ? 'timeout' : 'network' });
    }

    const parsed = await readBody(res);
    if (!res.ok) throw toApiError(res.status, parsed, res.headers);
    return { status: res.status, body: parsed, etag: res.headers.get('ETag') };
  }

  get(path, opts) { return this.request('GET', path, opts); }
  post(path, body, opts) { return this.request('POST', path, { ...opts, body }); }
  patch(path, body, opts) { return this.request('PATCH', path, { ...opts, body }); }
  delete(path, opts) { return this.request('DELETE', path, opts); }

  /** @private */
  url(path, query) {
    const origin = globalThis.location?.origin ?? 'http://localhost';
    const url = new URL(this.baseUrl + path, origin);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        if (value.length) url.searchParams.set(key, value.join(','));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}

async function readBody(res) {
  if (res.status === 204) return null;
  const type = res.headers.get('Content-Type') ?? '';
  if (!type.includes('json')) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}
