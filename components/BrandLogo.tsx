import { useBrandConfig } from "@/hooks/useBrandConfig";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BrandLogoProps {
  width?: number;
  height?: number;
  style?: any;
}

export function BrandLogo({ width = 120, height = 40, style }: BrandLogoProps) {
  const { brandConfig, loading } = useBrandConfig();

  if (loading || !brandConfig) {
    return <View style={[styles.container, { width, height }, style]} />;
  }

  // For now, display the brand name as text until SVG loading is fixed
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Text
        style={[
          styles.brandText,
          { color: brandConfig.theme.colors.light.primary },
        ]}
      >
        {brandConfig.displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  brandText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
