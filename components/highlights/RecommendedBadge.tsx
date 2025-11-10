import { ThemedText } from "@/components/ThemedText";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { StyleSheet, View } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";

interface RecommendedBadgeProps {
  isRecommended: boolean;
  insets: EdgeInsets;
}

export const RecommendedBadge: React.FC<RecommendedBadgeProps> = ({
  isRecommended,
  insets,
}) => {
  const { brandConfig } = useBrandConfig();
  const recommendedBadgeBg = useThemeColor({}, "recommendedBadgeBg");

  return (
    <View
      style={[
        styles.recommendedBadge,
        { top: insets.top + 60, backgroundColor: recommendedBadgeBg },
      ]}
    >
      <ThemedText
        style={[
          styles.recommendedBadgeText,
          { fontFamily: brandConfig?.theme.fonts.primarySemiBold },
        ]}
      >
        {isRecommended ? "Recommended for you" : "Editors Pick"}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  recommendedBadge: {
    position: "absolute",
    top: 80,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 20,
  },
  recommendedBadgeText: {
    color: "#011620",
    fontSize: 12,
    fontWeight: "600",
  },
});
