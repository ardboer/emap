import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { View } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import { carouselStyles } from "../styles/carouselStyles";

interface RecommendedBadgeProps {
  isRecommended: boolean;
  insets: EdgeInsets;
  backgroundColor: string;
  fontFamily?: string;
}

/**
 * Badge component to display "Recommended for you" or "Editors Pick"
 */
export function RecommendedBadge({
  isRecommended,
  insets,
  backgroundColor,
  fontFamily,
}: RecommendedBadgeProps) {
  return (
    <View
      style={[
        carouselStyles.recommendedBadge,
        { top: insets.top + 60, backgroundColor },
      ]}
    >
      <ThemedText
        style={[
          carouselStyles.recommendedBadgeText,
          fontFamily && { fontFamily },
        ]}
      >
        {isRecommended ? "Recommended for you" : "Editors Pick"}
      </ThemedText>
    </View>
  );
}
