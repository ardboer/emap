import { NativeAdCarouselItem } from "@/components/NativeAdCarouselItem";
import { analyticsService } from "@/services/analytics";
import { Article } from "@/types";
import React from "react";
import { EdgeInsets } from "react-native-safe-area-context";
import { CarouselItemLandscape } from "./CarouselItemLandscape";
import { CarouselItemLandscapeBlurred } from "./CarouselItemLandscapeBlurred";
import { CarouselItemPortrait } from "./CarouselItemPortrait";

interface CarouselItemProps {
  item: Article;
  index: number;
  onPress: (article: Article) => void;
  insets: EdgeInsets;
  brandConfig: any;
  showMiniPlayer: boolean;
  recommendedBadgeBg: string;
  imageColors: { [key: string]: string[] };
  useColorGradient: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Main carousel item component
 * Decides which layout to render based on article properties
 */
export function CarouselItem({
  item,
  index,
  onPress,
  insets,
  brandConfig,
  showMiniPlayer,
  recommendedBadgeBg,
  imageColors,
  useColorGradient,
  screenWidth,
  screenHeight,
}: CarouselItemProps) {
  // Handle native ad items
  if (item.isNativeAd) {
    return (
      <NativeAdCarouselItem
        item={item}
        position={index}
        shouldLoad={true}
        onAdClicked={() => {
          analyticsService.logEvent("native_ad_click", {
            position: index,
            ad_id: item.id,
          });
        }}
        onLoadComplete={(success) => {
          if (!success) {
            console.warn(`Native ad at position ${index} failed to load`);
          }
        }}
        insets={insets}
        showingProgress={false}
      />
    );
  }

  const handlePress = () => onPress(item);

  // For landscape images OR when no portrait image is available, use landscape layout
  if (item.isLandscape || !item.imageUrl) {
    const colors = imageColors[item.id] || ["#1a1a2e", "#16213e", "#0f3460"];

    if (useColorGradient) {
      // Color gradient background version
      return (
        <CarouselItemLandscape
          item={item}
          onPress={handlePress}
          insets={insets}
          brandConfig={brandConfig}
          showMiniPlayer={showMiniPlayer}
          recommendedBadgeBg={recommendedBadgeBg}
          imageColors={colors}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
        />
      );
    } else {
      // Blurred background version
      return (
        <CarouselItemLandscapeBlurred
          item={item}
          onPress={handlePress}
          insets={insets}
          brandConfig={brandConfig}
          showMiniPlayer={showMiniPlayer}
          recommendedBadgeBg={recommendedBadgeBg}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
        />
      );
    }
  }

  // Portrait images use the portrait layout
  return (
    <CarouselItemPortrait
      item={item}
      onPress={handlePress}
      insets={insets}
      brandConfig={brandConfig}
      showMiniPlayer={showMiniPlayer}
      recommendedBadgeBg={recommendedBadgeBg}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    />
  );
}
