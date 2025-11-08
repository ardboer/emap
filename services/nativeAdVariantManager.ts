import { brandManager } from "@/config/BrandManager";
import {
  ListViewNativeAdConfig,
  ListViewType,
  NativeAdVariant,
  NativeAdsConfig,
} from "@/types/ads";
import { Platform } from "react-native";

/**
 * Manages different native ad variants and their configurations
 * Handles variant-specific logic for carousel and list view native ads
 */
class NativeAdVariantManager {
  private config: NativeAdsConfig | null = null;
  private initialized = false;

  /**
   * Initialize the variant manager with brand configuration
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    const brandConfig = brandManager.getCurrentBrand();
    this.config = brandConfig.nativeAds as NativeAdsConfig;

    if (!this.config) {
      console.warn("Native ads configuration not found in brand config");
      this.config = {
        enabled: false,
        testMode: true,
        adUnitIds: {
          carousel: {
            ios: "",
            android: "",
          },
          listView: {
            ios: "",
            android: "",
          },
        },
      };
    }

    // Handle legacy config format
    if (this.config.firstAdPosition !== undefined && !this.config.carousel) {
      console.warn(
        "⚠️ Using legacy native ads config format. Consider updating to new format."
      );
      this.config.carousel = {
        enabled: this.config.enabled,
        firstAdPosition: this.config.firstAdPosition,
        adInterval: this.config.adInterval || this.config.adFrequency || 5,
        preloadDistance: 1,
        unloadDistance: 3,
        maxCachedAds: 3,
        maxAdsPerSession: null,
        showLoadingIndicator: true,
        skipIfNotReady: false,
      };
    }

    this.initialized = true;
    console.log("Native Ad Variant Manager initialized:", {
      enabled: this.config.enabled,
      carouselEnabled: this.config.carousel?.enabled ?? false,
      listViewEnabled: this.config.listView?.enabled ?? false,
    });
  }

  /**
   * Check if variant manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the appropriate ad unit ID for a specific variant
   */
  getAdUnitId(variant: NativeAdVariant): string {
    if (!this.config) {
      throw new Error("Native Ad Variant Manager not initialized");
    }

    const platform = Platform.OS as "ios" | "android";

    // Map variant to config key
    const configKey = variant === "listItem" ? "listView" : variant;
    const adUnitIds = this.config.adUnitIds[configKey];

    if (!adUnitIds) {
      console.warn(`No ad unit IDs configured for variant: ${variant}`);
      return "";
    }

    return adUnitIds[platform] || "";
  }

  /**
   * Check if a specific variant is enabled
   */
  isVariantEnabled(variant: NativeAdVariant): boolean {
    if (!this.config || !this.config.enabled) {
      return false;
    }

    if (variant === "carousel") {
      return this.config.carousel?.enabled ?? false;
    }

    if (variant === "listItem") {
      return this.config.listView?.enabled ?? false;
    }

    return false;
  }

  /**
   * Get configuration for a specific list view
   */
  getListViewConfig(viewType: ListViewType): ListViewNativeAdConfig | null {
    if (!this.config?.listView?.enabled) {
      return null;
    }

    const viewConfig = this.config.listView.views[viewType];
    if (!viewConfig || !viewConfig.enabled) {
      return null;
    }

    return viewConfig;
  }

  /**
   * Calculate all ad positions for a list view
   */
  calculateListViewPositions(
    viewType: ListViewType,
    totalItems: number,
    blockIndex?: number
  ): number[] {
    const viewConfig = this.getListViewConfig(viewType);
    if (!viewConfig) {
      return [];
    }

    // If blockIndex is provided, check if ads are allowed in this block
    if (
      blockIndex !== undefined &&
      viewConfig.blockPositions &&
      !viewConfig.blockPositions.includes(blockIndex)
    ) {
      return [];
    }

    // Filter positions that are within the total items
    const validPositions = viewConfig.positions.filter(
      (pos) => pos < totalItems
    );

    // Limit to maxAdsPerList
    const limitedPositions = validPositions.slice(0, viewConfig.maxAdsPerList);

    // If in a block, limit to maxAdsPerBlock
    if (blockIndex !== undefined && viewConfig.maxAdsPerBlock !== undefined) {
      return limitedPositions.slice(0, viewConfig.maxAdsPerBlock);
    }

    return limitedPositions;
  }

  /**
   * Check if an ad should be shown at a specific position
   */
  shouldShowAdAtPosition(
    viewType: ListViewType,
    position: number,
    blockIndex?: number
  ): boolean {
    const viewConfig = this.getListViewConfig(viewType);
    if (!viewConfig) {
      return false;
    }

    // If blockIndex is provided, check if ads are allowed in this block
    if (
      blockIndex !== undefined &&
      viewConfig.blockPositions &&
      !viewConfig.blockPositions.includes(blockIndex)
    ) {
      return false;
    }

    // Check if position is in the configured positions
    if (!viewConfig.positions.includes(position)) {
      return false;
    }

    // Check if we've reached the maximum ads per list
    const positionsBeforeCurrent = viewConfig.positions.filter(
      (pos) => pos < position
    );
    if (positionsBeforeCurrent.length >= viewConfig.maxAdsPerList) {
      return false;
    }

    // If in a block, check maxAdsPerBlock
    if (blockIndex !== undefined && viewConfig.maxAdsPerBlock !== undefined) {
      const adsInBlockBeforeCurrent = positionsBeforeCurrent.length;
      if (adsInBlockBeforeCurrent >= viewConfig.maxAdsPerBlock) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the next ad position after the current position
   */
  getNextAdPosition(
    viewType: ListViewType,
    currentPosition: number,
    blockIndex?: number
  ): number | null {
    const viewConfig = this.getListViewConfig(viewType);
    if (!viewConfig) {
      return null;
    }

    // Find the next position after current
    const nextPositions = viewConfig.positions.filter(
      (pos) => pos > currentPosition
    );

    if (nextPositions.length === 0) {
      return null;
    }

    // Return the first (closest) next position
    return nextPositions[0];
  }

  /**
   * Get list view global configuration
   */
  getListViewGlobalConfig() {
    return this.config?.listView || null;
  }

  /**
   * Get carousel configuration
   */
  getCarouselConfig() {
    return this.config?.carousel || null;
  }

  /**
   * Get complete configuration
   */
  getConfig(): NativeAdsConfig | null {
    return this.config;
  }

  /**
   * Reset manager (useful for testing)
   */
  reset(): void {
    this.initialized = false;
    this.config = null;
    console.log("Native Ad Variant Manager reset");
  }
}

// Export singleton instance
export const nativeAdVariantManager = new NativeAdVariantManager();
export default nativeAdVariantManager;
