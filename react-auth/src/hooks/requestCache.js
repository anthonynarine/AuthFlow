import { authAxios } from "../interceptors/axios";

/**
 * UI1.1 — the smallest safe frontend fix for the N+1 per-case
 * workflow-snapshot/investigation-summary fetching UI1 flagged
 * (BACKEND_UI_CONTRACT_GAP: BULK_WORKFLOW_SNAPSHOT — no bulk endpoint
 * exists on the backend as of this milestone; re-checked read-only).
 *
 * This is deliberately NOT a data-fetching framework: no query keys,
 * no background refetch policies, no cache invalidation graph. It does
 * exactly two things a plain Promise.all-per-case loop doesn't:
 *
 *   1. De-dupes identical concurrent GETs — if Home, Issues, and Security
 *      Team all want the same case's snapshot within the same tick, only
 *      one request goes out.
 *   2. Holds each response for a short TTL so back-and-forth navigation
 *      (Home -> Issues -> Home) doesn't re-fetch unchanged data on every
 *      mount.
 *
 * The TTL is intentionally short (security truth must stay fresh, not be
 * cached indefinitely) and every consumer can still force a real network
 * call with `bypassCache: true` — used after any action that changes
 * backend state (e.g. a deployment approval decision).
 */

const DEFAULT_TTL_MS = 15000;

const cache = new Map(); // key -> { data, expiresAt }
const inFlight = new Map(); // key -> Promise<{ data }>

function cacheKey(url, params) {
  return params ? `${url}::${JSON.stringify(params)}` : url;
}

export function cachedGet(url, { params, ttlMs = DEFAULT_TTL_MS, bypassCache = false } = {}) {
  const key = cacheKey(url, params);

  if (!bypassCache) {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve({ data: cached.data });
    }

    const pending = inFlight.get(key);
    if (pending) {
      return pending;
    }
  }

  const request = authAxios
    .get(url, params ? { params } : undefined)
    .then((response) => {
      cache.set(key, { data: response.data, expiresAt: Date.now() + ttlMs });
      inFlight.delete(key);
      return response;
    })
    .catch((error) => {
      inFlight.delete(key);
      throw error;
    });

  inFlight.set(key, request);
  return request;
}

/** Drop any cached/in-flight entry whose key starts with `urlPrefix` — call
 * after an action that changes backend state so the next read is real. */
export function invalidateCached(urlPrefix) {
  [...cache.keys()].forEach((key) => {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  });
  [...inFlight.keys()].forEach((key) => {
    if (key.startsWith(urlPrefix)) {
      inFlight.delete(key);
    }
  });
}

/** Test-only escape hatch: nothing in app code should call this. */
export function __clearRequestCacheForTests() {
  cache.clear();
  inFlight.clear();
}
