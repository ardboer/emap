/**
 * Display Ad Lazy Load Manager Service
 *
 * Manages display ad lazy loading state, lifecycle, and analytics.
 * Tracks which ads are loaded/loading and handles viewability metrics.
 *
 * Features:
 * - Track ad loading states
 * - Prevent duplicate loads
 * - Handle load success/failure
 * - Track viewability metrics
 * - Integrate with analytics
 */

import { analyticsService } from "./analytics";

export interface AdState {
  id: string;
  context: "article_detail" | "list_view";
  size: string;
  status: "idle" | "loading" | "loaded" | "failed" | "viewed";
  loadStartTime?: number;
  loadEndTime?: number;
  loadDuration?: number;
  viewStartTime?: number;
  viewEndTime?: number;
  viewDuration?: number;
  error?: any;
  wasPreloaded: boolean;
}

export interface AdLoadStats {
  totalAds: number;
  loadingAds: number;
  loadedAds: number;
  failedAds: number;
  viewedAds: number;
  averageLoadTime: number;
  viewabilityRate: number;
  loadSuccessRate: number;
}

class DisplayAdLazyLoadManager {
  private ads: Map<string, AdState> = new Map();
  private sessionStartTime: number = Date.now();

  /**
   * Register a new ad
   */
  registerAd(
    adId: string,
    context: "article_detail" | "list_view",
    size: string
  ): void {
    if (this.ads.has(adId)) {
      console.warn(`[DisplayAdLazyLoadManager] Ad ${adId} already registered`);
      return;
    }

    this.ads.set(adId, {
      id: adId,
      context,
      size,
      status: "idle",
      wasPreloaded: false,
    });

    // console.log(`[DisplayAdLazyLoadManager] Registered ad: ${adId} (${context}, ${size})`);
  }

  /**
   * Start loading an ad
   */
  startLoading(adId: string): void {
    const ad = this.ads.get(adId);
    if (!ad) {
      console.warn(`[DisplayAdLazyLoadManager] Ad ${adId} not registered`);
      return;
    }

    if (ad.status === "loading" || ad.status === "loaded") {
      // console.log(`[DisplayAdLazyLoadManager] Ad ${adId} already ${ad.status}`);
      return;
    }

    ad.status = "loading";
    ad.loadStartTime = Date.now();
    ad.wasPreloaded = true;

    // Track analytics
    analyticsService.logEvent("display_ad_load_started", {
      ad_id: adId,
      context: ad.context,
      size: ad.size,
      session_time_ms: Date.now() - this.sessionStartTime,
    });

    // console.log(`[DisplayAdLazyLoadManager] Started loading ad: ${adId}`);
  }

  /**
   * Mark ad as successfully loaded
   */
  markAsLoaded(adId: string, loadEndTime: number = Date.now()): void {
    const ad = this.ads.get(adId);
    if (!ad) {
      console.warn(`[DisplayAdLazyLoadManager] Ad ${adId} not registered`);
      return;
    }

    ad.status = "loaded";
    ad.loadEndTime = loadEndTime;

    if (ad.loadStartTime) {
      ad.loadDuration = loadEndTime - ad.loadStartTime;
    }

    // Track analytics
    analyticsService.logEvent("display_ad_loaded", {
      ad_id: adId,
      context: ad.context,
      size: ad.size,
      load_time_ms: ad.loadDuration || 0,
      was_preloaded: ad.wasPreloaded,
    });

    // console.log(`[DisplayAdLazyLoadManager] Ad loaded: ${adId} (${ad.loadDuration}ms)`);
  }

  /**
   * Mark ad as failed to load
   */
  markAsFailed(adId: string, error: any): void {
    const ad = this.ads.get(adId);
    if (!ad) {
      console.warn(`[DisplayAdLazyLoadManager] Ad ${adId} not registered`);
      return;
    }

    ad.status = "failed";
    ad.error = error;

    // Check if this is a "no-fill" error (expected, not a real failure)
    const isNoFillError =
      error?.message?.includes("no-fill") ||
      error?.message?.includes("No ad to show") ||
      error?.code === "no-fill";

    // Only track non-no-fill errors
    if (!isNoFillError) {
      analyticsService.logEvent("display_ad_load_failed", {
        ad_id: adId,
        context: ad.context,
        size: ad.size,
        error: error?.message || "Unknown error",
        error_code: error?.code,
      });

      console.log(`[DisplayAdLazyLoadManager] Ad failed: ${adId}`, error);
    }
  }

  /**
   * Mark ad as viewed (entered viewport)
   */
  markAsViewed(adId: string): void {
    const ad = this.ads.get(adId);
    if (!ad) {
      console.warn(`[DisplayAdLazyLoadManager] Ad ${adId} not registered`);
      return;
    }

    if (ad.status !== "loaded" && ad.status !== "viewed") {
      console.warn(
        `[DisplayAdLazyLoadManager] Ad ${adId} not loaded yet, cannot mark as viewed`
      );
      return;
    }

    if (ad.status === "viewed") {
      // Already viewed, don't track again
      return;
    }

    ad.status = "viewed";
    ad.viewStartTime = Date.now();

    // Calculate time from load to view
    const timeToView = ad.loadEndTime ? ad.viewStartTime - ad.loadEndTime : 0;

    // Track analytics
    analyticsService.logEvent("display_ad_viewed", {
      ad_id: adId,
      context: ad.context,
      size: ad.size,
      time_to_view_ms: timeToView,
      was_preloaded: ad.wasPreloaded,
    });

    // console.log(`[DisplayAdLazyLoadManager] Ad viewed: ${adId}`);
  }

  /**
   * Track viewability metrics when ad exits viewport
   */
  trackViewability(adId: string, viewEndTime: number = Date.now()): void {
    const ad = this.ads.get(adId);
    if (!ad || !ad.viewStartTime) {
      return;
    }

    ad.viewEndTime = viewEndTime;
    ad.viewDuration = viewEndTime - ad.viewStartTime;

    // Track analytics
    analyticsService.logEvent("display_ad_viewability", {
      ad_id: adId,
      context: ad.context,
      size: ad.size,
      view_duration_ms: ad.viewDuration,
      load_duration_ms: ad.loadDuration || 0,
    });

    // console.log(`[DisplayAdLazyLoadManager] Ad viewability tracked: ${adId} (${ad.viewDuration}ms)`);
  }

  /**
   * Unregister an ad (cleanup)
   */
  unregisterAd(adId: string): void {
    const ad = this.ads.get(adId);
    if (ad && ad.viewStartTime && !ad.viewEndTime) {
      // Track final viewability if ad was being viewed
      this.trackViewability(adId);
    }

    this.ads.delete(adId);
    // console.log(`[DisplayAdLazyLoadManager] Unregistered ad: ${adId}`);
  }

  /**
   * Check if ad is currently loading
   */
  isLoading(adId: string): boolean {
    const ad = this.ads.get(adId);
    return ad?.status === "loading";
  }

  /**
   * Check if ad is loaded
   */
  isLoaded(adId: string): boolean {
    const ad = this.ads.get(adId);
    return ad?.status === "loaded" || ad?.status === "viewed";
  }

  /**
   * Check if ad should load (not already loading or loaded)
   */
  shouldLoad(adId: string): boolean {
    const ad = this.ads.get(adId);
    if (!ad) return false;
    return ad.status === "idle" || ad.status === "failed";
  }

  /**
   * Get ad state
   */
  getAdState(adId: string): AdState | undefined {
    return this.ads.get(adId);
  }

  /**
   * Get statistics for all ads
   */
  getStats(): AdLoadStats {
    const ads = Array.from(this.ads.values());
    const totalAds = ads.length;
    const loadingAds = ads.filter((ad) => ad.status === "loading").length;
    const loadedAds = ads.filter(
      (ad) => ad.status === "loaded" || ad.status === "viewed"
    ).length;
    const failedAds = ads.filter((ad) => ad.status === "failed").length;
    const viewedAds = ads.filter((ad) => ad.status === "viewed").length;

    // Calculate average load time
    const loadedAdsWithTime = ads.filter((ad) => ad.loadDuration !== undefined);
    const averageLoadTime =
      loadedAdsWithTime.length > 0
        ? loadedAdsWithTime.reduce(
            (sum, ad) => sum + (ad.loadDuration || 0),
            0
          ) / loadedAdsWithTime.length
        : 0;

    // Calculate viewability rate (viewed / loaded)
    const viewabilityRate = loadedAds > 0 ? (viewedAds / loadedAds) * 100 : 0;

    // Calculate load success rate
    const attemptedLoads = loadedAds + failedAds;
    const loadSuccessRate =
      attemptedLoads > 0 ? (loadedAds / attemptedLoads) * 100 : 0;

    return {
      totalAds,
      loadingAds,
      loadedAds,
      failedAds,
      viewedAds,
      averageLoadTime,
      viewabilityRate,
      loadSuccessRate,
    };
  }

  /**
   * Log current statistics
   */
  logStats(): void {
    const stats = this.getStats();
    console.log("[DisplayAdLazyLoadManager] Stats:", {
      total: stats.totalAds,
      loading: stats.loadingAds,
      loaded: stats.loadedAds,
      failed: stats.failedAds,
      viewed: stats.viewedAds,
      avgLoadTime: `${stats.averageLoadTime.toFixed(0)}ms`,
      viewabilityRate: `${stats.viewabilityRate.toFixed(1)}%`,
      loadSuccessRate: `${stats.loadSuccessRate.toFixed(1)}%`,
    });

    // Track analytics
    analyticsService.logEvent("display_ad_stats", stats);
  }

  /**
   * Clear all ads (for cleanup)
   */
  clearAll(): void {
    // Track viewability for any ads still being viewed
    this.ads.forEach((ad, adId) => {
      if (ad.viewStartTime && !ad.viewEndTime) {
        this.trackViewability(adId);
      }
    });

    this.ads.clear();
    // console.log('[DisplayAdLazyLoadManager] Cleared all ads');
  }

  /**
   * Get all registered ad IDs
   */
  getAllAdIds(): string[] {
    return Array.from(this.ads.keys());
  }
}

// Export singleton instance
export const displayAdLazyLoadManager = new DisplayAdLazyLoadManager();
export default displayAdLazyLoadManager;
