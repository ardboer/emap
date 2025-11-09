import { Platform } from "react-native";
import { NativeAd } from "react-native-google-mobile-ads";
import { analyticsService } from "./analytics";
import { nativeAdLoader } from "./nativeAdLoader";
import { nativeAdService } from "./nativeAds";

export type AdStatus = "loading" | "loaded" | "failed" | "unloaded";

export interface AdInstance {
  position: number;
  nativeAd: NativeAd | null;
  status: AdStatus;
  loadStartTime: number;
  loadEndTime?: number;
  viewStartTime?: number;
  impressionLogged: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Manages native ad instances lifecycle
 * Handles loading, caching, and cleanup of ads
 */
class NativeAdInstanceManager {
  private adInstances: Map<number, AdInstance> = new Map();
  private loadingQueue: Set<number> = new Set();
  private totalAdsLoaded: number = 0;

  /**
   * Request ad load for a specific position
   * Returns existing ad if already loaded, or starts loading if not
   */
  async loadAdForPosition(position: number): Promise<NativeAd | null> {
    // Check if already loaded
    const existing = this.adInstances.get(position);
    if (existing) {
      if (existing.status === "loaded" && existing.nativeAd) {
        console.log(`✅ Ad at position ${position} already loaded`);
        return existing.nativeAd;
      }
      if (existing.status === "loading") {
        console.log(`⏳ Ad at position ${position} already loading`);
        return null;
      }
    }

    // Check if already in loading queue
    if (this.loadingQueue.has(position)) {
      console.log(`⏳ Ad at position ${position} in loading queue`);
      return null;
    }

    // Check cache limit
    const config = nativeAdService.getConfig();
    if (config && this.getLoadedCount() >= config.maxCachedAds) {
      console.log(
        `⚠️ Cache limit reached (${config.maxCachedAds}), cannot load ad at position ${position}`
      );
      return null;
    }

    // Check session limit
    if (
      config &&
      config.maxAdsPerSession !== null &&
      this.totalAdsLoaded >= config.maxAdsPerSession
    ) {
      console.log(
        `⚠️ Session limit reached (${config.maxAdsPerSession}), cannot load more ads`
      );
      return null;
    }

    // Start loading
    this.loadingQueue.add(position);
    const loadStartTime = Date.now();

    // Create instance entry
    const instance: AdInstance = {
      position,
      nativeAd: null,
      status: "loading",
      loadStartTime,
      impressionLogged: false,
    };
    this.adInstances.set(position, instance);

    // Log preload trigger
    analyticsService.logEvent("native_ad_preload_triggered", {
      position,
      timestamp: loadStartTime,
    });

    try {
      // Initialize ad loader if needed
      if (!nativeAdLoader.isInitialized()) {
        await nativeAdLoader.initialize();
      }

      const adUnitId = nativeAdLoader.getAdUnitId();
      console.log(`🔄 Loading native ad for position ${position}...`);

      // Create and load native ad
      const ad = await NativeAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      const loadTime = Date.now() - loadStartTime;

      // Update instance
      instance.nativeAd = ad;
      instance.status = "loaded";
      instance.loadEndTime = Date.now();
      this.adInstances.set(position, instance);
      this.totalAdsLoaded++;

      // Log successful load
      nativeAdLoader.logAdLoaded(`position-${position}`, loadTime);
      analyticsService.logEvent("native_ad_lazy_loaded", {
        position,
        load_time_ms: loadTime,
        was_preloaded: true,
        total_loaded: this.totalAdsLoaded,
      });

      console.log(
        `✅ Native ad loaded for position ${position} in ${loadTime}ms`
      );

      return ad;
    } catch (error: any) {
      console.error(
        `❌ Failed to load native ad for position ${position}:`,
        error
      );

      // Update instance to failed with error info
      instance.status = "failed";
      instance.loadEndTime = Date.now();
      instance.error = {
        code: error?.code || "unknown",
        message: error?.message || "Unknown error",
      };
      this.adInstances.set(position, instance);

      // Log failure
      nativeAdLoader.logAdFailed(`position-${position}`, error);
      analyticsService.logEvent("native_ad_lazy_load_failed", {
        position,
        error_code: error?.code || "unknown",
        error_message: error?.message || "Unknown error",
        platform: Platform.OS,
      });

      return null;
    } finally {
      this.loadingQueue.delete(position);
    }
  }

  /**
   * Get ad instance for a position
   */
  getAdInstance(position: number): AdInstance | null {
    return this.adInstances.get(position) || null;
  }

  /**
   * Check if ad is loaded at position
   */
  isAdLoaded(position: number): boolean {
    const instance = this.adInstances.get(position);
    return instance?.status === "loaded" && instance.nativeAd !== null;
  }

  /**
   * Check if ad is loading at position
   */
  isAdLoading(position: number): boolean {
    const instance = this.adInstances.get(position);
    return instance?.status === "loading" || this.loadingQueue.has(position);
  }

  /**
   * Unload and destroy ad at position
   */
  unloadAdAtPosition(position: number): void {
    const instance = this.adInstances.get(position);
    if (!instance) {
      return;
    }

    console.log(`🗑️ Unloading ad at position ${position}`);

    // Calculate time visible if it was viewed
    let timeVisibleMs = 0;
    if (instance.viewStartTime) {
      timeVisibleMs = Date.now() - instance.viewStartTime;
    }

    // Destroy the ad
    if (instance.nativeAd) {
      try {
        instance.nativeAd.destroy?.();
      } catch (error) {
        console.warn(`Error destroying ad at position ${position}:`, error);
      }
    }

    // Log unload
    analyticsService.logEvent("native_ad_unloaded", {
      position,
      time_visible_ms: timeVisibleMs,
      was_viewed: instance.impressionLogged,
    });

    // Remove from instances
    this.adInstances.delete(position);
  }

  /**
   * Clean up ads that are far from current position
   */
  cleanupDistantAds(currentPosition: number, unloadDistance: number): void {
    const positionsToUnload: number[] = [];

    // Find ads beyond unload distance
    for (const [position, instance] of this.adInstances.entries()) {
      const distance = Math.abs(position - currentPosition);
      if (distance > unloadDistance && instance.status !== "loading") {
        positionsToUnload.push(position);
      }
    }

    // Unload them
    for (const position of positionsToUnload) {
      this.unloadAdAtPosition(position);
    }

    if (positionsToUnload.length > 0) {
      console.log(
        `🧹 Cleaned up ${positionsToUnload.length} distant ads:`,
        positionsToUnload
      );
    }
  }

  /**
   * Mark ad as viewed (for impression tracking)
   */
  markAdAsViewed(position: number): void {
    const instance = this.adInstances.get(position);
    if (instance && !instance.impressionLogged) {
      instance.viewStartTime = Date.now();
      instance.impressionLogged = true;
      this.adInstances.set(position, instance);

      // Log impression
      analyticsService.logEvent("native_ad_impression", {
        position,
        load_time_ms: instance.loadEndTime
          ? instance.loadEndTime - instance.loadStartTime
          : 0,
        time_to_view_ms: Date.now() - instance.loadStartTime,
        is_real_ad: true,
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    loaded: number;
    loading: number;
    failed: number;
    total: number;
  } {
    let loaded = 0;
    let loading = 0;
    let failed = 0;

    for (const instance of this.adInstances.values()) {
      switch (instance.status) {
        case "loaded":
          loaded++;
          break;
        case "loading":
          loading++;
          break;
        case "failed":
          failed++;
          break;
      }
    }

    return {
      loaded,
      loading,
      failed,
      total: this.adInstances.size,
    };
  }

  /**
   * Get count of loaded ads
   */
  getLoadedCount(): number {
    return this.getCacheStats().loaded;
  }

  /**
   * Get total ads loaded in session
   */
  getTotalAdsLoaded(): number {
    return this.totalAdsLoaded;
  }

  /**
   * Get all loaded positions
   */
  getLoadedPositions(): number[] {
    const positions: number[] = [];
    for (const [position, instance] of this.adInstances.entries()) {
      if (instance.status === "loaded") {
        positions.push(position);
      }
    }
    return positions;
  }

  /**
   * Handle position change - trigger loads and cleanups
   */
  async handlePositionChange(
    currentPosition: number,
    preloadDistance: number,
    unloadDistance: number
  ): Promise<void> {
    // Clean up distant ads first
    this.cleanupDistantAds(currentPosition, unloadDistance);

    // Get positions to preload
    const config = nativeAdService.getConfig();
    if (!config || !config.enabled) {
      return;
    }

    // Calculate positions within preload range
    const positionsToLoad: number[] = [];
    for (let i = 1; i <= preloadDistance; i++) {
      const position = currentPosition + i;
      if (nativeAdService.shouldShowAdAtIndex(position)) {
        positionsToLoad.push(position);
      }
    }

    // Also check backward for backward scrolling
    for (let i = 1; i <= Math.min(preloadDistance, unloadDistance); i++) {
      const position = currentPosition - i;
      if (position >= 0 && nativeAdService.shouldShowAdAtIndex(position)) {
        positionsToLoad.push(position);
      }
    }

    // Load ads that aren't already loaded or loading
    for (const position of positionsToLoad) {
      if (!this.isAdLoaded(position) && !this.isAdLoading(position)) {
        // Don't await - load in background
        this.loadAdForPosition(position).catch((error) => {
          console.error(`Error loading ad at position ${position}:`, error);
        });
      }
    }

    // Log cache stats periodically
    const stats = this.getCacheStats();
    analyticsService.logEvent("native_ad_cache_stats", {
      current_position: currentPosition,
      loaded_count: stats.loaded,
      loading_count: stats.loading,
      failed_count: stats.failed,
      total_loaded_session: this.totalAdsLoaded,
    });
  }

  /**
   * Clear all ads (for cleanup/reset)
   */
  clearAll(): void {
    console.log("🧹 Clearing all ad instances");

    for (const [position, instance] of this.adInstances.entries()) {
      if (instance.nativeAd) {
        try {
          instance.nativeAd.destroy?.();
        } catch (error) {
          console.warn(`Error destroying ad at position ${position}:`, error);
        }
      }
    }

    this.adInstances.clear();
    this.loadingQueue.clear();
  }

  /**
   * Reset manager (for testing)
   */
  reset(): void {
    this.clearAll();
    this.totalAdsLoaded = 0;
    console.log("🔄 Native Ad Instance Manager reset");
  }
}

// Export singleton instance
export const nativeAdInstanceManager = new NativeAdInstanceManager();
export default nativeAdInstanceManager;
