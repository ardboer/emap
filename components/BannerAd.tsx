import { AdDebugData, AdDebugInfo } from "@/components/AdDebugInfo";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { adMobService, AdSizes } from "@/services/admob";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  BannerAdSize,
  BannerAd as GoogleBannerAd,
} from "react-native-google-mobile-ads";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export interface BannerAdProps {
  /**
   * Size of the banner ad
   */
  size?: BannerAdSize;
  /**
   * Custom style for the container
   */
  style?: any;
  /**
   * Whether to show loading indicator
   */
  showLoadingIndicator?: boolean;
  /**
   * Whether to show error messages
   */
  showErrorMessage?: boolean;
  /**
   * Custom error message
   */
  errorMessage?: string;
  /**
   * Callback when ad loads successfully
   */
  onAdLoaded?: () => void;
  /**
   * Callback when ad fails to load
   */
  onAdFailedToLoad?: (error: any) => void;
  /**
   * Callback when ad is clicked
   */
  onAdClicked?: () => void;
}

export function BannerAdComponent({
  size = AdSizes.BANNER,
  style,
  showLoadingIndicator = true,
  showErrorMessage = __DEV__, // Only show errors in development
  errorMessage = "Unable to load advertisement",
  onAdLoaded,
  onAdFailedToLoad,
  onAdClicked,
}: BannerAdProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isNoFillError, setIsNoFillError] = useState(false);
  const [adUnitId, setAdUnitId] = useState<string>("");
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [loadTimeMs, setLoadTimeMs] = useState<number | undefined>(undefined);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const { brandConfig } = useBrandConfig();

  // Load debug setting
  useEffect(() => {
    AsyncStorage.getItem("debug_ads_enabled").then((value) => {
      setDebugEnabled(value === "true");
    });
  }, []);

  useEffect(() => {
    initializeAd();
  }, [brandConfig]);

  const initializeAd = async () => {
    try {
      setLoadStartTime(Date.now());

      // Initialize AdMob service with brand configuration
      await adMobService.initialize({
        useTestAds: true, // Always use test ads for now
        brand: brandConfig?.shortcode === "cn" ? "cn" : "nt",
      });

      // Get the appropriate ad unit ID
      const unitId = adMobService.getBannerAdUnitId();
      setAdUnitId(unitId);

      setIsLoading(true);
      setHasError(false);
      setErrorMsg(undefined);
    } catch (error: any) {
      console.error("Failed to initialize banner ad:", error);
      setHasError(true);
      setIsLoading(false);
      setErrorMsg(error?.message || "Initialization failed");
      onAdFailedToLoad?.(error);
    }
  };

  const handleAdLoaded = () => {
    const loadTime = Date.now() - loadStartTime;
    setLoadTimeMs(loadTime);
    setIsLoading(false);
    setHasError(false);
    setErrorMsg(undefined);
    onAdLoaded?.();
  };

  const handleAdFailedToLoad = (error: any) => {
    const loadTime = Date.now() - loadStartTime;
    setLoadTimeMs(loadTime);

    // Check if this is a "no-fill" error (no ad available)
    const noFill =
      error?.message?.includes("no-fill") ||
      error?.message?.includes("No ad to show") ||
      error?.code === "no-fill";

    // Only log non-no-fill errors as these are actual issues
    if (!noFill) {
      console.error("Banner ad failed to load:", error);
    }

    setIsLoading(false);
    setHasError(true);
    setIsNoFillError(noFill);
    setErrorMsg(error?.message || error?.code || "Unknown error");
    onAdFailedToLoad?.(error);
  };

  const handleAdClicked = () => {
    onAdClicked?.();
  };

  // Prepare debug data (before early return so it's available for debug display)
  const debugData: AdDebugData = {
    adUnitId: adUnitId || "Not initialized",
    adType: "banner",
    requestResult: isLoading ? "loading" : hasError ? "failed" : "success",
    loadTimeMs,
    isTestAd: adMobService.isInitialized()
      ? adMobService.getConfig().useTestAds
      : true,
    errorMessage:
      errorMsg || (isNoFillError ? "No ad available (no-fill)" : undefined),
  };

  // Don't render ad if AdMob is not initialized, no ad unit ID, or no-fill error
  // But still show debug info if enabled
  if (!adMobService.isInitialized() || !adUnitId || isNoFillError) {
    if (debugEnabled) {
      return (
        <ThemedView style={[styles.container, style]}>
          <AdDebugInfo data={debugData} variant="inline" />
        </ThemedView>
      );
    }
    return null;
  }

  return (
    <ThemedView style={[styles.container, style]}>
      {/* Loading indicator - hidden to prevent layout shift */}
      {/* {isLoading && showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={brandConfig?.theme?.colors?.light?.primary || "#007AFF"}
          />
          <ThemedText style={styles.loadingText}>Loading ad...</ThemedText>
        </View>
      )} */}

      {/* Error message */}
      {hasError && showErrorMessage && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        </View>
      )}

      {/* Banner Ad */}
      {!hasError && adUnitId && (
        <GoogleBannerAd
          unitId={adUnitId}
          size={size}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdFailedToLoad}
          onAdOpened={handleAdClicked}
        />
      )}

      {/* Debug Info */}
      {debugEnabled && <AdDebugInfo data={debugData} variant="inline" />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    minHeight: 60, // Minimum height to prevent layout shift
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    opacity: 0.6,
  },
  errorContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.2)",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    textAlign: "center",
    opacity: 0.8,
  },
});

// Export with a more convenient name
export { BannerAdComponent as BannerAd };
export default BannerAdComponent;
