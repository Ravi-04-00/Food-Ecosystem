/**
 * Standardized API Error & Safe Transport Architecture for FD Foods Platform.
 * 
 * Complies with Phase 3 Clean Architecture Requirements:
 * 1. Consistent error envelope: { message, status, code, details, isNetworkError, isOffline }
 * 2. User-friendly human messages with technical details isolated in console/logs.
 * 3. Idempotent-only retries: GET/HEAD requests retry on transient network errors;
 *    non-idempotent POST/PATCH/DELETE mutations are strictly NEVER auto-retried without explicit key.
 * 4. Graceful handling of 401, 403, 404, 429, 500, network timeouts, and offline states.
 */

export class ApiError extends Error {
  constructor(message, status = 500, details = null, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = status === 0 || code === 'NETWORK_ERROR';
    this.isOffline = code === 'OFFLINE';
    this.isTimeout = code === 'TIMEOUT';
  }

  toJSON() {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      isNetworkError: this.isNetworkError,
      isOffline: this.isOffline
    };
  }
}

/**
 * Parses any backend payload (Django DRF, RFC7807, or generic HTTP) into a friendly message.
 */
export function extractErrorMessage(data, status = 500, fallbackMessage = 'An unexpected error occurred. Please try again.') {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You appear to be offline. Please check your internet connection.';
  }

  if (data && typeof data === 'object') {
    // 1. DRF standard detail
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    // 2. Custom error or message field
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    // 3. DRF non_field_errors array
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return String(data.non_field_errors[0]);
    }
    // 4. DRF field-level validation errors: { field: ["Error text"] }
    const fieldKeys = Object.keys(data);
    for (const key of fieldKeys) {
      const fieldVal = data[key];
      if (Array.isArray(fieldVal) && fieldVal.length > 0 && typeof fieldVal[0] === 'string') {
        const readableField = key.replace(/_/g, ' ');
        const capitalized = readableField.charAt(0).toUpperCase() + readableField.slice(1);
        return `${capitalized}: ${fieldVal[0]}`;
      }
      if (typeof fieldVal === 'string' && fieldVal.trim()) {
        const readableField = key.replace(/_/g, ' ');
        const capitalized = readableField.charAt(0).toUpperCase() + readableField.slice(1);
        return `${capitalized}: ${fieldVal}`;
      }
    }
  }

  // Fallback to HTTP status messages
  switch (status) {
    case 400:
      return 'The request contains invalid information. Please review your input.';
    case 401:
      return 'Your session has expired. Please sign in again to continue.';
    case 403:
      return 'You do not have permission to access this resource or perform this action.';
    case 404:
      return 'The requested resource was not found or has been removed.';
    case 409:
      return 'A conflict occurred with the current state of the resource. Please refresh.';
    case 429:
      return 'Too many requests. Please slow down and try again shortly.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Our servers are currently experiencing high load. Please try again in a few moments.';
    default:
      return fallbackMessage;
  }
}

/**
 * Resolves a normalized ApiError from a response and optional pre-parsed body.
 */
export async function normalizeApiError(response, customFallback) {
  if (!response) {
    const isOff = typeof navigator !== 'undefined' && navigator.onLine === false;
    return new ApiError(
      isOff ? 'You are offline. Please reconnect to the internet.' : 'Unable to connect to the server. Please check your connection.',
      0,
      null,
      isOff ? 'OFFLINE' : 'NETWORK_ERROR'
    );
  }

  const status = response.status || 500;
  let data = null;
  try {
    data = await response.clone().json();
  } catch {
    try {
      const text = await response.clone().text();
      data = text ? { detail: text } : null;
    } catch {
      data = null;
    }
  }

  let code = 'API_ERROR';
  if (status === 401) code = 'UNAUTHORIZED';
  else if (status === 403) code = 'FORBIDDEN';
  else if (status === 404) code = 'NOT_FOUND';
  else if (status === 409) code = 'CONFLICT';
  else if (status === 429) code = 'RATE_LIMITED';
  else if (status >= 400 && status < 500) code = 'VALIDATION_ERROR';
  else if (status >= 500) code = 'SERVER_ERROR';

  const message = extractErrorMessage(data, status, customFallback);
  return new ApiError(message, status, data, code);
}

/**
 * Safe fetch execution with timeout and strictly idempotent retry logic.
 * Retries are ONLY executed for idempotent HTTP methods (GET, HEAD) or when options.isIdempotent is true.
 * NEVER retries mutations like POST/PATCH without explicit idempotency confirmation.
 */
export async function safeFetchWithRetry(url, options = {}, config = {}) {
  const {
    timeoutMs = 15000,
    maxRetries = 2,
    retryDelayMs = 400,
    isIdempotent: explicitIdempotent = false
  } = config;

  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = explicitIdempotent || method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  const allowedRetries = isIdempotent ? maxRetries : 0;

  let attempt = 0;
  while (attempt <= allowedRetries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Merge abort signals if external signal was provided
      let signal = controller.signal;
      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(url, { ...options, signal });
      clearTimeout(timer);

      // Status 503/504 can be retried if request is idempotent
      if (isIdempotent && (response.status === 502 || response.status === 503 || response.status === 504) && attempt <= allowedRetries) {
        await new Promise(res => setTimeout(res, retryDelayMs * attempt));
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timer);

      const isAbort = err.name === 'AbortError';
      const isLastAttempt = attempt > allowedRetries;

      if (!isLastAttempt && isIdempotent) {
        await new Promise(res => setTimeout(res, retryDelayMs * attempt));
        continue;
      }

      if (isAbort) {
        throw new ApiError('Request timed out. The server took too long to respond.', 408, null, 'TIMEOUT');
      }

      const isOff = typeof navigator !== 'undefined' && navigator.onLine === false;
      throw new ApiError(
        isOff ? 'You are currently offline. Please reconnect.' : 'Network connection failed. Please check your connection.',
        0,
        { originalError: err.message },
        isOff ? 'OFFLINE' : 'NETWORK_ERROR'
      );
    }
  }
}
