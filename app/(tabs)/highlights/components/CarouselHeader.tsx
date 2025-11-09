import { BrandLogo } from "@/components/BrandLogo";
import { ThemedView } from "@/components/ThemedView";
import { UserIcon } from "@/components/UserIcon";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import { carouselStyles } from "../styles/carouselStyles";

interface CarouselHeaderProps {
  insets: EdgeInsets;
  searchIconColor: string;
  onSearchPress: () => void;
  onUserPress: () => void;
}

/**
 * Header component for the carousel screen
 * Displays brand logo, search button, and user settings button
 */
export function CarouselHeader({
  insets,
  searchIconColor,
  onSearchPress,
  onUserPress,
}: CarouselHeaderProps) {
  return (
    <>
      <BrandLogo
        style={[carouselStyles.brandLogo, { top: insets.top + 10 }]}
        width={100}
        height={35}
      />

      <ThemedView
        style={[carouselStyles.topRightIcons, { top: insets.top + 10 }]}
      >
        <TouchableOpacity
          style={carouselStyles.iconButton}
          onPress={onSearchPress}
        >
          <Ionicons name="search" size={24} color={searchIconColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={carouselStyles.iconButton}
          onPress={onUserPress}
        >
          <UserIcon width={24} height={24} />
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}
