import { ListViewType } from "@/types/ads";
import { Platform } from "react-native";
import { NativeAd } from "react-native-google-mobile-ads";
import { analyticsService } from "./analytics";
import { nativeAdVariantManager } from "./nativeAdVariantManager";

interface CachedAd {
  ad: NativeAd;
  loadTime: number;
  position: number;
}

/**
 * Handles loading and caching of list view native ads
 * Manages ad lifecycle for list item variants
 */
class NativeAdListLoader {
  private cache: Map<string, CachedAd> = new Map();
  private loadingQueue: Set<string> = new Set();
  private totalAdsLoaded: number = 0;

  /**
   * Generate cache key for a specific view and position
   */
  private getCacheKey(viewType: ListViewType, position: number): string {
    return `${viewType}-${position}`;
  }

  /**
   * Load ad for a specific position in a list view
   */
  async loadAdForListPosition(
    viewType: ListViewType,
    position: number
  ): Promise<NativeAd | null> {
    const cacheKey = this.getCacheKey(viewType, position);

    // Check if already loaded
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Using cached ad for ${viewType} at position ${position}`);
      return cached.ad;
    }

    // Check if already loading
    if (this.loadingQueue.has(cacheKey)) {
      console.log(
        `⏳ Ad already loading for ${viewType} at position ${position}`
      );
      return null;
    }

    // Check if variant is enabled
    if (!nativeAdVariantManager.isVariantEnabled("listItem")) {
      console.log("⚠️ List view native ads are not enabled");
      return null;
    }

    // Get ad unit ID
    const adUnitId = nativeAdVariantManager.getAdUnitId("listItem");
    if (!adUnitId) {
      console.warn("⚠️ No ad unit ID configured for list view native ads");
      return null;
    }

    // Start loading
    this.loadingQueue.add(cacheKey);
    const loadStartTime = Date.now();

    try {
      console.log(
        `🔄 Loading native ad for ${viewType} at position ${position}...`
      );

      // Log request
      analyticsService.logEvent("native_ad_list_requested", {
        view_type: viewType,
        position,
        ad_unit_id: adUnitId,
        platform: Platform.OS,
        timestamp: loadStartTime,
      });

      // Create and load native ad
      const ad = await NativeAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      const loadTime = Date.now() - loadStartTime;

      // Cache the ad
      this.cache.set(cacheKey, {
        ad,
        loadTime,
        position,
      });

      this.totalAdsLoaded++;

      // Log success
      analyticsService.logEvent("native_ad_list_loaded", {
        view_type: viewType,
        position,
        load_time_ms: loadTime,
        total_loaded: this.totalAdsLoaded,
        platform: Platform.OS,
      });

      console.log(
        `✅ Native ad loaded for ${viewType} at position ${position} in ${loadTime}ms`
      );

      return ad;
    } catch (error: any) {
      console.error(
        `❌ Failed to load native ad for ${viewType} at position ${position}:`,
        error
      );

      // Log failure
      analyticsService.logEvent("native_ad_list_failed", {
        view_type: viewType,
        position,
        error_code: error?.code || "unknown",
        error_message: error?.message || "Unknown error",
        platform: Platform.OS,
      });

      return null;
    } finally {
      this.loadingQueue.delete(cacheKey);
    }
  }

  /**
   * Preload ads for upcoming positions
   */
  async preloadAdsForPositions(
    viewType: ListViewType,
    positions: number[]
  ): Promise<void> {
    const config = nativeAdVariantManager.getListViewGlobalConfig();
    if (!config?.preloadAds) {
      return;
    }

    console.log(`🔄 Preloading ads for ${viewType} at positions:`, positions);

    // Load ads in parallel (but don't wait for all to complete)
    const loadPromises = positions.map((position) =>
      this.loadAdForListPosition(viewType, position).catch((error) => {
        console.warn(`Failed to preload ad at position ${position}:`, error);
        return null;
      })
    );

    // Fire and forget - don't block on preloading
    Promise.all(loadPromises).then(() => {
      console.log(`✅ Preloading complete for ${viewType}`);
    });
  }

  /**
   * Get cached ad for a specific position
   */
  getCachedAd(viewType: ListViewType, position: number): NativeAd | null {
    const cacheKey = this.getCacheKey(viewType, position);
    const cached = this.cache.get(cacheKey);
    return cached?.ad || null;
  }

  /**
   * Check if ad is cached
   */
  isAdCached(viewType: ListViewType, position: number): boolean {
    const cacheKey = this.getCacheKey(viewType, position);
    return this.cache.has(cacheKey);
  }

  /**
   * Check if ad is currently loading
   */
  isAdLoading(viewType: ListViewType, position: number): boolean {
    const cacheKey = this.getCacheKey(viewType, position);
    return this.loadingQueue.has(cacheKey);
  }

  /**
   * Destroy and remove ad from cache
   */
  destroyAd(viewType: ListViewType, position: number): void {
    const cacheKey = this.getCacheKey(viewType, position);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log(`🗑️ Destroying ad for ${viewType} at position ${position}`);

      try {
        cached.ad.destroy?.();
      } catch (error) {
        console.warn(`Error destroying ad at ${cacheKey}:`, error);
      }

      this.cache.delete(cacheKey);

      // Log destruction
      analyticsService.logEvent("native_ad_list_destroyed", {
        view_type: viewType,
        position,
      });
    }
  }

  /**
   * Clear all ads for a specific view
   */
  clearViewAds(viewType: ListViewType): void {
    console.log(`🧹 Clearing all ads for ${viewType}`);

    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (key.startsWith(`${viewType}-`)) {
        try {
          cached.ad.destroy?.();
        } catch (error) {
          console.warn(`Error destroying ad at ${key}:`, error);
        }
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    console.log(`✅ Cleared ${keysToDelete.length} ads for ${viewType}`);
  }

  /**
   * Clear all cached ads
   */
  clearAll(): void {
    console.log("🧹 Clearing all list view native ads");

    for (const [key, cached] of this.cache.entries()) {
      try {
        cached.ad.destroy?.();
      } catch (error) {
        console.warn(`Error destroying ad at ${key}:`, error);
      }
    }

    this.cache.clear();
    this.loadingQueue.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedAds: this.cache.size,
      loadingAds: this.loadingQueue.size,
      totalLoaded: this.totalAdsLoaded,
    };
  }

  /**
   * Reset loader (useful for testing)
   */
  reset(): void {
    this.clearAll();
    this.totalAdsLoaded = 0;
    console.log("🔄 Native Ad List Loader reset");
  }
}

// Export singleton instance
export const nativeAdListLoader = new NativeAdListLoader();
export default nativeAdListLoader;
