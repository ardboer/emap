import { FadeInImage } from "@/components/FadeInImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Article } from "@/types";
import { hexToRgba } from "@/utils/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";
import { carouselStyles } from "../styles/carouselStyles";
import { RecommendedBadge } from "./RecommendedBadge";

interface CarouselItemLandscapeBlurredProps {
  item: Article;
  onPress: () => void;
  insets: EdgeInsets;
  brandConfig: any;
  showMiniPlayer: boolean;
  recommendedBadgeBg: string;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Landscape layout with blurred background
 * Uses blurred version of the image as background
 */
export function CarouselItemLandscapeBlurred({
  item,
  onPress,
  insets,
  brandConfig,
  showMiniPlayer,
  recommendedBadgeBg,
  screenWidth,
  screenHeight,
}: CarouselItemLandscapeBlurredProps) {
  return (
    <TouchableOpacity
      style={[
        carouselStyles.carouselItem,
        { width: screenWidth, height: screenHeight },
      ]}
      onPress={onPress}
      activeOpacity={1}
    >
      {/* Blurred background image */}
      <FadeInImage
        source={{ uri: item.imageUrl }}
        style={carouselStyles.backgroundImageBlurred}
        contentFit="cover"
        blurRadius={50}
      />

      {/* Dark overlay for blurred background */}
      <View style={carouselStyles.darkOverlay} />

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
            ]}
          >
            {item.title}
          </ThemedText>
          {item.leadText && (
            <ThemedText
              numberOfLines={3}
              style={[
                carouselStyles.leadText,
                { fontFamily: brandConfig?.theme.fonts.primaryMedium },
              ]}
            >
              {item.leadText}
            </ThemedText>
          )}
        </ThemedView>
      </LinearGradient>
    </TouchableOpacity>
  );
}
