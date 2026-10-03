import { useState, useEffect, useRef, useCallback } from "react";

// Global in-memory cache and subscriber bus
class QueryClient {
  constructor() {
    this.cache = new Map();
    this.inFlight = new Map();
    this.subscribers = new Map();
  }

  getKey(queryKey) {
    return Array.isArray(queryKey) ? JSON.stringify(queryKey) : String(queryKey);
  }

  getQueryData(queryKey) {
    const key = this.getKey(queryKey);
    return this.cache.get(key)?.data;
  }

  setQueryData(queryKey, updater) {
    const key = this.getKey(queryKey);
    const existing = this.cache.get(key);
    const newData = typeof updater === "function" ? updater(existing?.data) : updater;
    this.cache.set(key, {
      data: newData,
      updatedAt: Date.now(),
      isStale: false,
    });
    this.notify(key, newData);
    return newData;
  }

  subscribe(queryKey, callback) {
    const key = this.getKey(queryKey);
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  notify(key, data) {
    this.subscribers.get(key)?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error("Query subscriber error:", err);
      }
    });
  }

  invalidateQueries(targetKey) {
    const targetKeyStr = targetKey ? this.getKey(targetKey) : null;
    this.cache.forEach((entry, key) => {
      if (!targetKeyStr || key.startsWith(targetKeyStr.replace(/\]$/, ""))) {
        entry.isStale = true;
      }
    });

    this.subscribers.forEach((callbacks, key) => {
      if (!targetKeyStr || key.startsWith(targetKeyStr.replace(/\]$/, ""))) {
        callbacks.forEach((cb) => cb({ shouldRefetch: true }));
      }
    });
  }
}

export const queryClient = new QueryClient();

/**
 * TanStack-compatible useQuery hook.
 * Replaces raw setInterval polling with smart, tab-aware interval polling,
 * background tab throttling, window-focus refetching, and query deduplication.
 */
export function useQuery({
  queryKey,
  queryFn,
  enabled = true,
  refetchInterval = false,
  refetchOnWindowFocus = true,
  staleTime = 0,
}) {
  const keyStr = queryClient.getKey(queryKey);
  const cached = queryClient.cache.get(keyStr);

  const [data, setData] = useState(cached?.data);
  const [isLoading, setIsLoading] = useState(!cached && enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!enabled) return;

      // In-flight deduplication
      if (queryClient.inFlight.has(keyStr)) {
        return queryClient.inFlight.get(keyStr);
      }

      if (!isBackground && !data) {
        setIsLoading(true);
      }
      setIsFetching(true);

      const promise = (async () => {
        try {
          const result = await queryFnRef.current();
          queryClient.cache.set(keyStr, {
            data: result,
            updatedAt: Date.now(),
            isStale: false,
          });
          setData(result);
          setError(null);
          queryClient.notify(keyStr, result);
          return result;
        } catch (err) {
          setError(err);
          throw err;
        } finally {
          setIsLoading(false);
          setIsFetching(false);
          queryClient.inFlight.delete(keyStr);
        }
      })();

      queryClient.inFlight.set(keyStr, promise);
      return promise;
    },
    [keyStr, enabled, data]
  );

  // Initial and reactive fetch
  useEffect(() => {
    if (!enabled) return;

    const currentCached = queryClient.cache.get(keyStr);
    const isExpired = !currentCached || Date.now() - currentCached.updatedAt > staleTime || currentCached.isStale;

    if (isExpired) {
      fetchData(Boolean(currentCached?.data));
    } else {
      setData(currentCached.data);
      setIsLoading(false);
    }

    // Subscribe to cache updates and invalidations
    const unsubscribe = queryClient.subscribe(queryKey, (update) => {
      if (update?.shouldRefetch) {
        fetchData(true);
      } else if (update !== undefined) {
        setData(update);
      }
    });

    return () => unsubscribe();
  }, [keyStr, enabled, staleTime, fetchData, queryKey]);

  // Window Focus Refetching
  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchData(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [enabled, refetchOnWindowFocus, fetchData]);

  // Tab-Aware Smart Interval Polling
  useEffect(() => {
    if (!enabled || !refetchInterval || refetchInterval <= 0) return;

    let intervalId = null;

    const startInterval = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        // TanStack behavior: pause polling when browser tab is hidden to save network/resources
        if (document.visibilityState === "visible") {
          fetchData(true);
        }
      }, refetchInterval);
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchData(true);
        startInterval();
      } else {
        stopInterval();
      }
    };

    startInterval();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, refetchInterval, fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    isLoading,
    isFetching,
    isError: Boolean(error),
    error,
    refetch,
  };
}
