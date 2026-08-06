import { useState, useEffect } from 'react';
import { getCachedData, setCachedData, cachedFetch } from '../utils/apiCache';

/**
 * useCachedQuery — Custom React Hook for Stale-While-Revalidate Caching
 *
 * Provides instant 0ms UI load using cached data while updating in the background.
 */
export function useCachedQuery(key, fetcherFn, options = {}) {
  const { ttlMs = 5 * 60 * 1000, enabled = true } = options;

  const cached = key ? getCachedData(key) : null;
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(cached === null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !key) return;

    let isMounted = true;
    const initialCached = getCachedData(key);

    if (initialCached !== null) {
      setData(initialCached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Revalidate in background
    (async () => {
      try {
        const result = await fetcherFn();
        if (isMounted) {
          setData(result);
          setCachedData(key, result, ttlMs);
          setError(null);
        }
      } catch (err) {
        if (isMounted && initialCached === null) {
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [key, enabled, ttlMs]);

  return { data, loading, error, refetch: fetcherFn };
}
