import {
  AVAILABLE_BRANDS,
  BrandConfig,
  BrandShortcode,
  validateShortcode,
} from "@/brands";

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
    if (!this.currentBrand) {
      // Auto-load default brand if none is set
      return this.loadBrand(this.getActiveBrandShortcode());
    }
    return this.currentBrand;
  }

  /**
   * Get active brand shortcode from environment or default
   */
  getActiveBrandShortcode(): BrandShortcode {
    // Check for environment variable first
    const envBrand = process.env.EXPO_PUBLIC_BRAND || process.env.BRAND;

    if (envBrand && validateShortcode(envBrand)) {
      return envBrand;
    }

    // Fallback to default
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
