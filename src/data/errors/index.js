/** Typed errors surfaced by the data layer (docs/lld/data-layer.md §4). */

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, code?: string, requestId?: string, cause?: unknown }} [info]
   */
  constructor(message, { status = 0, code = 'internal', requestId, cause } = {}) {
    super(message, { cause });
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export class NetworkError extends ApiError {}
export class UnauthenticatedError extends ApiError {}
export class ForbiddenError extends ApiError {}
export class NotFoundError extends ApiError {}
export class ConflictError extends ApiError {}
export class StaleVersionError extends ApiError {}
export class ServerError extends ApiError {}

export class ValidationError extends ApiError {
  constructor(message, info = {}, fieldErrors = {}) {
    super(message, info);
    /** @type {Record<string, string>} */
    this.fieldErrors = fieldErrors;
  }
}

export class RateLimitedError extends ApiError {
  constructor(message, info = {}, retryAfterSec = 0) {
    super(message, info);
    this.retryAfterSec = retryAfterSec;
  }
}

/** Raised by mappers when a response does not match the contract (e.g. an unknown enum value). */
export class MappingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MappingError';
  }
}

/**
 * Builds the typed error for a non-2xx response.
 * @param {number} status
 * @param {any} problem  parsed problem+json body, or null
 * @param {Headers} [headers]
 * @returns {ApiError}
 */
export function toApiError(status, problem, headers) {
  const info = {
    status,
    code: problem?.code ?? (status >= 500 ? 'internal' : 'unknown'),
    requestId: problem?.requestId,
  };
  const message = problem?.detail || problem?.title || `HTTP ${status}`;

  switch (status) {
    case 401: return new UnauthenticatedError(message, info);
    case 403: return new ForbiddenError(message, info);
    case 404: return new NotFoundError(message, info);
    case 409: return new ConflictError(message, info);
    case 412:
    case 428: return new StaleVersionError(message, info);
    case 422: {
      const fieldErrors = Object.fromEntries((problem?.errors ?? []).map((e) => [e.field, e.message]));
      return new ValidationError(message, info, fieldErrors);
    }
    case 429: return new RateLimitedError(message, info, Number(headers?.get('Retry-After') ?? 0));
    default: return status >= 500 ? new ServerError(message, info) : new ApiError(message, info);
  }
}
