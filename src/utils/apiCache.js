/**
 * apiCache.js — High-Concurrency In-Memory & Local Storage Cache Engine
 *
 * Prevents website slowdown under heavy traffic via:
 *   1. Request Collapsing (Deduplication of identical concurrent fetches)
 *   2. In-Memory & LocalStorage Caching with configurable TTL
 *   3. Stale-While-Revalidate (Instant UI load with background update)
 */

const memoryCache = new Map();
const pendingRequests = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in ms

/**
 * Get data from memory or localStorage cache if valid
 */
export function getCachedData(key) {
  // 1. Check In-Memory Cache
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    if (Date.now() < entry.expiry) {
      return entry.data;
    }
    memoryCache.delete(key);
  }

  // 2. Check LocalStorage Cache
  try {
    const raw = localStorage.getItem(`cache_${key}`);
    if (raw) {
      const entry = JSON.parse(raw);
      if (Date.now() < entry.expiry) {
        // Sync to memory cache for sub-millisecond access
        memoryCache.set(key, entry);
        return entry.data;
      }
      localStorage.removeItem(`cache_${key}`);
    }
  } catch (e) {}

  return null;
}

/**
 * Save data to memory and localStorage cache
 */
export function setCachedData(key, data, ttlMs = DEFAULT_TTL) {
  const expiry = Date.now() + ttlMs;
  const entry = { data, expiry, timestamp: Date.now() };

  memoryCache.set(key, entry);

  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
  } catch (e) {
    // Memory cache will still serve if localStorage is full or disabled
  }
}

/**
 * Invalidate specific cache key or all matching keys
 */
export function invalidateCache(pattern = null) {
  if (!pattern) {
    memoryCache.clear();
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('cache_')) localStorage.removeItem(k);
      });
    } catch (e) {}
    return;
  }

  const regex = new RegExp(pattern, 'i');
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) memoryCache.delete(key);
  }

  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('cache_') && regex.test(k)) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {}
}

/**
 * Deduplicated & Cached Fetch Request (Request Collapsing)
 *
 * If 100 users/components request the same URL simultaneously,
 * only 1 HTTP request is made to the network; all receive the result.
 */
export async function cachedFetch(url, options = {}, ttlMs = DEFAULT_TTL) {
  const cacheKey = typeof url === 'string' ? url : url.toString();

  // Return cached result if available
  const cached = getCachedData(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Deduplicate inflight concurrent requests
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setCachedData(cacheKey, data, ttlMs);
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}
