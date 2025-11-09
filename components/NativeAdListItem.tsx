import { AdDebugData, AdDebugInfo } from "@/components/AdDebugInfo";
import { FadeInImage } from "@/components/FadeInImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { analyticsService } from "@/services/analytics";
import { nativeAdListLoader } from "@/services/nativeAdListLoader";
import { nativeAdVariantManager } from "@/services/nativeAdVariantManager";
import { ListViewType } from "@/types/ads";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from "react-native-google-mobile-ads";

const { width: screenWidth } = Dimensions.get("window");

// Calculate responsive thumbnail size (same as ArticleTeaser)
const getResponsiveThumbnailSize = () => {
  const baseWidth = 320;
  const baseThumbnailWidth = 100;
  const baseThumbnailHeight = 75;

  const scaleFactor = Math.min(
    1.5,
    Math.max(1.0, ((screenWidth - baseWidth) / (393 - baseWidth)) * 0.2 + 1.5)
  );

  return {
    width: Math.round(baseThumbnailWidth * scaleFactor),
    height: Math.round(baseThumbnailHeight * scaleFactor),
  };
};

const thumbnailSize = getResponsiveThumbnailSize();

interface NativeAdListItemProps {
  position: number;
  viewType: ListViewType;
  blockIndex?: number;
  onAdLoaded?: (position: number) => void;
  onAdFailed?: (position: number) => void;
  onAdClicked?: (position: number) => void;
}

export function NativeAdListItem({
  position,
  viewType,
  blockIndex,
  onAdLoaded,
  onAdFailed,
  onAdClicked,
}: NativeAdListItemProps) {
  const { brandConfig } = useBrandConfig();
  const colorScheme = useColorScheme() ?? "light";
  const adViewStartTime = useRef<number>(Date.now());
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [loadTimeMs, setLoadTimeMs] = useState<number | undefined>(undefined);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const hasLoggedImpression = useRef(false);

  // Load debug setting
  useEffect(() => {
    AsyncStorage.getItem("debug_ads_enabled").then((value) => {
      setDebugEnabled(value === "true");
    });
  }, []);

  // Initialize variant manager
  useEffect(() => {
    if (!nativeAdVariantManager.isInitialized()) {
      nativeAdVariantManager.initialize();
    }
  }, []);

  // Load ad on mount
  useEffect(() => {
    loadAd();

    // Cleanup on unmount
    return () => {
      if (nativeAd) {
        console.log(
          `🧹 Cleanup: destroying list ad at position ${position} on unmount`
        );
        try {
          nativeAd.destroy?.();
        } catch (error) {
          console.warn(`Error destroying ad at position ${position}:`, error);
        }
      }
    };
  }, []);

  const loadAd = async () => {
    setLoadStartTime(Date.now());

    // Check if ad is already cached
    const cachedAd = nativeAdListLoader.getCachedAd(viewType, position);
    if (cachedAd) {
      console.log(`✅ Using cached ad for ${viewType} at position ${position}`);
      setNativeAd(cachedAd);
      setIsLoading(false);
      setLoadTimeMs(0); // Cached, instant load
      onAdLoaded?.(position);
      return;
    }

    setIsLoading(true);
    adViewStartTime.current = Date.now();

    try {
      const result = await nativeAdListLoader.loadAdForListPosition(
        viewType,
        position
      );

      const loadTime = Date.now() - loadStartTime;
      setLoadTimeMs(loadTime);

      if (result.ad) {
        setNativeAd(result.ad);
        setIsLoading(false);
        setHasError(false);
        setErrorMsg(undefined);
        onAdLoaded?.(position);
        console.log(`✅ Ad loaded for ${viewType} at position ${position}`);
      } else {
        setIsLoading(false);
        setHasError(true);
        // Use the specific error message from the loader
        const errorMessage = result.error
          ? `${result.error.message} (${result.error.code})`
          : "Ad failed to load";
        setErrorMsg(errorMessage);
        onAdFailed?.(position);
        console.log(
          `❌ Ad failed to load for ${viewType} at position ${position}: ${errorMessage}`
        );
      }
    } catch (error: any) {
      console.error(
        `❌ Error loading ad for ${viewType} at position ${position}:`,
        error
      );
      const loadTime = Date.now() - loadStartTime;
      setLoadTimeMs(loadTime);
      setHasError(true);
      setIsLoading(false);
      setErrorMsg(error?.message || "Unknown error");
      onAdFailed?.(position);
    }
  };

  // Log impression when ad becomes visible
  useEffect(() => {
    if (nativeAd && !hasLoggedImpression.current) {
      hasLoggedImpression.current = true;

      analyticsService.logEvent("native_ad_list_impression", {
        view_type: viewType,
        position,
        block_index: blockIndex,
        time_to_view_ms: Date.now() - adViewStartTime.current,
      });
    }
  }, [nativeAd, position, viewType, blockIndex]);

  const handleAdPress = async () => {
    const dwellTime = Date.now() - adViewStartTime.current;

    // Track click
    analyticsService.logEvent("native_ad_list_click", {
      view_type: viewType,
      position,
      block_index: blockIndex,
      dwell_time_ms: dwellTime,
      dwell_time_seconds: Math.round(dwellTime / 1000),
    });

    onAdClicked?.(position);
  };

  const handleAdChoicesPress = async () => {
    const adChoicesUrl = "https://www.google.com/settings/ads";

    try {
      const canOpen = await Linking.canOpenURL(adChoicesUrl);
      if (canOpen) {
        await Linking.openURL(adChoicesUrl);

        analyticsService.logEvent("native_ad_list_choices_click", {
          view_type: viewType,
          position,
        });
      } else {
        Alert.alert("Error", "Cannot open ad preferences");
      }
    } catch (error) {
      console.error("Error opening AdChoices:", error);
      Alert.alert("Error", "Failed to open ad preferences");
    }
  };

  // Get configuration
  const adConfig = nativeAdVariantManager.getListViewGlobalConfig();

  // Get ad unit ID for debug info - with safe fallback
  let adUnitId = "Unknown";
  try {
    if (nativeAdVariantManager.isInitialized()) {
      adUnitId = nativeAdVariantManager.getAdUnitId("listItem") || "Unknown";
    }
  } catch (error) {
    console.warn("Could not get ad unit ID for debug:", error);
  }
  // Test mode is at the root config level, default to true for safety
  const isTestAd = true;

  // Prepare debug data (before early returns so it's available for debug display)
  const debugData: AdDebugData = {
    adUnitId,
    adType: "native_list",
    requestResult: isLoading ? "loading" : hasError ? "failed" : "success",
    loadTimeMs,
    isTestAd,
    errorMessage: errorMsg,
    position,
    viewType,
  };

  // If ad failed to load and skipIfNotReady is true, show debug or skip
  if (hasError && adConfig?.skipIfNotReady !== false) {
    if (debugEnabled) {
      return (
        <View style={styles.container}>
          <AdDebugInfo data={debugData} variant="inline" />
        </View>
      );
    }
    return null;
  }

  // Show loading state if configured (only in development)
  if (isLoading && adConfig?.showLoadingIndicator && __DEV__) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color={brandConfig?.theme?.colors?.light?.primary || "#00AECA"}
        />
        <ThemedText style={styles.loadingText}>Loading ad...</ThemedText>
      </View>
    );
  }

  // If still loading but not showing indicator, show debug or skip
  if (isLoading) {
    if (debugEnabled) {
      return (
        <View style={styles.container}>
          <AdDebugInfo data={debugData} variant="inline" />
        </View>
      );
    }
    return null;
  }

  // If ad not loaded yet, show debug or skip
  if (!nativeAd) {
    if (debugEnabled) {
      return (
        <View style={styles.container}>
          <AdDebugInfo data={debugData} variant="inline" />
        </View>
      );
    }
    return null;
  }

  // Extract ad data
  const adHeadline = nativeAd.headline || "Sponsored Content";
  const adBody = nativeAd.body || "";
  const adAdvertiser = nativeAd.advertiser || "Advertiser";
  const adImage = nativeAd.images?.[0]?.url || "";
  const adIcon = nativeAd.icon?.url || "";

  // For list view, we skip video ads since the thumbnail is too small
  // Only use static images to avoid AdMob MediaView size warnings

  return (
    <NativeAdView nativeAd={nativeAd} style={styles.container}>
      <TouchableOpacity
        style={styles.articleContainer}
        onPress={handleAdPress}
        activeOpacity={0.7}
      >
        {/* Thumbnail Image - Only static images, no video */}
        <ThemedView style={styles.imageWrapper}>
          {adImage ? (
            // Use regular image if available
            <FadeInImage
              source={{ uri: adImage }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : adIcon ? (
            // Fallback to icon if available
            <FadeInImage
              source={{ uri: adIcon }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            // Show placeholder if no image available
            <View style={[styles.thumbnail, styles.placeholderImage]}>
              <ThemedText style={styles.placeholderText}>Ad</ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Content Container */}
        <ThemedView style={styles.contentContainer}>
          {/* Sponsored Badge and AdChoices */}
          <View style={styles.metaRow}>
            <View style={styles.sponsoredBadge}>
              <ThemedText style={styles.sponsoredText}>Sponsored</ThemedText>
            </View>

            {/* AdChoices Icon */}
            {/* <TouchableOpacity
              onPress={handleAdChoicesPress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.adChoicesButton}
            >
              <View style={styles.adChoicesIcon}>
                <ThemedText style={styles.adChoicesText}>ⓘ</ThemedText>
              </View>
            </TouchableOpacity> */}
          </View>

          {/* Ad Headline */}
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <ThemedText
              type="defaultSemiBold"
              numberOfLines={3}
              style={[
                styles.title,
                { color: Colors[colorScheme].articleTeaserTitleText },
              ]}
            >
              {adHeadline}
            </ThemedText>
          </NativeAsset>

          {/* Ad Body (optional, if space allows) */}
          {adBody && (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <ThemedText numberOfLines={2} style={styles.body}>
                {adBody}
              </ThemedText>
            </NativeAsset>
          )}

          {/* Advertiser */}
          <NativeAsset assetType={NativeAssetType.ADVERTISER}>
            <ThemedText style={styles.advertiser} numberOfLines={1}>
              {adAdvertiser}
            </ThemedText>
          </NativeAsset>
        </ThemedView>
      </TouchableOpacity>

      {/* Debug Info */}
      {debugEnabled && <AdDebugInfo data={debugData} variant="inline" />}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  articleContainer: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
  imageWrapper: {
    paddingTop: 4,
    backgroundColor: "transparent",
  },
  thumbnail: {
    width: thumbnailSize.width,
    height: thumbnailSize.height,
    borderRadius: 3,
  },
  placeholderImage: {
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    opacity: 0.5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  sponsoredBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sponsoredText: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.7,
    textTransform: "uppercase",
  },
  adChoicesButton: {
    padding: 4,
  },
  adChoicesIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  adChoicesText: {
    fontSize: 12,
    opacity: 0.6,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    marginBottom: 4,
  },
  advertiser: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 12,
    opacity: 0.6,
  },
});

export default NativeAdListItem;
