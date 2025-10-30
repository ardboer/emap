import { BrandLogo } from "@/components/BrandLogo";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GradientHeaderProps {
  showLogo?: boolean;
  showSearch?: boolean;
  onSearchPress?: () => void;
}

export default function GradientHeader({
  showLogo = true,
  showSearch = true,
  onSearchPress,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  // Get brand-aware colors
  const gradientStart = useThemeColor({}, "newsHeaderGradientStart");
  const gradientEnd = useThemeColor({}, "newsHeaderGradientEnd");
  const searchIconColor = useThemeColor({}, "searchIcon");

  return (
    <LinearGradient
      colors={[gradientStart, gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.5 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        {showLogo && (
          <BrandLogo
            width={100}
            height={32}
            style={styles.logo}
            variant="default"
          />
        )}
        {showSearch && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={24} color={searchIconColor} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  logo: {
    // Logo styling handled by BrandLogo component
  },
  searchButton: {
    padding: 8,
  },
});
