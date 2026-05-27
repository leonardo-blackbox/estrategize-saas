/**
 * metaInsightsCache — Cache in-memory simples com TTL.
 * Epic 10, Story 10.3.
 *
 * TTL defaults por tipo (sobrescrever via set(key, value, ttl)):
 * - account: 1h
 * - media-list: 30min
 * - media-insights: 6h
 * - audience: 24h
 *
 * Cleanup automático a cada 5 minutos.
 * Interface preparada para troca por Redis sem mudar callers.
 */
import { logger } from '../lib/logger.js';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export const TTL = {
  account: 60 * 60,           // 1h
  mediaList: 30 * 60,         // 30min
  mediaInsights: 6 * 60 * 60, // 6h
  audience: 24 * 60 * 60,     // 24h
  connection: 60,             // 1min — para evitar fetches repetidos da connection
};

const store = new Map<string, Entry<unknown>>();

let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt <= now) {
        store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      logger.debug('[metaCache] cleaned', { removed, remaining: store.size });
    }
  }, 5 * 60 * 1000);
  cleanupTimer.unref?.();
}

export function get<T>(key: string): T | null {
  startCleanup();
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function set<T>(key: string, value: T, ttlSeconds: number): void {
  startCleanup();
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function del(key: string): void {
  store.delete(key);
}

export function clearAll(): void {
  store.clear();
}

export function cacheKey(consultancyId: string, kind: string, suffix?: string): string {
  return `meta:${consultancyId}:${kind}${suffix ? `:${suffix}` : ''}`;
}

/** Higher-order wrapper: cache-then-fetch */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = get<T>(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  set(key, fresh, ttlSeconds);
  return fresh;
}
