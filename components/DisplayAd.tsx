/**
 * DisplayAd Component
 *
 * Reusable wrapper for banner ads that integrates with brand configuration.
 * Automatically uses the correct ad unit ID and size based on context.
 *
 * Now supports lazy loading to improve viewability metrics by loading ads
 * just before they come into view (250px threshold by default).
 */

import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useInView } from "@/hooks/useInView";
import { AdSizes } from "@/services/admob";
import { displayAdLazyLoadManager } from "@/services/displayAdLazyLoadManager";
import { displayAdManager } from "@/services/displayAdManager";
import { AdSizeType } from "@/types/ads";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BannerAdSize } from "react-native-google-mobile-ads";
import { AdPlaceholder } from "./AdPlaceholder";
import { BannerAd } from "./BannerAd";

interface DisplayAdProps {
  /**
   * Context where the ad is being displayed
   */
  context: "article_detail" | "list_view";
  /**
   * Size of the ad to display
   */
  size: AdSizeType;
  /**
   * Optional custom style
   */
  style?: any;
  /**
   * Enable lazy loading (default: true)
   */
  enableLazyLoad?: boolean;
  /**
   * Distance in pixels before viewport to start loading (default: 250)
   */
  lazyLoadThreshold?: number;
  /**
   * Show placeholder while loading (default: true)
   */
  showPlaceholder?: boolean;
  /**
   * Optional callback when ad loads
   */
  onAdLoaded?: () => void;
  /**
   * Optional callback when ad fails to load
   */
  onAdFailedToLoad?: (error: any) => void;
  /**
   * Optional callback when ad is clicked
   */
  onAdClicked?: () => void;
}

/**
 * Map our AdSizeType to react-native-google-mobile-ads BannerAdSize
 */
const mapAdSize = (size: AdSizeType): BannerAdSize => {
  switch (size) {
    case "BANNER":
      return AdSizes.BANNER;
    case "LARGE_BANNER":
      return AdSizes.LARGE_BANNER;
    case "MEDIUM_RECTANGLE":
      return AdSizes.MEDIUM_RECTANGLE;
    case "FULL_BANNER":
      return AdSizes.FULL_BANNER;
    case "LEADERBOARD":
      return AdSizes.LEADERBOARD;
    default:
      return AdSizes.BANNER;
  }
};

export function DisplayAd({
  context,
  size,
  style,
  enableLazyLoad = true,
  lazyLoadThreshold = 250,
  showPlaceholder = true,
  onAdLoaded,
  onAdFailedToLoad,
  onAdClicked,
}: DisplayAdProps) {
  const { brandConfig } = useBrandConfig();
  const [shouldRender, setShouldRender] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!enableLazyLoad);
  const adId = useRef(
    `display-ad-${context}-${size}-${Date.now()}-${Math.random()}`
  ).current;
  const hasEnteredView = useRef(false);

  // Lazy loading with viewport detection
  const { ref, inView } = useInView({
    threshold: lazyLoadThreshold,
    enabled: enableLazyLoad,
    onEnterView: () => {
      if (enableLazyLoad && !shouldLoad && !hasEnteredView.current) {
        hasEnteredView.current = true;
        displayAdLazyLoadManager.startLoading(adId);
        setShouldLoad(true);
      }
    },
    onExitView: () => {
      // Track viewability when ad exits viewport
      if (displayAdLazyLoadManager.isLoaded(adId)) {
        displayAdLazyLoadManager.trackViewability(adId);
      }
    },
  });

  useEffect(() => {
    // Initialize display ad manager with brand config if available
    if (brandConfig?.displayAds) {
      displayAdManager.initialize(brandConfig.displayAds);
    }

    // Check if ads are enabled and size is allowed
    const adsEnabled = displayAdManager.isEnabled();
    const contextConfig =
      context === "article_detail"
        ? displayAdManager.getArticleDetailConfig()
        : displayAdManager.getListViewConfig();

    const sizeAllowed = displayAdManager.isAdSizeAllowed(
      size,
      context === "article_detail" ? "article" : "list"
    );

    const shouldShow =
      adsEnabled && contextConfig?.enabled === true && sizeAllowed;
    setShouldRender(shouldShow);

    // Register ad with lazy load manager if enabled
    if (shouldShow && enableLazyLoad) {
      displayAdLazyLoadManager.registerAd(adId, context, size);
    }

    // Cleanup on unmount
    return () => {
      if (enableLazyLoad) {
        displayAdLazyLoadManager.unregisterAd(adId);
      }
    };
  }, [brandConfig, context, size, enableLazyLoad, adId]);

  // Track when ad enters viewport for viewability
  useEffect(() => {
    if (inView && shouldLoad && displayAdLazyLoadManager.isLoaded(adId)) {
      displayAdLazyLoadManager.markAsViewed(adId);
    }
  }, [inView, shouldLoad, adId]);

  // Don't render if ads are disabled or size not allowed
  if (!shouldRender) {
    return null;
  }

  const bannerSize = mapAdSize(size);

  return (
    <View ref={ref} style={[styles.container, style]}>
      {shouldLoad ? (
        <BannerAd
          size={bannerSize}
          showLoadingIndicator={true}
          showErrorMessage={false}
          onAdLoaded={() => {
            displayAdLazyLoadManager.markAsLoaded(adId);
            // console.log(`Display ad loaded: ${context} - ${size}`);
            onAdLoaded?.();
          }}
          onAdFailedToLoad={(error) => {
            displayAdLazyLoadManager.markAsFailed(adId, error);

            // Check if this is a "no-fill" error (no ad available)
            const isNoFillError =
              error?.message?.includes("no-fill") ||
              error?.message?.includes("No ad to show") ||
              error?.code === "no-fill";

            // Only log non-no-fill errors as these are expected and not actual issues
            if (!isNoFillError) {
              console.log(`Display ad failed: ${context} - ${size}`, error);
            }

            onAdFailedToLoad?.(error);
          }}
          onAdClicked={() => {
            console.log(`Display ad clicked: ${context} - ${size}`);
            onAdClicked?.();
          }}
        />
      ) : showPlaceholder ? (
        <AdPlaceholder size={size} showLoadingIndicator={true} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default DisplayAd;
