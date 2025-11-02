import { FadeInImage } from "@/components/FadeInImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { analyticsService } from "@/services/analytics";
import { nativeAdLoader } from "@/services/nativeAdLoader";
import { Article } from "@/types";
import { hexToRgba } from "@/utils/colors";
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
import { NativeAd } from "react-native-google-mobile-ads";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface NativeAdCarouselItemProps {
  item: Article;
  onAdClicked?: () => void;
  insets: { top: number; bottom: number; left: number; right: number };
  showingProgress?: boolean;
}

export function NativeAdCarouselItem({
  item,
  onAdClicked,
  insets,
  showingProgress = false,
}: NativeAdCarouselItemProps) {
  const { brandConfig } = useBrandConfig();
  const adViewStartTime = useRef<number>(Date.now());
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    adViewStartTime.current = Date.now();
    loadAd();

    return () => {
      // Cleanup: destroy ad when component unmounts
      if (nativeAd) {
        try {
          nativeAd.destroy?.();
        } catch (error) {
          console.warn("Error destroying native ad:", error);
        }
      }
    };
  }, []);

  const loadAd = async () => {
    try {
      // Initialize ad loader if needed
      if (!nativeAdLoader.isInitialized()) {
        await nativeAdLoader.initialize();
      }

      const adUnitId = nativeAdLoader.getAdUnitId();
      const startTime = Date.now();

      // Log ad request
      nativeAdLoader.logAdRequest(item.id);

      console.log("Loading native ad with unit ID:", adUnitId);

      // Create and load native ad
      const ad = await NativeAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      const loadTime = Date.now() - startTime;

      // Log successful load
      nativeAdLoader.logAdLoaded(item.id, loadTime);

      setNativeAd(ad);
      setIsLoading(false);

      // Log detailed ad data
      console.log("Native ad loaded successfully in", loadTime, "ms");
      console.log("Ad Data:", {
        headline: ad.headline || "N/A",
        body: ad.body || "N/A",
        advertiser: ad.advertiser || "N/A",
        callToAction: ad.callToAction || "N/A",
        store: ad.store || "N/A",
        price: ad.price || "N/A",
        starRating: ad.starRating || "N/A",
        imageCount: ad.images?.length || 0,
        hasIcon: !!ad.icon,
        hasMediaContent: !!ad.mediaContent,
      });

      // Track impression
      analyticsService.logEvent("native_ad_impression", {
        ad_id: item.id,
        position: item.id,
        time_to_view_ms: 0,
        is_real_ad: true,
      });
    } catch (error: any) {
      console.error("Failed to load native ad:", error);

      // Log failure
      nativeAdLoader.logAdFailed(item.id, error);

      // Set error state
      setHasError(true);
      setIsLoading(false);

      console.log("Native ad failed to load - skipping position");
    }
  };

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

  // If ad failed to load, skip this position
  if (hasError) {
    return null;
  }

  // Show loading state
  if (isLoading) {
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

  // Render real Google native ad
  if (!nativeAd) {
    return null;
  }

  // Extract ad data from the loaded native ad
  const adHeadline = nativeAd.headline || "Sponsored Content";
  const adBody = nativeAd.body || "";
  const adAdvertiser = nativeAd.advertiser || "Advertiser";
  const adCallToAction = nativeAd.callToAction || "Learn More";
  const adImage = nativeAd.images?.[0]?.url || item.imageUrl;

  return (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={handleAdPress}
      activeOpacity={0.9}
    >
      {/* Ad Image from Google */}
      <FadeInImage
        source={{ uri: adImage }}
        style={styles.backgroundImage}
        contentFit="cover"
        contentPosition="center"
      />

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
        style={styles.adChoicesContainer}
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
          <ThemedText
            type="title"
            style={[
              styles.headline,
              { fontFamily: brandConfig?.theme.fonts.primaryBold },
            ]}
          >
            {adHeadline}
          </ThemedText>

          {/* Ad Body from Google */}
          {adBody && (
            <ThemedText
              numberOfLines={3}
              style={[
                styles.body,
                { fontFamily: brandConfig?.theme.fonts.primaryMedium },
              ]}
            >
              {adBody}
            </ThemedText>
          )}

          {/* Advertiser from Google */}
          <View style={styles.metaContainer}>
            <ThemedText
              style={[
                styles.advertiser,
                { fontFamily: brandConfig?.theme.fonts.primaryMedium },
              ]}
            >
              {adAdvertiser}
            </ThemedText>
          </View>

          {/* Call to Action from Google */}
          <View style={styles.ctaButton}>
            <View style={styles.ctaButtonInner}>
              <ThemedText
                style={[
                  styles.ctaButtonText,
                  { fontFamily: brandConfig?.theme.fonts.primarySemiBold },
                ]}
              >
                {adCallToAction}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  carouselItem: {
    width: screenWidth,
    height: screenHeight,
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
    top: 80,
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
    top: 80,
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
});

export default NativeAdCarouselItem;
