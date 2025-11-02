/**
 * Display Ad Manager Service
 *
 * Manages display ad placement logic based on brand configuration.
 * Calculates where ads should appear in article content and list views.
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
import { Platform } from "react-native";

class DisplayAdManager {
  private config: DisplayAdsConfig | null = null;

  /**
   * Initialize the manager with brand configuration
   */
  initialize(config: DisplayAdsConfig): void {
    this.config = config;
    console.log("DisplayAdManager initialized:", {
      enabled: config.enabled,
      testMode: config.testMode,
      articleDetailEnabled: config.articleDetail.enabled,
      listViewEnabled: config.listView.enabled,
    });
  }

  /**
   * Check if display ads are enabled globally
   */
  isEnabled(): boolean {
    return this.config?.enabled ?? false;
  }

  /**
   * Check if test mode is enabled
   */
  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }

  /**
   * Get the ad unit ID for the current platform
   */
  getAdUnitId(): string | null {
    if (!this.config) {
      console.warn("DisplayAdManager not initialized");
      return null;
    }

    const platform = Platform.OS as "ios" | "android";
    return this.config.adUnitIds[platform] || null;
  }

  /**
   * Calculate ad placements for article detail content
   *
   * @param paragraphCount Total number of paragraphs in the article
   * @returns Array of ad placements with position and size
   */
  calculateArticleAdPlacements(paragraphCount: number): AdPlacement[] {
    if (!this.config || !this.config.articleDetail.enabled) {
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

    console.log("Article ad placements calculated:", {
      paragraphCount,
      totalPlacements: limitedPlacements.length,
      maxAllowed: config.maxAdsPerPage,
      placements: limitedPlacements,
    });

    return limitedPlacements;
  }

  /**
   * Calculate ad placements for list views
   *
   * @param blockCount Total number of blocks/items in the list
   * @returns Array of ad placements with position and size
   */
  calculateListAdPlacements(blockCount: number): AdPlacement[] {
    if (!this.config || !this.config.listView.enabled) {
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

    console.log("List ad placements calculated:", {
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
   * Get current configuration (for debugging)
   */
  getConfig(): DisplayAdsConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const displayAdManager = new DisplayAdManager();
export default displayAdManager;
