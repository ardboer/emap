import { brandManager } from "@/config/BrandManager";
import { CarouselNativeAdConfig, NativeAdsConfig } from "@/types/ads";
import { Platform } from "react-native";
import mobileAds, { TestIds } from "react-native-google-mobile-ads";

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

  /**
   * Initialize Native Ad service with brand configuration
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
        console.warn("Native ads configuration not found in brand config");
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
          "⚠️ Using legacy native ads config format. Consider updating to new format."
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

      // Initialize Mobile Ads SDK
      await mobileAds().initialize();

      this.initialized = true;
      console.log("Native Ad Service (Carousel) initialized:", {
        enabled: this.config.enabled,
        testMode: this.fullConfig.testMode,
        firstAdPosition: this.config.firstAdPosition,
        adInterval: this.config.adInterval,
        preloadDistance: this.config.preloadDistance,
        unloadDistance: this.config.unloadDistance,
        maxCachedAds: this.config.maxCachedAds,
        maxAdsPerSession: this.config.maxAdsPerSession,
      });
    } catch (error) {
      console.error("Failed to initialize Native Ad Service:", error);
      throw error;
    }
  }

  /**
   * Check if native ads are enabled
   */
  isEnabled(): boolean {
    return this.config?.enabled ?? false;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the appropriate ad unit ID for current platform
   */
  getAdUnitId(): string {
    if (!this.fullConfig) {
      throw new Error("Native Ad Service not initialized");
    }

    // Use test ad units if in test mode
    if (this.fullConfig.testMode) {
      return Platform.OS === "ios"
        ? TEST_NATIVE_AD_UNITS.ios
        : TEST_NATIVE_AD_UNITS.android;
    }

    // Use production ad units from carousel config
    const adUnitIds = this.fullConfig.adUnitIds?.carousel;
    if (!adUnitIds) {
      // Fallback to legacy format
      const legacyConfig = this.fullConfig as any;
      return Platform.OS === "ios"
        ? legacyConfig.adUnitIds?.ios || TEST_NATIVE_AD_UNITS.ios
        : legacyConfig.adUnitIds?.android || TEST_NATIVE_AD_UNITS.android;
    }

    return Platform.OS === "ios" ? adUnitIds.ios : adUnitIds.android;
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
   */
  shouldShowAdAtIndex(index: number): boolean {
    if (!this.config || !this.config.enabled) {
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
   */
  calculateAdPositions(totalItems: number): number[] {
    if (!this.config || !this.config.enabled) {
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
   * Reset service (useful for testing)
   */
  reset(): void {
    this.initialized = false;
    this.config = null;
    this.fullConfig = null;
    console.log("Native Ad Service reset");
  }
}

// Export singleton instance
export const nativeAdService = new NativeAdService();
export default nativeAdService;
