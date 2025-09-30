import mobileAds, {
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

// Test Ad Unit IDs (Google's official test IDs)
const TEST_AD_UNITS = {
  banner: TestIds.BANNER,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
};

// Production Ad Unit IDs (to be replaced with real IDs)
const PRODUCTION_AD_UNITS = {
  cn: {
    banner: "ca-app-pub-xxxxxxxx/xxxxxxxx", // Replace with CN banner ad unit ID
    interstitial: "ca-app-pub-xxxxxxxx/xxxxxxxx", // Replace with CN interstitial ad unit ID
    rewarded: "ca-app-pub-xxxxxxxx/xxxxxxxx", // Replace with CN rewarded ad unit ID
  },
  nt: {
    banner: "ca-app-pub-xxxxxxxx/xxxxxxxx", // Replace with NT banner ad unit ID
    interstitial: "ca-app-pub-xxxxxxxx/xxxxxxxx", // Replace with NT interstitial ad unit ID
    rewarded: "ca-app-pub-xxxxxxxx/xxxxxxxx", // Replace with NT rewarded ad unit ID
  },
};

export interface AdMobConfig {
  useTestAds: boolean;
  brand: "cn" | "nt";
}

class AdMobService {
  private initialized = false;
  private config: AdMobConfig = {
    useTestAds: true, // Default to test ads
    brand: "nt", // Default brand
  };

  /**
   * Initialize AdMob SDK
   */
  async initialize(config?: Partial<AdMobConfig>): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Update configuration
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Initialize the Mobile Ads SDK
      await mobileAds().initialize();

      this.initialized = true;
      console.log("AdMob initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AdMob:", error);
      throw error;
    }
  }

  /**
   * Update AdMob configuration
   */
  updateConfig(config: Partial<AdMobConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get banner ad unit ID based on current configuration
   */
  getBannerAdUnitId(): string {
    if (this.config.useTestAds) {
      return TEST_AD_UNITS.banner;
    }

    return PRODUCTION_AD_UNITS[this.config.brand].banner;
  }

  /**
   * Get interstitial ad unit ID based on current configuration
   */
  getInterstitialAdUnitId(): string {
    if (this.config.useTestAds) {
      return TEST_AD_UNITS.interstitial;
    }

    return PRODUCTION_AD_UNITS[this.config.brand].interstitial;
  }

  /**
   * Get rewarded ad unit ID based on current configuration
   */
  getRewardedAdUnitId(): string {
    if (this.config.useTestAds) {
      return TEST_AD_UNITS.rewarded;
    }

    return PRODUCTION_AD_UNITS[this.config.brand].rewarded;
  }

  /**
   * Get current configuration
   */
  getConfig(): AdMobConfig {
    return { ...this.config };
  }

  /**
   * Check if AdMob is initialized
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
      console.log("Test device IDs set:", deviceIds);
    } catch (error) {
      console.error("Failed to set test device IDs:", error);
    }
  }

  /**
   * Enable/disable test ads
   */
  setTestMode(useTestAds: boolean): void {
    this.config.useTestAds = useTestAds;
  }

  /**
   * Set brand for ad unit selection
   */
  setBrand(brand: "cn" | "nt"): void {
    this.config.brand = brand;
  }
}

// Export singleton instance
export const adMobService = new AdMobService();

// Export banner ad sizes for convenience
export const AdSizes = {
  BANNER: BannerAdSize.BANNER, // 320x50
  LARGE_BANNER: BannerAdSize.LARGE_BANNER, // 320x100
  MEDIUM_RECTANGLE: BannerAdSize.MEDIUM_RECTANGLE, // 300x250
  FULL_BANNER: BannerAdSize.FULL_BANNER, // 468x60
  LEADERBOARD: BannerAdSize.LEADERBOARD, // 728x90
};

export default adMobService;
