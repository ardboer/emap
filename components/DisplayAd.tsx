/**
 * DisplayAd Component
 *
 * Reusable wrapper for banner ads that integrates with brand configuration.
 * Automatically uses the correct ad unit ID and size based on context.
 */

import { useBrandConfig } from "@/hooks/useBrandConfig";
import { AdSizes } from "@/services/admob";
import { displayAdManager } from "@/services/displayAdManager";
import { AdSizeType } from "@/types/ads";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BannerAdSize } from "react-native-google-mobile-ads";
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
  onAdLoaded,
  onAdFailedToLoad,
  onAdClicked,
}: DisplayAdProps) {
  const { brandConfig } = useBrandConfig();
  const [shouldRender, setShouldRender] = useState(false);

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

    setShouldRender(
      adsEnabled && contextConfig?.enabled === true && sizeAllowed
    );
  }, [brandConfig, context, size]);

  // Don't render if ads are disabled or size not allowed
  if (!shouldRender) {
    return null;
  }

  const bannerSize = mapAdSize(size);

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        size={bannerSize}
        showLoadingIndicator={true}
        showErrorMessage={false}
        onAdLoaded={() => {
          // console.log(`Display ad loaded: ${context} - ${size}`);
          onAdLoaded?.();
        }}
        onAdFailedToLoad={(error) => {
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
