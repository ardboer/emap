/**
 * Display Ads Configuration Types
 *
 * This file defines types for configuring display ads (banner ads) across the app.
 * Note: Native ads (carousel ads) have separate configuration and are not affected by these types.
 */

/**
 * Available ad sizes from Google AdMob
 */
export type AdSizeType =
  | "BANNER" // 320x50
  | "LARGE_BANNER" // 320x100
  | "MEDIUM_RECTANGLE" // 300x250
  | "FULL_BANNER" // 468x60
  | "LEADERBOARD"; // 728x90

/**
 * Ad position types
 */
export type AdPositionType = "after_lead" | "in_content" | "between_blocks";

/**
 * Configuration for a single ad position
 */
export interface DisplayAdPosition {
  /** Type of position where ad should appear */
  type: AdPositionType;
  /** Size of the ad to display */
  size: AdSizeType;
  /** Whether this position is enabled */
  enabled: boolean;
  /** For in_content: after which paragraph number (1-based) */
  afterParagraph?: number;
  /** For between_blocks: after which block number (1-based) */
  afterBlock?: number;
}

/**
 * Configuration for article detail page ads
 */
export interface ArticleDetailAdConfig {
  /** Whether ads are enabled on article detail pages */
  enabled: boolean;
  /** Maximum number of ads to show per article page */
  maxAdsPerPage: number;
  /** Minimum number of paragraphs between ads */
  paragraphInterval: number;
  /** List of allowed ad sizes for this context */
  allowedSizes: AdSizeType[];
  /** Specific ad positions configuration */
  positions: DisplayAdPosition[];
}

/**
 * Configuration for list view ads
 */
export interface ListViewAdConfig {
  /** Whether ads are enabled in list views */
  enabled: boolean;
  /** Maximum number of ads to show per list page */
  maxAdsPerPage: number;
  /** Minimum number of blocks/items between ads */
  blockInterval: number;
  /** List of allowed ad sizes for this context */
  allowedSizes: AdSizeType[];
  /** Specific ad positions configuration */
  positions: DisplayAdPosition[];
}

/**
 * Complete display ads configuration
 * This is separate from nativeAds configuration
 */
export interface DisplayAdsConfig {
  /** Master switch for all display ads */
  enabled: boolean;
  /** Whether to use test ads (Google test ad units) */
  testMode: boolean;
  /** Configuration for article detail pages */
  articleDetail: ArticleDetailAdConfig;
  /** Configuration for list views */
  listView: ListViewAdConfig;
  /** Ad unit IDs per platform */
  adUnitIds: {
    ios: string;
    android: string;
  };
}

/**
 * Ad placement calculation result
 */
export interface AdPlacement {
  /** Position index where ad should appear */
  position: number;
  /** Size of ad to display */
  size: AdSizeType;
  /** Type of position */
  type: AdPositionType;
}
