import { useBrandConfig } from "@/hooks/useBrandConfig";
import React from "react";
import { StyleSheet, View } from "react-native";

// Import both SVG logos
import CNLogo from "@/brands/cn/logo.svg";
import NTLogo from "@/brands/nt/logo.svg";

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

  // Select the appropriate logo component based on brand
  const LogoComponent = brandConfig.shortcode === "nt" ? NTLogo : CNLogo;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <LogoComponent width={width} height={height} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logo: {
    flex: 1,
  },
});
