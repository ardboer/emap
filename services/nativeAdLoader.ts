import { Platform } from "react-native";
import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads";
import { analyticsService } from "./analytics";
import { nativeAdService } from "./nativeAds";

class NativeAdLoaderService {
  private initialized = false;
  private adCounter = 0;

  /**
   * Initialize the Mobile Ads SDK and Native Ad Service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize the native ad service first
      await nativeAdService.initialize();

      // Then initialize mobile ads SDK
      await mobileAds().initialize();

      // Set request configuration
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      this.initialized = true;
      console.log("Native Ad Loader initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Mobile Ads SDK:", error);
      throw error;
    }
  }

  /**
   * Get ad unit ID for current platform
   */
  getAdUnitId(): string {
    return nativeAdService.getAdUnitId();
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get next ad counter for unique IDs
   */
  getNextAdCounter(): number {
    return this.adCounter++;
  }

  /**
   * Log ad request
   */
  logAdRequest(adId: string): void {
    analyticsService.logEvent("native_ad_requested", {
      ad_id: adId,
      ad_unit_id: this.getAdUnitId(),
      platform: Platform.OS,
      timestamp: Date.now(),
    });
  }

  /**
   * Log ad load success
   */
  logAdLoaded(adId: string, loadTimeMs: number): void {
    analyticsService.logEvent("native_ad_loaded", {
      ad_id: adId,
      load_time_ms: loadTimeMs,
      platform: Platform.OS,
    });
  }

  /**
   * Log ad load failure
   */
  logAdFailed(adId: string, error: any): void {
    analyticsService.logEvent("native_ad_failed", {
      ad_id: adId,
      error_code: error?.code || "unknown",
      error_message: error?.message || "Unknown error",
      platform: Platform.OS,
    });
  }
}

export const nativeAdLoader = new NativeAdLoaderService();
export default nativeAdLoader;
