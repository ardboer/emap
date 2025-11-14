/**
 * Display Ad Manager Service
 *
 * Manages display ad placement logic based on brand configuration.
 * Calculates where ads should appear in article content and list views.
 * Now integrates with GAM service for consent management.
 *
 * Note: This is separate from native ads (carousel ads) which have their own configuration.
 */

import {
  AdPlacement,
  AdSizeType,
  ArticleDetailAdConfig,
  DisplayAdsConfig,
  ListViewAdConfig,
} from "@/types/ads";
import { gamService } from "./gam";

class DisplayAdManager {
  private config: DisplayAdsConfig | null = null;
  private canRequestAds = false;
  private initialized = false;

  /**
   * Initialize the manager with brand configuration
   * Now integrates with GAM service for consent management
   * Uses initialization guard to prevent redundant initialization
   */
  async initialize(config: DisplayAdsConfig): Promise<void> {
    // Guard: Skip if already initialized with same config
    if (this.initialized && this.config?.enabled === config.enabled) {
      return;
    }

    this.config = config;
    this.initialized = true;

    // Initialize GAM service if not already initialized
    if (!gamService.isInitialized()) {
      await gamService.initialize({
        useTestAds: config.testMode,
      });
    }

    // Check if we can request ads (consent obtained)
    this.canRequestAds = gamService.canRequestAds();

    if (!this.canRequestAds) {
      console.warn(
        "[DisplayAdManager] Cannot request ads - consent not obtained"
      );
    }

    console.log("[DisplayAdManager] Initialized:", {
      enabled: config.enabled,
      testMode: config.testMode,
      canRequestAds: this.canRequestAds,
      articleDetailEnabled: config.articleDetail.enabled,
      listViewEnabled: config.listView.enabled,
    });
  }

  /**
   * Check if display ads are enabled globally and can be requested
   * Now includes consent check
   */
  isEnabled(): boolean {
    const configEnabled = this.config?.enabled ?? false;
    return configEnabled && this.canRequestAds;
  }

  /**
   * Check if test mode is enabled
   */
  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }

  /**
   * Get the ad unit ID for the current platform
   * Now uses GAM service for ad unit IDs
   */
  getAdUnitId(format: "banner" | "mpu" = "banner"): string | null {
    if (!this.config) {
      console.warn("[DisplayAdManager] Not initialized");
      return null;
    }

    // Use GAM service to get ad unit ID
    // This will return test IDs in test mode, or GAM production IDs
    return format === "mpu"
      ? gamService.getMPUAdUnitId()
      : gamService.getBannerAdUnitId();
  }

  /**
   * Calculate ad placements for article detail content
   * Now includes consent check
   *
   * @param paragraphCount Total number of paragraphs in the article
   * @returns Array of ad placements with position and size
   */
  calculateArticleAdPlacements(paragraphCount: number): AdPlacement[] {
    if (
      !this.config ||
      !this.config.articleDetail.enabled ||
      !this.canRequestAds
    ) {
      return [];
    }

    const config = this.config.articleDetail;
    const placements: AdPlacement[] = [];

    // Process each configured position
    for (const position of config.positions) {
      if (!position.enabled) continue;

      if (position.type === "after_lead") {
        // Ad after lead text (position 0 = before first paragraph)
        placements.push({
          position: 0,
          size: position.size,
          type: position.type,
        });
      } else if (position.type === "in_content" && position.afterParagraph) {
        // Ads within content at specified intervals
        let currentPosition = position.afterParagraph;

        while (
          currentPosition < paragraphCount &&
          placements.length < config.maxAdsPerPage
        ) {
          placements.push({
            position: currentPosition,
            size: position.size,
            type: position.type,
          });

          currentPosition += config.paragraphInterval;
        }
      }
    }

    // Limit to maxAdsPerPage
    const limitedPlacements = placements.slice(0, config.maxAdsPerPage);

    // console.log("[DisplayAdManager] Article ad placements calculated:", {
    //   paragraphCount,
    //   totalPlacements: limitedPlacements.length,
    //   maxAllowed: config.maxAdsPerPage,
    //   placements: limitedPlacements,
    // });

    return limitedPlacements;
  }

  /**
   * Calculate ad placements for list views
   * Now includes consent check
   *
   * @param blockCount Total number of blocks/items in the list
   * @returns Array of ad placements with position and size
   */
  calculateListAdPlacements(blockCount: number): AdPlacement[] {
    if (!this.config || !this.config.listView.enabled || !this.canRequestAds) {
      return [];
    }

    const config = this.config.listView;
    const placements: AdPlacement[] = [];

    // Process each configured position
    for (const position of config.positions) {
      if (!position.enabled) continue;

      if (position.type === "between_blocks" && position.afterBlock) {
        // Ads between blocks at specified intervals
        let currentPosition = position.afterBlock;

        while (
          currentPosition < blockCount &&
          placements.length < config.maxAdsPerPage
        ) {
          placements.push({
            position: currentPosition,
            size: position.size,
            type: position.type,
          });

          currentPosition += config.blockInterval;
        }
      }
    }

    // Limit to maxAdsPerPage
    const limitedPlacements = placements.slice(0, config.maxAdsPerPage);

    console.log("[DisplayAdManager] List ad placements calculated:", {
      blockCount,
      totalPlacements: limitedPlacements.length,
      maxAllowed: config.maxAdsPerPage,
      placements: limitedPlacements,
    });

    return limitedPlacements;
  }

  /**
   * Check if an ad should be shown at a specific position in article content
   *
   * @param paragraphIndex Current paragraph index (0-based)
   * @param totalParagraphs Total number of paragraphs
   * @returns Ad placement info if ad should be shown, null otherwise
   */
  shouldShowArticleAd(
    paragraphIndex: number,
    totalParagraphs: number
  ): AdPlacement | null {
    const placements = this.calculateArticleAdPlacements(totalParagraphs);
    return placements.find((p) => p.position === paragraphIndex) || null;
  }

  /**
   * Check if an ad should be shown at a specific position in list view
   *
   * @param blockIndex Current block index (0-based)
   * @param totalBlocks Total number of blocks
   * @returns Ad placement info if ad should be shown, null otherwise
   */
  shouldShowListAd(
    blockIndex: number,
    totalBlocks: number
  ): AdPlacement | null {
    const placements = this.calculateListAdPlacements(totalBlocks);
    return placements.find((p) => p.position === blockIndex) || null;
  }

  /**
   * Get configuration for article detail ads
   */
  getArticleDetailConfig(): ArticleDetailAdConfig | null {
    return this.config?.articleDetail || null;
  }

  /**
   * Get configuration for list view ads
   */
  getListViewConfig(): ListViewAdConfig | null {
    return this.config?.listView || null;
  }

  /**
   * Validate ad size is allowed in the given context
   */
  isAdSizeAllowed(size: AdSizeType, context: "article" | "list"): boolean {
    if (!this.config) return false;

    const allowedSizes =
      context === "article"
        ? this.config.articleDetail.allowedSizes
        : this.config.listView.allowedSizes;

    return allowedSizes.includes(size);
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
    console.log(
      "[DisplayAdManager] Consent status refreshed:",
      this.canRequestAds
    );
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig(): DisplayAdsConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const displayAdManager = new DisplayAdManager();
export default displayAdManager;
