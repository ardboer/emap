import { brandManager } from "@/config/BrandManager";
import { CarouselNativeAdConfig, NativeAdsConfig } from "@/types/ads";
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";
import { gamService } from "./gam";

// Test Ad Unit IDs (Google's official test IDs for Native Advanced)
const TEST_NATIVE_AD_UNITS = {
  ios: TestIds.NATIVE,
  android: TestIds.NATIVE,
};

// Legacy type for backward compatibility
export interface LegacyNativeAdConfig {
  enabled: boolean;
  testMode: boolean;
  firstAdPosition: number;
  adInterval: number;
  preloadDistance: number;
  unloadDistance: number;
  maxCachedAds: number;
  maxAdsPerSession: number | null;
  showLoadingIndicator: boolean;
  skipIfNotReady: boolean;
  adUnitIds: {
    ios: string;
    android: string;
  };
  adFrequency?: number;
}

class NativeAdService {
  private initialized = false;
  private config: CarouselNativeAdConfig | null = null;
  private fullConfig: NativeAdsConfig | null = null;
  private canRequestAds = false;

  /**
   * Initialize Native Ad service with brand configuration
   * Now integrates with GAM service for consent management
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Get brand configuration
      const brandConfig = brandManager.getCurrentBrand();
      this.fullConfig = brandConfig.nativeAds as NativeAdsConfig;

      if (!this.fullConfig) {
        console.warn("[NativeAds] Configuration not found in brand config");
        this.fullConfig = {
          enabled: false,
          testMode: true,
          adUnitIds: {
            carousel: {
              ios: TEST_NATIVE_AD_UNITS.ios,
              android: TEST_NATIVE_AD_UNITS.android,
            },
            listView: {
              ios: TEST_NATIVE_AD_UNITS.ios,
              android: TEST_NATIVE_AD_UNITS.android,
            },
          },
        };
      }

      // Handle new structure with carousel config
      if (this.fullConfig.carousel) {
        this.config = this.fullConfig.carousel;
      }
      // Handle legacy structure (backward compatibility)
      else if (this.fullConfig.firstAdPosition !== undefined) {
        console.warn(
          "[NativeAds] ⚠️ Using legacy config format. Consider updating to new format."
        );
        const legacyConfig = this.fullConfig as any as LegacyNativeAdConfig;

        this.config = {
          enabled: legacyConfig.enabled,
          firstAdPosition: legacyConfig.firstAdPosition,
          adInterval: legacyConfig.adInterval || legacyConfig.adFrequency || 5,
          preloadDistance: legacyConfig.preloadDistance || 2,
          unloadDistance: legacyConfig.unloadDistance || 3,
          maxCachedAds: legacyConfig.maxCachedAds || 3,
          maxAdsPerSession: legacyConfig.maxAdsPerSession || null,
          showLoadingIndicator:
            legacyConfig.showLoadingIndicator !== undefined
              ? legacyConfig.showLoadingIndicator
              : true,
          skipIfNotReady:
            legacyConfig.skipIfNotReady !== undefined
              ? legacyConfig.skipIfNotReady
              : true,
        };
      }
      // No carousel config at all
      else {
        this.config = {
          enabled: false,
          firstAdPosition: 4,
          adInterval: 5,
          preloadDistance: 2,
          unloadDistance: 3,
          maxCachedAds: 3,
          maxAdsPerSession: null,
          showLoadingIndicator: true,
          skipIfNotReady: true,
        };
      }

      // Initialize GAM service (includes consent management)
      await gamService.initialize({
        useTestAds: this.fullConfig.testMode,
        brand: brandConfig.shortcode === "cn" ? "cn" : "nt",
      });

      // Check if we can request ads (consent obtained)
      this.canRequestAds = gamService.canRequestAds();

      if (!this.canRequestAds) {
        console.warn("[NativeAds] Cannot request ads - consent not obtained");
      }

      this.initialized = true;
      console.log("[NativeAds] Service initialized:", {
        enabled: this.config.enabled,
        testMode: this.fullConfig.testMode,
        canRequestAds: this.canRequestAds,
        firstAdPosition: this.config.firstAdPosition,
        adInterval: this.config.adInterval,
        preloadDistance: this.config.preloadDistance,
        unloadDistance: this.config.unloadDistance,
        maxCachedAds: this.config.maxCachedAds,
        maxAdsPerSession: this.config.maxAdsPerSession,
      });
    } catch (error) {
      console.error("[NativeAds] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Check if native ads are enabled and can be requested
   * Now includes consent check
   */
  isEnabled(): boolean {
    const configEnabled = this.config?.enabled ?? false;
    return configEnabled && this.canRequestAds;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the appropriate ad unit ID for current platform
   * Now uses GAM service for ad unit IDs
   */
  getAdUnitId(): string {
    if (!this.fullConfig) {
      throw new Error("[NativeAds] Service not initialized");
    }

    // Use GAM service to get native ad unit ID
    // This will return test IDs in test mode, or GAM production IDs
    return gamService.getNativeAdUnitId();
  }

  /**
   * Get current configuration (carousel config)
   */
  getConfig(): CarouselNativeAdConfig | null {
    return this.config;
  }

  /**
   * Get full configuration (including listView)
   */
  getFullConfig(): NativeAdsConfig | null {
    return this.fullConfig;
  }

  /**
   * Check if an ad should be shown at a specific index
   * Now includes consent check
   */
  shouldShowAdAtIndex(index: number): boolean {
    if (!this.config || !this.config.enabled || !this.canRequestAds) {
      return false;
    }

    const { firstAdPosition, adInterval } = this.config;

    // Check if this is the first ad position
    if (index === firstAdPosition) {
      return true;
    }

    // Check if this is a subsequent ad position
    if (index > firstAdPosition) {
      const positionAfterFirst = index - firstAdPosition;
      return positionAfterFirst % adInterval === 0;
    }

    return false;
  }

  /**
   * Calculate all ad positions for a given total number of items
   * Now includes consent check
   */
  calculateAdPositions(totalItems: number): number[] {
    if (!this.config || !this.config.enabled || !this.canRequestAds) {
      return [];
    }

    const positions: number[] = [];
    const { firstAdPosition, adInterval } = this.config;

    for (let i = firstAdPosition; i < totalItems; i += adInterval) {
      positions.push(i);
    }

    return positions;
  }

  /**
   * Get the next ad position after a given index
   */
  getNextAdPosition(currentIndex: number): number | null {
    if (!this.config || !this.config.enabled) {
      return null;
    }

    const { firstAdPosition, adInterval } = this.config;

    if (currentIndex < firstAdPosition) {
      return firstAdPosition;
    }

    // Calculate next position based on interval
    const positionAfterFirst = currentIndex - firstAdPosition;
    const remainder = positionAfterFirst % adInterval;
    const nextPosition = currentIndex + (adInterval - remainder);

    return nextPosition;
  }

  /**
   * Update configuration (useful for testing)
   */
  updateConfig(config: Partial<CarouselNativeAdConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...config };
      console.log("Native Ad Service configuration updated:", this.config);
    }
  }

  /**
   * Check if ads can be requested (consent obtained)
   */
  canRequest(): boolean {
    return this.canRequestAds;
  }

  /**
   * Refresh consent status
   * Call this after consent changes
   */
  refreshConsentStatus(): void {
    this.canRequestAds = gamService.canRequestAds();
    console.log("[NativeAds] Consent status refreshed:", this.canRequestAds);
  }

  /**
   * Reset service (useful for testing)
   */
  reset(): void {
    this.initialized = false;
    this.config = null;
    this.fullConfig = null;
    this.canRequestAds = false;
    console.log("[NativeAds] Service reset");
  }
}

// Export singleton instance
export const nativeAdService = new NativeAdService();
export default nativeAdService;
