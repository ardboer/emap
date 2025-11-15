import { BrandLogo } from "@/components/BrandLogo";
import { UserIcon } from "@/components/UserIcon";
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
  showBackButton?: boolean;
  onBackPress?: () => void;
  showUserIcon?: boolean;
  onUserPress?: () => void;
}

export default function GradientHeader({
  showLogo = true,
  showSearch = true,
  onSearchPress,
  showBackButton = false,
  onBackPress,
  showUserIcon = false,
  onUserPress,
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
        {showBackButton ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={searchIconColor} />
          </TouchableOpacity>
        ) : showLogo ? (
          <BrandLogo
            width={100}
            height={32}
            style={styles.logo}
            variant="default"
          />
        ) : (
          <View />
        )}
        <View style={styles.iconsContainer}>
          {showSearch && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSearchPress}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={24} color={searchIconColor} />
            </TouchableOpacity>
          )}
          {showUserIcon && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onUserPress}
              activeOpacity={0.7}
            >
              <UserIcon width={24} height={24} />
            </TouchableOpacity>
          )}
        </View>
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
  backButton: {
    padding: 8,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  iconButton: {
    padding: 8,
  },
});
