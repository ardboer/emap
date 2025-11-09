import { BrandLogo } from "@/components/BrandLogo";
import { CarouselProgressIndicator } from "@/components/CarouselProgressIndicator";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ThemedView } from "@/components/ThemedView";
import { UserIcon } from "@/components/UserIcon";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import { carouselStyles } from "../styles/carouselStyles";

interface CarouselLoadingStateProps {
  insets: EdgeInsets;
  searchIconColor: string;
  slideDuration: number;
  showMiniPlayer: boolean;
  backgroundColor: string;
}

/**
 * Loading state component for the carousel
 * Displays skeleton loader with header elements
 */
export function CarouselLoadingState({
  insets,
  searchIconColor,
  slideDuration,
  showMiniPlayer,
  backgroundColor,
}: CarouselLoadingStateProps) {
  return (
    <ThemedView style={[carouselStyles.container, { backgroundColor }]}>
      <CarouselProgressIndicator
        currentIndex={0}
        duration={slideDuration}
        isPlaying={false}
        onProgressComplete={() => {}}
        showMiniPlayer={showMiniPlayer}
      />
      <BrandLogo
        style={[carouselStyles.brandLogo, { top: insets.top + 10 }]}
        width={100}
        height={35}
      />
      <ThemedView
        style={[carouselStyles.topRightIcons, { top: insets.top + 10 }]}
      >
        <TouchableOpacity style={carouselStyles.iconButton} disabled>
          <Ionicons
            name="search"
            size={24}
            color={searchIconColor}
            opacity={0.5}
          />
        </TouchableOpacity>
        <TouchableOpacity style={carouselStyles.iconButton} disabled>
          <UserIcon width={24} height={24} opacity={0.5} />
        </TouchableOpacity>
      </ThemedView>
      <SkeletonLoader variant="carousel" />
    </ThemedView>
  );
}
