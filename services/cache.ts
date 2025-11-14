/**
 * Cache Service - DISABLED
 *
 * This cache service has been disabled to test server performance
 * and will be replaced with a more sophisticated caching solution later.
 *
 * All methods are now no-ops that return null/undefined.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  brand: string;
}

export interface CacheStats {
  totalKeys: number;
  totalSize: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

class CacheService {
  async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T | null> {
    // Cache disabled - always return null
    return null;
  }

  async set<T>(
    endpoint: string,
    data: T,
    params?: Record<string, any>
  ): Promise<void> {
    // Cache disabled - no-op
    return;
  }

  async remove(endpoint: string, params?: Record<string, any>): Promise<void> {
    // Cache disabled - no-op
    return;
  }

  async clearAll(): Promise<void> {
    // Cache disabled - no-op
    return;
  }

  async clearBrandCache(brand?: string): Promise<void> {
    // Cache disabled - no-op
    return;
  }

  async getCacheStats(): Promise<CacheStats> {
    // Cache disabled - return empty stats
    return {
      totalKeys: 0,
      totalSize: 0,
    };
  }

  formatCacheSize(bytes: number): string {
    return "0 B";
  }
}

export const cacheService = new CacheService();
