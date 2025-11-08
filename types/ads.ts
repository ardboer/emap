/**
 * Display Ads and Native Ads Configuration Types
 *
 * This file defines types for configuring both display ads (banner ads) and native ads across the app.
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
 * Native ad variant types
 */
export type NativeAdVariant = "carousel" | "listItem";

/**
 * List view types that support native ads
 */
export type ListViewType = "news" | "clinical" | "events" | "trending";

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

/**
 * Configuration for a single list view's native ads
 */
export interface ListViewNativeAdConfig {
  /** Whether native ads are enabled for this list view */
  enabled: boolean;
  /** Specific positions where ads should appear (0-based indices) */
  positions: number[];
  /** Maximum number of ads to show in this list */
  maxAdsPerList: number;
  /** For section-based lists: which block indices can have ads */
  blockPositions?: number[];
  /** Maximum ads per block (for section lists) */
  maxAdsPerBlock?: number;
}

/**
 * Carousel native ad configuration
 */
export interface CarouselNativeAdConfig {
  enabled: boolean;
  firstAdPosition: number;
  adInterval: number;
  preloadDistance: number;
  unloadDistance: number;
  maxCachedAds: number;
  maxAdsPerSession: number | null;
  showLoadingIndicator: boolean;
  skipIfNotReady: boolean;
}

/**
 * List view native ads configuration
 */
export interface ListViewNativeAdsConfig {
  /** Whether list view native ads are enabled globally */
  enabled: boolean;
  /** Configuration per list view type */
  views: {
    news?: ListViewNativeAdConfig;
    clinical?: ListViewNativeAdConfig;
    events?: ListViewNativeAdConfig;
  };
  /** Whether to preload ads */
  preloadAds: boolean;
  /** Show loading placeholder */
  showLoadingIndicator: boolean;
  /** Skip position if ad not ready */
  skipIfNotReady: boolean;
}

/**
 * Complete native ads configuration with variant support
 */
export interface NativeAdsConfig {
  /** Master switch for all native ads */
  enabled: boolean;
  /** Whether to use test ads (Google test ad units) */
  testMode: boolean;
  /** Carousel variant configuration */
  carousel?: CarouselNativeAdConfig;
  /** List view variant configuration */
  listView?: ListViewNativeAdsConfig;
  /** Ad unit IDs per variant and platform */
  adUnitIds: {
    carousel: {
      ios: string;
      android: string;
    };
    listView: {
      ios: string;
      android: string;
    };
  };
  // Legacy support for old config format
  firstAdPosition?: number;
  adInterval?: number;
  adFrequency?: number;
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
