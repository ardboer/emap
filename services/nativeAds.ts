import { brandManager } from "@/config/BrandManager";
import { Platform } from "react-native";
import mobileAds, { TestIds } from "react-native-google-mobile-ads";

// Test Ad Unit IDs (Google's official test IDs for Native Advanced)
const TEST_NATIVE_AD_UNITS = {
  ios: TestIds.NATIVE,
  android: TestIds.NATIVE,
};

export interface NativeAdConfig {
  enabled: boolean;
  testMode: boolean;
  firstAdPosition: number;
  adFrequency: number;
  adUnitIds: {
    ios: string;
    android: string;
  };
}

class NativeAdService {
  private initialized = false;
  private config: NativeAdConfig | null = null;

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
      this.config = brandConfig.nativeAds as NativeAdConfig;

      if (!this.config) {
        console.warn("Native ads configuration not found in brand config");
        this.config = {
          enabled: false,
          testMode: true,
          firstAdPosition: 4,
          adFrequency: 5,
          adUnitIds: {
            ios: TEST_NATIVE_AD_UNITS.ios,
            android: TEST_NATIVE_AD_UNITS.android,
          },
        };
      }

      // Initialize Mobile Ads SDK
      await mobileAds().initialize();

      this.initialized = true;
      console.log("Native Ad Service initialized:", {
        enabled: this.config.enabled,
        testMode: this.config.testMode,
        firstAdPosition: this.config.firstAdPosition,
        adFrequency: this.config.adFrequency,
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
    if (!this.config) {
      throw new Error("Native Ad Service not initialized");
    }

    // Use test ad units if in test mode
    if (this.config.testMode) {
      return Platform.OS === "ios"
        ? TEST_NATIVE_AD_UNITS.ios
        : TEST_NATIVE_AD_UNITS.android;
    }

    // Use production ad units
    return Platform.OS === "ios"
      ? this.config.adUnitIds.ios
      : this.config.adUnitIds.android;
  }

  /**
   * Get current configuration
   */
  getConfig(): NativeAdConfig | null {
    return this.config;
  }

  /**
   * Check if an ad should be shown at a specific index
   */
  shouldShowAdAtIndex(index: number): boolean {
    if (!this.config || !this.config.enabled) {
      return false;
    }

    const { firstAdPosition, adFrequency } = this.config;

    // Check if this is the first ad position
    if (index === firstAdPosition) {
      return true;
    }

    // Check if this is a subsequent ad position
    if (index > firstAdPosition) {
      const positionAfterFirst = index - firstAdPosition;
      return positionAfterFirst % adFrequency === 0;
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
    const { firstAdPosition, adFrequency } = this.config;

    for (let i = firstAdPosition; i < totalItems; i += adFrequency) {
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

    const { firstAdPosition, adFrequency } = this.config;

    if (currentIndex < firstAdPosition) {
      return firstAdPosition;
    }

    // Calculate next position based on frequency
    const positionAfterFirst = currentIndex - firstAdPosition;
    const remainder = positionAfterFirst % adFrequency;
    const nextPosition = currentIndex + (adFrequency - remainder);

    return nextPosition;
  }

  /**
   * Update configuration (useful for testing)
   */
  updateConfig(config: Partial<NativeAdConfig>): void {
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
    console.log("Native Ad Service reset");
  }
}

// Export singleton instance
export const nativeAdService = new NativeAdService();
export default nativeAdService;
