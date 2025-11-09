import { FadeInImage } from "@/components/FadeInImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Article } from "@/types";
import { hexToRgba } from "@/utils/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { TouchableOpacity } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import { carouselStyles } from "../styles/carouselStyles";
import { RecommendedBadge } from "./RecommendedBadge";

interface CarouselItemLandscapeProps {
  item: Article;
  onPress: () => void;
  insets: EdgeInsets;
  brandConfig: any;
  showMiniPlayer: boolean;
  recommendedBadgeBg: string;
  imageColors: string[];
  screenWidth: number;
  screenHeight: number;
}

/**
 * Landscape layout with color gradient background
 * Uses extracted colors from the image for gradient
 */
export function CarouselItemLandscape({
  item,
  onPress,
  insets,
  brandConfig,
  showMiniPlayer,
  recommendedBadgeBg,
  imageColors,
  screenWidth,
  screenHeight,
}: CarouselItemLandscapeProps) {
  // Ensure we have at least 2 colors for the gradient
  const colors =
    imageColors.length >= 2
      ? (imageColors as [string, string, ...string[]])
      : (["#1a1a2e", "#16213e", "#0f3460"] as [string, string, ...string[]]);

  return (
    <TouchableOpacity
      style={[
        carouselStyles.carouselItem,
        { width: screenWidth, height: screenHeight },
      ]}
      onPress={onPress}
      activeOpacity={1}
    >
      {/* Color gradient background - using extracted colors from image */}
      <LinearGradient
        colors={colors}
        style={carouselStyles.backgroundImageBlurred}
      />

      {/* Main centered image - use contain to maintain aspect ratio */}
      <FadeInImage
        source={{ uri: item.imageUrl }}
        style={carouselStyles.centeredImage}
        contentFit="contain"
        contentPosition="center"
      />

      {/* Top gradient for header visibility */}
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.6)", "transparent"] as const}
        style={carouselStyles.topGradient}
        pointerEvents="none"
      />

      <RecommendedBadge
        isRecommended={item.isRecommended || false}
        insets={insets}
        backgroundColor={recommendedBadgeBg}
        fontFamily={brandConfig?.theme.fonts.primarySemiBold}
      />

      <LinearGradient
        colors={
          [
            "transparent",
            hexToRgba(
              brandConfig?.theme.colors.light.overlayGradientEnd || "#011620",
              0.85
            ),
          ] as const
        }
        style={carouselStyles.overlay}
      >
        <ThemedView
          transparant
          style={[
            carouselStyles.contentContainer,
            showMiniPlayer && carouselStyles.contentContainerWithMiniPlayer,
          ]}
        >
          <ThemedText
            type="title"
            style={[
              carouselStyles.title,
              { fontFamily: brandConfig?.theme.fonts.primaryBold },
              { paddingBottom: 16 },
            ]}
          >
            {item.title}
          </ThemedText>
        </ThemedView>
      </LinearGradient>
    </TouchableOpacity>
  );
}
