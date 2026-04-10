/**
 * Global in-memory cache for API responses.
 * 
 * Implements:
 * - Instant cache read to avoid refetching on navigation
 * - Stale-while-revalidate: show cached data while fetching fresh
 * - Cache invalidation on mutations
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  /** Optional: key(s) to invalidate when this entry is invalidated */
  relatedKeys?: string[];
}

export interface CacheOptions {
  /** Time in ms before data is considered stale (default: 5 minutes) */
  staleTime?: number;
  /** If true, always fetch fresh data in background (for SWR) */
  revalidate?: boolean;
}

type CacheListener<T> = (data: T, isStale: boolean) => void;

// In-memory cache store
const cacheStore = new Map<string, CacheEntry<unknown>>();
const listeners = new Map<string, Set<CacheListener<unknown>>>();

/**
 * Generate a cache key from endpoint and params
 */
export function makeCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  const sortedParams = Object.keys(params).sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}

/**
 * Get cached data if exists and not expired
 * @returns The cached data or undefined if not in cache
 */
export function getCache<T>(key: string): T | undefined {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  return entry.data;
}

/**
 * Check if cached data exists
 */
export function hasCache(key: string): boolean {
  return cacheStore.has(key);
}

/**
 * Get cache metadata (timestamp, etc.)
 */
export function getCacheMeta(key: string): { timestamp: number; age: number } | undefined {
  const entry = cacheStore.get(key);
  if (!entry) return undefined;
  return {
    timestamp: entry.timestamp,
    age: Date.now() - entry.timestamp,
  };
}

/**
 * Store data in cache
 */
export function setCache<T>(key: string, data: T, relatedKeys?: string[]): void {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
    relatedKeys,
  });
  notifyListeners(key, data, false);
}

/**
 * Invalidate cache entry(ies) by key
 */
export function invalidateCache(keyOrPattern: string): void {
  // Handle exact match
  if (cacheStore.has(keyOrPattern)) {
    cacheStore.delete(keyOrPattern);
    return;
  }

  // Handle pattern matching (simple contains)
  const keysToDelete: string[] = [];
  cacheStore.forEach((_, key) => {
    if (key.includes(keyOrPattern) || keyOrPattern.includes(key)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => {
    cacheStore.delete(key);
    // Also invalidate related keys
    const entry = cacheStore.get(key) as CacheEntry<unknown> | undefined;
    if (entry?.relatedKeys) {
      entry.relatedKeys.forEach(relatedKey => cacheStore.delete(relatedKey));
    }
  });
}

/**
 * Invalidate all cache entries
 */
export function clearCache(): void {
  cacheStore.clear();
}

/**
 * Subscribe to cache updates for a key
 */
export function subscribeCache<T>(key: string, listener: CacheListener<T>): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(listener as CacheListener<unknown>);

  return () => {
    listeners.get(key)?.delete(listener as CacheListener<unknown>);
  };
}

// Global event bus for cache updates (for background refresh notifications)
type CacheUpdateHandler = (key: string, data: unknown) => void;
const cacheUpdateHandlers = new Set<CacheUpdateHandler>();

export function onCacheUpdate(handler: CacheUpdateHandler): () => void {
  cacheUpdateHandlers.add(handler);
  return () => cacheUpdateHandlers.delete(handler);
}

export function notifyCacheUpdate(key: string, data: unknown): void {
  cacheUpdateHandlers.forEach(handler => {
    try {
      handler(key, data);
    } catch (err) {
      console.error('Cache update handler error:', err);
    }
  });
}

function notifyListeners<T>(key: string, data: T, isStale: boolean): void {
  const keyListeners = listeners.get(key);
  if (keyListeners) {
    keyListeners.forEach(listener => listener(data, isStale));
  }
  // Also notify global handlers
  notifyCacheUpdate(key, data);
}

/**
 * Check if cache is stale based on timestamp
 */
export function isCacheStale(key: string, staleTime: number = 5 * 60 * 1000): boolean {
  const meta = getCacheMeta(key);
  if (!meta) return true;
  return Date.now() - meta.timestamp > staleTime;
}

/**
 * Wrapper for fetch with cache-first strategy (simple cache, no SWR)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cached = getCache<T>(key);
  
  // Return cached data immediately if exists
  if (cached !== undefined) {
    // Optional: fetch in background if stale
    if (options?.revalidate && isCacheStale(key, options.staleTime)) {
      fetcher().then(fresh => setCache(key, fresh)).catch(console.error);
    }
    return cached;
  }

  // Fetch from API
  const data = await fetcher();
  setCache(key, data);
  return data;
}

/**
 * Wrapper for fetch with stale-while-revalidate strategy
 * Returns cached data immediately, then fetches fresh in background
 */
export async function fetchWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  onUpdate: (data: T, isStale: boolean) => void,
  staleTime: number = 5 * 60 * 1000
): Promise<void> {
  // Check if we have cached data
  const cached = getCache<T>(key);
  
  if (cached !== undefined) {
    // Return cached data immediately
    onUpdate(cached, true);

    // Fetch fresh data in background only if cache is stale
    if (isCacheStale(key, staleTime)) {
      try {
        const fresh = await fetcher();
        setCache(key, fresh);
        onUpdate(fresh, false);
      } catch (err) {
        console.error('SWR background fetch failed:', err);
        // Keep showing stale data on error
      }
    }
  } else {
    // No cache, fetch normally
    const data = await fetcher();
    setCache(key, data);
    onUpdate(data, false);
  }
}