import {
  AVAILABLE_BRANDS,
  BrandConfig,
  BrandShortcode,
  validateShortcode,
} from "@/brands";
import { ACTIVE_BRAND } from "./brandKey";

class BrandManager {
  private static instance: BrandManager;
  private currentBrand: BrandConfig | null = null;
  private defaultBrand: BrandShortcode = "nt";

  private constructor() {}

  static getInstance(): BrandManager {
    if (!BrandManager.instance) {
      BrandManager.instance = new BrandManager();
    }
    return BrandManager.instance;
  }

  /**
   * Load brand configuration by shortcode
   */
  loadBrand(shortcode: string): BrandConfig {
    if (!validateShortcode(shortcode)) {
      throw new Error(
        `Invalid brand shortcode: ${shortcode}. Must be 2-6 lowercase alphanumeric characters.`
      );
    }

    try {
      const brandLoader = AVAILABLE_BRANDS[shortcode];
      const config = brandLoader();

      // Validate that the loaded config matches the shortcode
      if (config.shortcode !== shortcode) {
        throw new Error(
          `Brand configuration mismatch: expected ${shortcode}, got ${config.shortcode}`
        );
      }

      this.currentBrand = config;
      return config;
    } catch (error) {
      throw new Error(
        `Failed to load brand configuration for ${shortcode}: ${error}`
      );
    }
  }

  /**
   * Get current active brand configuration
   */
  getCurrentBrand(): BrandConfig {
    // Always check for the active brand to ensure we're using the correct one
    const activeBrandShortcode = this.getActiveBrandShortcode();

    // If we don't have a cached brand or the cached brand doesn't match the active one, reload
    if (
      !this.currentBrand ||
      this.currentBrand.shortcode !== activeBrandShortcode
    ) {
      console.log(
        `🔄 Loading brand configuration for: ${activeBrandShortcode}`
      );
      return this.loadBrand(activeBrandShortcode);
    }

    return this.currentBrand;
  }

  /**
   * Clear cached brand configuration (useful for development/testing)
   */
  clearCache(): void {
    console.log("🗑️ Clearing brand cache");
    this.currentBrand = null;
  }

  /**
   * Get active brand shortcode from environment, app config, or default
   */
  getActiveBrandShortcode(): BrandShortcode {
    console.log("🔍 BrandManager: Getting active brand shortcode...");

    // Check brand key file first (set by prebuild script)
    console.log("🔍 Brand key file brand:", ACTIVE_BRAND);
    if (ACTIVE_BRAND && validateShortcode(ACTIVE_BRAND)) {
      console.log("✅ Using brand key file brand:", ACTIVE_BRAND);
      return ACTIVE_BRAND;
    }

    // Check for environment variable as fallback
    const envBrand = process.env.EXPO_PUBLIC_BRAND || process.env.BRAND;
    console.log("🔍 Environment brand:", envBrand);

    if (envBrand && validateShortcode(envBrand)) {
      console.log("✅ Using environment brand:", envBrand);
      return envBrand;
    }

    // Check app.json extra configuration (set by prebuild script)
    try {
      // @ts-ignore - Constants is available in Expo apps
      const Constants = require("expo-constants").default;
      console.log("🔍 Constants available:", !!Constants);
      console.log("🔍 ExpoConfig available:", !!Constants?.expoConfig);
      console.log("🔍 Extra available:", !!Constants?.expoConfig?.extra);
      console.log(
        "🔍 BrandConfig available:",
        !!Constants?.expoConfig?.extra?.brandConfig
      );

      const appBrand = Constants?.expoConfig?.extra?.brandConfig?.brand;
      console.log("🔍 App brand from config:", appBrand);

      if (appBrand && validateShortcode(appBrand)) {
        console.log("✅ Using app config brand:", appBrand);
        return appBrand;
      }
      // Fallback: detect brand from bundle identifier
      const bundleId =
        Constants?.expoConfig?.ios?.bundleIdentifier ||
        Constants?.manifest?.ios?.bundleIdentifier;
      console.log("🔍 Bundle ID:", bundleId);

      if (bundleId === "metropolis.co.uk.constructionnews") {
        console.log("✅ Detected Construction News from bundle ID");
        return "cn";
      } else if (bundleId === "metropolis.net.nursingtimes") {
        console.log("✅ Detected Nursing Times from bundle ID");
        return "nt";
      }
    } catch (error) {
      console.warn("❌ Could not access app configuration:", error);
    }

    // Final fallback to default
    console.log("⚠️ Using default brand:", this.defaultBrand);
    return this.defaultBrand;
  }

  /**
   * Switch to a different brand (useful for development/testing)
   */
  switchBrand(shortcode: string): BrandConfig {
    return this.loadBrand(shortcode);
  }

  /**
   * Get brand-specific asset path
   */
  getBrandAssetPath(assetType: keyof BrandConfig["branding"]): string {
    const brand = this.getCurrentBrand();
    const relativePath = brand.branding[assetType];

    // Convert relative path to absolute brand path
    return relativePath.replace(
      "./assets/",
      `@/brands/${brand.shortcode}/assets/`
    );
  }

  /**
   * Get API configuration for current brand
   */
  getApiConfig() {
    return this.getCurrentBrand().apiConfig;
  }

  /**
   * Get theme configuration for current brand
   */
  getThemeConfig() {
    return this.getCurrentBrand().theme;
  }

  /**
   * Get branding configuration for current brand
   */
  getBrandingConfig() {
    return this.getCurrentBrand().branding;
  }
}

// Export singleton instance
export const brandManager = BrandManager.getInstance();
export default brandManager;
