import { AdDebugData, AdDebugInfo } from "@/components/AdDebugInfo";
import { FadeInImage } from "@/components/FadeInImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { analyticsService } from "@/services/analytics";
import { nativeAdInstanceManager } from "@/services/nativeAdInstanceManager";
import { nativeAdVariantManager } from "@/services/nativeAdVariantManager";
import { Article } from "@/types";
import { hexToRgba } from "@/utils/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface NativeAdCarouselItemProps {
  item: Article;
  position: number;
  shouldLoad: boolean;
  onAdClicked?: () => void;
  onLoadComplete?: (success: boolean) => void;
  insets: { top: number; bottom: number; left: number; right: number };
  showingProgress?: boolean;
}

export function NativeAdCarouselItem({
  item,
  position,
  shouldLoad,
  onAdClicked,
  onLoadComplete,
  insets,
  showingProgress = false,
}: NativeAdCarouselItemProps) {
  const { brandConfig } = useBrandConfig();
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

  // Effect to handle lazy loading based on shouldLoad prop
  useEffect(() => {
    if (shouldLoad && !nativeAd && !isLoading && !hasError) {
      loadAd();
    }
  }, [shouldLoad, nativeAd, isLoading, hasError]);

  // Effect to handle unloading when shouldLoad becomes false
  useEffect(() => {
    if (!shouldLoad && nativeAd) {
      console.log(`🗑️ Unloading ad at position ${position} (shouldLoad=false)`);
      unloadAd();
    }
  }, [shouldLoad]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nativeAd) {
        console.log(
          `🧹 Cleanup: destroying ad at position ${position} on unmount`
        );
        try {
          nativeAd.destroy?.();
        } catch (error) {
          console.warn(`Error destroying ad at position ${position}:`, error);
        }
      }
    };
  }, [nativeAd, position]);

  const loadAd = async () => {
    setLoadStartTime(Date.now());

    // Check if ad is already loaded in instance manager
    const existingInstance = nativeAdInstanceManager.getAdInstance(position);
    if (existingInstance?.nativeAd && existingInstance.status === "loaded") {
      console.log(`✅ Using pre-loaded ad at position ${position}`);
      setNativeAd(existingInstance.nativeAd);
      setIsLoading(false);
      setLoadTimeMs(0); // Cached, instant load
      onLoadComplete?.(true);
      return;
    }

    setIsLoading(true);
    adViewStartTime.current = Date.now();

    try {
      console.log(`🔄 Loading ad at position ${position}...`);

      // Use instance manager to load ad
      const ad = await nativeAdInstanceManager.loadAdForPosition(position);

      const loadTime = Date.now() - loadStartTime;
      setLoadTimeMs(loadTime);

      if (ad) {
        setNativeAd(ad);
        setIsLoading(false);
        setHasError(false);
        setErrorMsg(undefined);
        onLoadComplete?.(true);
        console.log(`✅ Ad loaded successfully at position ${position}`);
      } else {
        // Ad failed to load - get error from instance manager
        const instance = nativeAdInstanceManager.getAdInstance(position);
        const errorMessage = instance?.error
          ? `${instance.error.message} (${instance.error.code})`
          : "Ad failed to load";

        setIsLoading(false);
        setHasError(true);
        setErrorMsg(errorMessage);
        onLoadComplete?.(false);
        console.log(
          `❌ Ad failed to load at position ${position}: ${errorMessage}`
        );
      }
    } catch (error: any) {
      console.error(`❌ Error loading ad at position ${position}:`, error);
      const loadTime = Date.now() - loadStartTime;
      setLoadTimeMs(loadTime);
      setHasError(true);
      setIsLoading(false);
      setErrorMsg(error?.message || "Unknown error");
      onLoadComplete?.(false);
    }
  };

  const unloadAd = () => {
    if (nativeAd) {
      try {
        nativeAd.destroy?.();
      } catch (error) {
        console.warn(`Error destroying ad at position ${position}:`, error);
      }
      setNativeAd(null);
      setIsLoading(false);
      hasLoggedImpression.current = false;
    }
  };

  // Log impression when ad becomes visible
  useEffect(() => {
    if (nativeAd && !hasLoggedImpression.current) {
      hasLoggedImpression.current = true;
      nativeAdInstanceManager.markAdAsViewed(position);
    }
  }, [nativeAd, position]);

  const handleAdPress = async () => {
    const dwellTime = Date.now() - adViewStartTime.current;

    // Track click
    analyticsService.logEvent("native_ad_click", {
      ad_id: item.id,
      position: item.id,
      dwell_time_ms: dwellTime,
      dwell_time_seconds: Math.round(dwellTime / 1000),
      is_real_ad: true,
    });

    onAdClicked?.();
  };

  const handleAdChoicesPress = async () => {
    // Google's ad preferences page
    const adChoicesUrl = "https://www.google.com/settings/ads";

    try {
      const canOpen = await Linking.canOpenURL(adChoicesUrl);
      if (canOpen) {
        await Linking.openURL(adChoicesUrl);

        // Track AdChoices click
        analyticsService.logEvent("native_ad_choices_click", {
          ad_id: item.id,
          position: item.id,
        });
      } else {
        Alert.alert("Error", "Cannot open ad preferences");
      }
    } catch (error) {
      console.error("Error opening AdChoices:", error);
      Alert.alert("Error", "Failed to open ad preferences");
    }
  };

  // Get ad unit ID for debug info - with safe fallback
  let adUnitId = "Unknown";
  try {
    if (nativeAdVariantManager.isInitialized()) {
      adUnitId = nativeAdVariantManager.getAdUnitId("carousel") || "Unknown";
    }
  } catch (error) {
    console.warn("Could not get ad unit ID for debug:", error);
  }
  const isTestAd = true;

  // Prepare debug data (before early returns so it's available for debug display)
  const debugData: AdDebugData = {
    adUnitId,
    adType: "native_carousel",
    requestResult: isLoading ? "loading" : hasError ? "failed" : "success",
    loadTimeMs,
    isTestAd,
    errorMessage: errorMsg,
    position,
  };

  // If ad failed to load and skipIfNotReady is true, show debug or skip
  if (hasError) {
    const config = brandConfig?.nativeAds as any;
    if (config?.skipIfNotReady !== false) {
      // Default to true (skip if not ready)
      if (debugEnabled) {
        return (
          <View style={styles.loadingContainer}>
            <AdDebugInfo data={debugData} variant="overlay" />
          </View>
        );
      }
      return null;
    }
  }

  // Show loading state if ad is loading or should load but not ready (only in development)
  if ((isLoading || (shouldLoad && !nativeAd && !hasError)) && __DEV__) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={brandConfig?.theme?.colors?.light?.primary || "#00AECA"}
        />
        <ThemedText style={styles.loadingText}>Loading ad...</ThemedText>
      </View>
    );
  }

  // If shouldLoad is false, don't render anything
  if (!shouldLoad) {
    return null;
  }

  // If ad not loaded yet and skipIfNotReady, show debug or skip
  if (!nativeAd) {
    const config = brandConfig?.nativeAds as any;
    if (config?.skipIfNotReady !== false) {
      // Default to true (skip if not ready)
      if (debugEnabled) {
        return (
          <View style={styles.loadingContainer}>
            <AdDebugInfo data={debugData} variant="overlay" />
          </View>
        );
      }
      return null;
    }
    // Otherwise show loading (handled above)
    return null;
  }

  // Extract ad data from the loaded native ad
  const adHeadline = nativeAd.headline || "Sponsored Content";
  const adBody = nativeAd.body || "";
  const adAdvertiser = nativeAd.advertiser || "Advertiser";
  const adCallToAction = nativeAd.callToAction || "Learn More";
  const adImage = nativeAd.images?.[0]?.url || item.imageUrl;
  const hasMediaContent = !!nativeAd.mediaContent;
  const hasVideo = hasMediaContent && nativeAd.mediaContent?.hasVideoContent;

  return (
    <NativeAdView nativeAd={nativeAd} style={styles.carouselItem}>
      <TouchableOpacity
        style={styles.carouselItemInner}
        onPress={handleAdPress}
        activeOpacity={0.9}
      >
        {/* Ad Media - Video or Image */}
        {hasMediaContent ? (
          <NativeMediaView
            style={styles.backgroundImage}
            resizeMode="contain"
          />
        ) : (
          <FadeInImage
            source={{ uri: adImage }}
            style={styles.backgroundImage}
            contentFit="cover"
            contentPosition="center"
          />
        )}

        {/* Sponsored Badge */}
        <View
          style={[
            styles.sponsoredBadge,
            { top: showingProgress ? insets.top + 80 : insets.top + 60 },
          ]}
        >
          <ThemedText
            style={[
              styles.sponsoredBadgeText,
              { fontFamily: brandConfig?.theme.fonts.primarySemiBold },
            ]}
          >
            Sponsored
          </ThemedText>
        </View>

        {/* AdChoices Icon - Top Right (Clickable) */}
        <TouchableOpacity
          style={[
            styles.adChoicesContainer,
            { top: showingProgress ? insets.top + 80 : insets.top + 60 },
          ]}
          onPress={handleAdChoicesPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.adChoicesIcon}>
            <ThemedText style={styles.adChoicesText}>ⓘ</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={
            [
              "transparent",
              hexToRgba(
                brandConfig?.theme.colors.light.overlayGradientEnd || "#011620",
                0.7
              ),
            ] as const
          }
          style={styles.overlay}
        >
          <ThemedView transparant style={styles.contentContainer}>
            {/* Ad Headline from Google */}
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <ThemedText
                type="title"
                style={[
                  styles.headline,
                  { fontFamily: brandConfig?.theme.fonts.primaryBold },
                ]}
              >
                {adHeadline}
              </ThemedText>
            </NativeAsset>

            {/* Ad Body from Google */}
            {adBody && (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <ThemedText
                  numberOfLines={3}
                  style={[
                    styles.body,
                    { fontFamily: brandConfig?.theme.fonts.primaryMedium },
                  ]}
                >
                  {adBody}
                </ThemedText>
              </NativeAsset>
            )}

            {/* Advertiser from Google */}
            <View style={styles.metaContainer}>
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <ThemedText
                  style={[
                    styles.advertiser,
                    { fontFamily: brandConfig?.theme.fonts.primaryMedium },
                  ]}
                >
                  {adAdvertiser}
                </ThemedText>
              </NativeAsset>
            </View>

            {/* Call to Action from Google */}
            <View style={styles.ctaButton}>
              <View style={styles.ctaButtonInner}>
                <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                  <ThemedText
                    style={[
                      styles.ctaButtonText,
                      { fontFamily: brandConfig?.theme.fonts.primarySemiBold },
                    ]}
                  >
                    {adCallToAction}
                  </ThemedText>
                </NativeAsset>
              </View>
            </View>
          </ThemedView>
        </LinearGradient>
      </TouchableOpacity>

      {/* Debug Info Overlay */}
      {debugEnabled && <AdDebugInfo data={debugData} variant="overlay" />}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  carouselItem: {
    width: screenWidth,
    height: screenHeight,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#011620",
  },
  carouselItemInner: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  loadingContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sponsoredBadge: {
    position: "absolute",
    top: 0,
    left: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 20,
  },
  sponsoredBadgeText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "600",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  headline: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "bold",
    marginBottom: 16,
  },
  body: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  advertiser: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
  },
  ctaButton: {
    alignSelf: "flex-start",
  },
  ctaButtonInner: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  adChoicesContainer: {
    position: "absolute",
    top: 120,
    right: 24,
    zIndex: 20,
  },
  adChoicesIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  adChoicesText: {
    fontSize: 16,
    color: "#666666",
  },
  mediaView: {
    width: "100%",
    height: "100%",
  },
});

export default NativeAdCarouselItem;
