/**
 * AdPlaceholder Component
 *
 * Displays a placeholder while a display ad is loading.
 * Prevents layout shift by reserving space with proper dimensions.
 */

import { useBrandConfig } from "@/hooks/useBrandConfig";
import { AdSizeType } from "@/types/ads";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";

interface AdPlaceholderProps {
  /**
   * Size of the ad being loaded
   */
  size: AdSizeType;
  /**
   * Whether to show loading indicator
   */
  showLoadingIndicator?: boolean;
  /**
   * Custom style
   */
  style?: any;
}

/**
 * Get dimensions for ad size
 */
const getAdDimensions = (
  size: AdSizeType
): { width: number; height: number } => {
  switch (size) {
    case "BANNER":
      return { width: 320, height: 50 };
    case "LARGE_BANNER":
      return { width: 320, height: 100 };
    case "MEDIUM_RECTANGLE":
      return { width: 300, height: 250 };
    case "FULL_BANNER":
      return { width: 468, height: 60 };
    case "LEADERBOARD":
      return { width: 728, height: 90 };
    default:
      return { width: 320, height: 50 };
  }
};

export function AdPlaceholder({
  size,
  showLoadingIndicator = true,
  style,
}: AdPlaceholderProps) {
  const { brandConfig } = useBrandConfig();
  const dimensions = getAdDimensions(size);

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
        },
        style,
      ]}
    >
      {showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={brandConfig?.theme?.colors?.light?.primary || "#007AFF"}
          />
          <ThemedText style={styles.loadingText}>Loading ad...</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    opacity: 0.5,
  },
});

export default AdPlaceholder;
