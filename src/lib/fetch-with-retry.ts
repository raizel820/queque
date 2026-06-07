/**
 * Fetch with automatic retry for transient errors.
 *
 * - Retries on 5xx server errors and 429 rate-limit responses
 * - Retries on network errors (fetch throws)
 * - Uses exponential backoff: 1s, 2s
 * - Maximum 2 retries by default
 */

export interface FetchWithRetryOptions extends RequestInit {
  /** Maximum number of retries (default: 2) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelay?: number;
}

/**
 * Fetch a URL with automatic retry for transient errors.
 * Returns the Response object or throws after all retries are exhausted.
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { maxRetries = 2, baseDelay = 1000, ...fetchOptions } = options;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);

      if (res.ok) {
        return res;
      }

      // Don't retry client errors (4xx) except 429
      if (res.status < 500 && res.status !== 429) {
        return res; // Return as-is so caller can handle
      }

      // If this is the last attempt, return as-is
      if (attempt >= maxRetries) {
        return res;
      }

      // Calculate backoff delay
      let delay = baseDelay * Math.pow(2, attempt);

      // For 429, respect Retry-After header
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        if (retryAfter) {
          const retryAfterMs = parseInt(retryAfter, 10) * 1000;
          delay = Math.min(retryAfterMs, 10000);
        }
      }

      await new Promise(r => setTimeout(r, delay));
      continue;
    } catch (error) {
      lastError = error;

      // If this is the last attempt, throw
      if (attempt >= maxRetries) {
        throw error;
      }

      // Network error — retry with backoff
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
    }
  }

  // Should not reach here, but just in case
  throw lastError;
}
