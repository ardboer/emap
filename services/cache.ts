import { brandManager } from "@/config/BrandManager";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "wp_cache6_";
const CACHE_VERSION = "1.0";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  brand: string;
}

export interface CacheStats {
  totalKeys: number;
  totalSize: number; // Approximate size in bytes
  oldestEntry?: Date;
  newestEntry?: Date;
}

class CacheService {
  private generateCacheKey(
    endpoint: string,
    params?: Record<string, any>
  ): string {
    const brand = brandManager.getCurrentBrand().shortcode;
    const paramsHash = params ? this.hashParams(params) : "";
    return `${CACHE_PREFIX}${brand}_${endpoint}${
      paramsHash ? `_${paramsHash}` : ""
    }`;
  }

  private hashParams(params: Record<string, any>): string {
    // Simple hash function for parameters
    const str = JSON.stringify(params, Object.keys(params).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T | null> {
    try {
      const key = this.generateCacheKey(endpoint, params);
      const cached = await AsyncStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Validate cache entry
      if (entry.version !== CACHE_VERSION) {
        // Remove outdated cache entry
        await AsyncStorage.removeItem(key);
        return null;
      }

      // Check if cache is for current brand
      if (entry.brand !== brandManager.getCurrentBrand().shortcode) {
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn("Cache get error:", error);
      return null;
    }
  }

  async set<T>(
    endpoint: string,
    data: T,
    params?: Record<string, any>
  ): Promise<void> {
    try {
      const key = this.generateCacheKey(endpoint, params);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        brand: brandManager.getCurrentBrand().shortcode,
      };

      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn("Cache set error:", error);
      // Don't throw error - caching is not critical
    }
  }

  async remove(endpoint: string, params?: Record<string, any>): Promise<void> {
    try {
      const key = this.generateCacheKey(endpoint, params);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn("Cache remove error:", error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error("Cache clear all error:", error);
      throw error;
    }
  }

  async clearBrandCache(brand?: string): Promise<void> {
    try {
      const targetBrand = brand || brandManager.getCurrentBrand().shortcode;
      const keys = await AsyncStorage.getAllKeys();
      const brandCacheKeys = keys.filter(
        (key) =>
          key.startsWith(CACHE_PREFIX) && key.includes(`_${targetBrand}_`)
      );

      if (brandCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(brandCacheKeys);
      }
    } catch (error) {
      console.error("Cache clear brand error:", error);
      throw error;
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

      if (cacheKeys.length === 0) {
        return {
          totalKeys: 0,
          totalSize: 0,
        };
      }

      const cacheEntries = await AsyncStorage.multiGet(cacheKeys);
      let totalSize = 0;
      let oldestTimestamp = Date.now();
      let newestTimestamp = 0;

      for (const [key, value] of cacheEntries) {
        if (value) {
          totalSize += value.length;
          try {
            const entry = JSON.parse(value);
            if (entry.timestamp) {
              oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
              newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      }

      return {
        totalKeys: cacheKeys.length,
        totalSize,
        oldestEntry:
          oldestTimestamp < Date.now() ? new Date(oldestTimestamp) : undefined,
        newestEntry:
          newestTimestamp > 0 ? new Date(newestTimestamp) : undefined,
      };
    } catch (error) {
      console.error("Cache stats error:", error);
      return {
        totalKeys: 0,
        totalSize: 0,
      };
    }
  }

  // Helper method to format cache size for display
  formatCacheSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }
}

export const cacheService = new CacheService();
