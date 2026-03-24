type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 5000;

export function buildRequestCacheKey(
  method: string,
  url: string,
  headers?: HeadersInit,
): string {
  const authHeader =
    headers && typeof headers === 'object' && !Array.isArray(headers)
      ? (headers as Record<string, string>).Authorization || ''
      : '';

  return `${method.toUpperCase()}:${url}:${authHeader}`;
}

export function getCachedResponse<T>(key: string): T | null {
  const existing = responseCache.get(key);
  if (!existing) return null;

  if (existing.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }

  return existing.data as T;
}

export function setCachedResponse<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  responseCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function getPendingRequest<T>(key: string): Promise<T> | null {
  return (pendingRequests.get(key) as Promise<T> | undefined) || null;
}

export function setPendingRequest<T>(key: string, promise: Promise<T>): void {
  pendingRequests.set(key, promise as Promise<unknown>);
}

export function clearPendingRequest(key: string): void {
  pendingRequests.delete(key);
}

export function clearRequestCache(): void {
  responseCache.clear();
  pendingRequests.clear();
}
