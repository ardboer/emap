import { brandManager } from "@/config/BrandManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import mobileAds, {
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { consentService } from "./consent";

/**
 * Google Ad Manager (GAM) Service
 * Replaces AdMob service with GAM-specific functionality
 *
 * Key differences from AdMob:
 * - Uses GAM ad unit format: /NETWORK_CODE/brand_app_platform/format
 * - Supports custom targeting (slot-level and page-level)
 * - Requires consent management before ad requests
 * - Supports additional ad formats (video, native fluid)
 */

// Test Ad Unit IDs (Google's official test IDs)
const TEST_AD_UNITS = {
  banner: TestIds.BANNER,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
  native: TestIds.NATIVE,
};

/**
 * Ad format types supported by GAM
 */
export type AdFormat = "banner" | "mpu" | "native" | "video";

/**
 * Targeting parameters for ad requests
 */
export interface AdTargeting {
  // Slot-level targeting (required for all ads)
  POS?: string;

  // Page-level targeting (content metadata)
  content_type?: string;
  category?: string;
  tags?: string[];
  author?: string;
  brand?: string;
  section?: string;

  // Custom targeting
  [key: string]: string | string[] | number | boolean | undefined;
}

/**
 * GAM configuration
 */
export interface GAMConfig {
  useTestAds: boolean;
  brand: "cn" | "nt";
  enableTargeting: boolean;
  defaultTargeting?: AdTargeting;
}

/**
 * Ad request options
 */
export interface AdRequestOptions {
  targeting?: AdTargeting;
  keywords?: string[];
}

class GAMService {
  private initialized = false;
  private consentInitialized = false;
  private config: GAMConfig = {
    useTestAds: __DEV__, // Use test ads in development
    brand: "nt", // Default to Nursing Times
    enableTargeting: true,
    defaultTargeting: {},
  };

  /**
   * Initialize GAM SDK with consent management
   * CRITICAL: Must be called before any ad requests
   */
  async initialize(config?: Partial<GAMConfig>): Promise<void> {
    if (this.initialized) {
      console.log("[GAM] Already initialized");
      return;
    }

    try {
      console.log("[GAM] Initializing...");

      // Update configuration first
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Check AsyncStorage for test ads setting (overrides everything)
      try {
        const storedTestAds = await AsyncStorage.getItem("gam_use_test_ads");
        if (storedTestAds !== null) {
          this.config.useTestAds = storedTestAds === "true";
          console.log(
            "[GAM] Using test ads setting from AsyncStorage (overrides config):",
            this.config.useTestAds
          );
        }
      } catch (error) {
        console.warn(
          "[GAM] Could not read test ads setting from AsyncStorage:",
          error
        );
      }

      // Step 1: Initialize consent management (REQUIRED)
      console.log("[GAM] Initializing consent management...");
      await consentService.initialize();
      this.consentInitialized = true;

      // Step 2: Check if we can request ads
      const canRequestAds = consentService.canRequestAds();
      if (!canRequestAds) {
        console.warn("[GAM] Cannot request ads - consent not obtained");

        // Show consent form if required
        if (consentService.shouldShowConsentForm()) {
          console.log("[GAM] Showing consent form...");
          await consentService.showConsentFormIfRequired();
        }
      }

      // Step 3: Initialize Mobile Ads SDK
      console.log("[GAM] Initializing Mobile Ads SDK...");
      await mobileAds().initialize();

      // Step 4: Configure request settings
      if (this.config.useTestAds) {
        console.log("[GAM] Test mode enabled");
      }

      this.initialized = true;
      console.log("[GAM] Initialization complete", {
        canRequestAds: consentService.canRequestAds(),
        consentStatus: consentService.getConsentStatusString(),
        testMode: this.config.useTestAds,
        brand: this.config.brand,
      });
    } catch (error) {
      console.error("[GAM] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Check if GAM is ready to serve ads
   * Returns true only if initialized AND consent obtained
   */
  canRequestAds(): boolean {
    if (!this.initialized) {
      console.warn("[GAM] Not initialized");
      return false;
    }

    if (!this.consentInitialized) {
      console.warn("[GAM] Consent not initialized");
      return false;
    }

    const canRequest = consentService.canRequestAds();
    if (!canRequest) {
      console.warn("[GAM] Consent not obtained");
    }

    return canRequest;
  }

  /**
   * Get ad unit ID for specified format
   * Now reads from brand configuration instead of hardcoded values
   */
  getAdUnitId(format: AdFormat): string {
    // Use test ads in test mode
    if (this.config.useTestAds) {
      switch (format) {
        case "banner":
        case "mpu":
          return TEST_AD_UNITS.banner;
        case "native":
          return TEST_AD_UNITS.native;
        case "video":
          return TEST_AD_UNITS.interstitial; // Use interstitial for video testing
        default:
          return TEST_AD_UNITS.banner;
      }
    }

    // Production: Get GAM ad units from brand configuration
    try {
      const brandConfig = brandManager.getCurrentBrand();
      const platform = Platform.OS as "ios" | "android";

      // Check if GAM config exists in brand config
      if (!brandConfig.gam?.adUnits?.[platform]) {
        console.error(
          `[GAM] No GAM ad units configured for platform: ${platform}`
        );
        return TEST_AD_UNITS.banner; // Fallback to test ad
      }

      const adUnit = brandConfig.gam.adUnits[platform][format];

      if (!adUnit) {
        console.error(
          `[GAM] No ad unit found for format: ${format}, platform: ${platform}`
        );
        return TEST_AD_UNITS.banner; // Fallback to test ad
      }

      console.log(`[GAM] Using ad unit for ${format}:`, adUnit);
      return adUnit;
    } catch (error) {
      console.error("[GAM] Error getting ad unit from brand config:", error);
      return TEST_AD_UNITS.banner; // Fallback to test ad
    }
  }

  /**
   * Get banner ad unit ID (320x100)
   */
  getBannerAdUnitId(): string {
    return this.getAdUnitId("banner");
  }

  /**
   * Get MPU ad unit ID (300x250)
   */
  getMPUAdUnitId(): string {
    return this.getAdUnitId("mpu");
  }

  /**
   * Get native ad unit ID (Fluid, 1x1)
   */
  getNativeAdUnitId(): string {
    return this.getAdUnitId("native");
  }

  /**
   * Get video ad unit ID (Out-of-Page)
   */
  getVideoAdUnitId(): string {
    return this.getAdUnitId("video");
  }

  /**
   * Build targeting parameters for ad request
   * Combines default targeting with request-specific targeting
   */
  buildTargeting(options?: AdRequestOptions): AdTargeting {
    if (!this.config.enableTargeting) {
      return {};
    }

    const targeting: AdTargeting = {
      ...this.config.defaultTargeting,
      ...options?.targeting,
    };

    // Add brand targeting
    targeting.brand = this.config.brand;

    return targeting;
  }

  /**
   * Update GAM configuration
   */
  updateConfig(config: Partial<GAMConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("[GAM] Configuration updated:", this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): GAMConfig {
    return { ...this.config };
  }

  /**
   * Check if GAM is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Set test device IDs for testing
   */
  async setTestDeviceIds(deviceIds: string[]): Promise<void> {
    try {
      await mobileAds().setRequestConfiguration({
        testDeviceIdentifiers: deviceIds,
      });
      console.log("[GAM] Test device IDs set:", deviceIds);
    } catch (error) {
      console.error("[GAM] Failed to set test device IDs:", error);
    }
  }

  /**
   * Enable/disable test ads
   */
  setTestMode(useTestAds: boolean): void {
    this.config.useTestAds = useTestAds;
    console.log("[GAM] Test mode:", useTestAds ? "enabled" : "disabled");
  }

  /**
   * Set brand for ad unit selection
   */
  setBrand(brand: "cn" | "nt"): void {
    this.config.brand = brand;
    console.log("[GAM] Brand set to:", brand);
  }

  /**
   * Set default targeting parameters
   */
  setDefaultTargeting(targeting: AdTargeting): void {
    this.config.defaultTargeting = targeting;
    console.log("[GAM] Default targeting set:", targeting);
  }

  /**
   * Enable/disable targeting
   */
  setTargetingEnabled(enabled: boolean): void {
    this.config.enableTargeting = enabled;
    console.log("[GAM] Targeting:", enabled ? "enabled" : "disabled");
  }

  /**
   * Get consent service instance
   */
  getConsentService() {
    return consentService;
  }

  /**
   * Show consent form
   */
  async showConsentForm(): Promise<void> {
    await consentService.showConsentFormIfRequired();
  }

  /**
   * Reset consent (for testing)
   */
  async resetConsent(): Promise<void> {
    await consentService.resetConsent();
    this.consentInitialized = false;
  }
}

// Export singleton instance
export const gamService = new GAMService();

// Export banner ad sizes for convenience
export const AdSizes = {
  BANNER: BannerAdSize.BANNER, // 320x50
  LARGE_BANNER: BannerAdSize.LARGE_BANNER, // 320x100 (mobile banner)
  MEDIUM_RECTANGLE: BannerAdSize.MEDIUM_RECTANGLE, // 300x250 (MPU)
  FULL_BANNER: BannerAdSize.FULL_BANNER, // 468x60
  LEADERBOARD: BannerAdSize.LEADERBOARD, // 728x90
};

export default gamService;
