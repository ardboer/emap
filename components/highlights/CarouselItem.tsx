import { FadeInImage } from "@/components/FadeInImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAudio } from "@/contexts/AudioContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { Article } from "@/types";
import { hexToRgba } from "@/utils/colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";

interface CarouselItemProps {
  item: Article;
  imageColors: { [key: string]: string[] };
  useColorGradient: boolean;
  screenWidth: number;
  screenHeight: number;
  insets: EdgeInsets;
  onPress: (article: Article) => void;
}

export const CarouselItem: React.FC<CarouselItemProps> = ({
  item,
  imageColors,
  useColorGradient,
  screenWidth,
  screenHeight,
  insets,
  onPress,
}) => {
  const { state: audioState } = useAudio();
  const { brandConfig } = useBrandConfig();

  // Calculate responsive title font size based on screen height
  // Using clamp: min 20px, preferred 3.25% of screen height, max 32px
  const titleFontSize = Math.max(20, Math.min(screenHeight * 0.0325, 32));

  // Calculate responsive badge font size based on screen height
  // Using clamp: min 10px, preferred 1.5% of screen height, max 14px
  const badgeFontSize = Math.max(10, Math.min(screenHeight * 0.015, 14));

  const styles = {
    ...staticStyles,
    carouselItem: {
      width: screenWidth,
      height: screenHeight,
      position: "relative" as const,
    },
    title: {
      ...staticStyles.title,
      fontSize: titleFontSize,
    },
    recommendedBadgeText: {
      ...staticStyles.recommendedBadgeText,
      fontSize: badgeFontSize,
    },
  };

  // Debug logging to track landscape detection
  console.log(`🖼️ CarouselItem for "${item.title.substring(0, 30)}...":`, {
    id: item.id,
    isLandscape: item.isLandscape,
    hasImageUrl: !!item.imageUrl,
    source: item.source,
    isRecommended: item.isRecommended,
    willUseLandscapeLayout: item.isLandscape || !item.imageUrl,
  });

  // For landscape images OR when no portrait image is available, use landscape layout
  // This provides a fallback when portrait images are missing
  if (item.isLandscape || !item.imageUrl) {
    console.log(
      `🎨 Using landscape layout for "${item.title.substring(
        0,
        30
      )}..." with useColorGradient=${useColorGradient}`
    );
    if (useColorGradient) {
      // Get extracted colors for this image, or use default gradient
      const extractedColors = imageColors[item.id] || [
        "#1a1a2e",
        "#16213e",
        "#0f3460",
      ];
      console.log(`🎨 Colors for article ${item.id}:`, {
        hasColors: !!imageColors[item.id],
        colors: extractedColors,
        totalColorsInCache: Object.keys(imageColors).length,
      });
      // Ensure we have at least 2 colors for the gradient
      const colors =
        extractedColors.length >= 2
          ? (extractedColors as [string, string, ...string[]])
          : (["#1a1a2e", "#16213e", "#0f3460"] as [
              string,
              string,
              ...string[]
            ]);

      // Color gradient background version
      return (
        <TouchableOpacity
          style={styles.carouselItem}
          onPress={() => onPress(item)}
          activeOpacity={1}
        >
          {/* Color gradient background - using extracted colors from image */}
          <LinearGradient
            colors={colors}
            style={styles.backgroundImageBlurred}
          />
          {/* Main centered image - use contain to maintain aspect ratio */}
          <FadeInImage
            source={{ uri: item.imageUrl }}
            style={styles.centeredImage}
            resizeMode="contain"
            showPlaceholder={false}
          />
          {/* Top gradient for header visibility */}
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.6)", "transparent"] as const}
            style={styles.topGradient}
            pointerEvents="none"
          />
          <LinearGradient
            colors={
              [
                "transparent",
                hexToRgba(
                  brandConfig?.theme.colors.light.overlayGradientEnd ||
                    "#011620",
                  0.85
                ),
              ] as const
            }
            style={styles.overlay}
          >
            <ThemedView
              transparant
              style={[
                styles.contentContainer,
                audioState.showMiniPlayer &&
                  styles.contentContainerWithMiniPlayer,
                { paddingBottom: insets.bottom + 64 },
              ]}
            >
              {item.isRecommended && (
                <View style={styles.recommendedBadge}>
                  <ThemedText style={styles.recommendedBadgeText}>
                    RECOMMENDED FOR YOU
                  </ThemedText>
                </View>
              )}
              <ThemedText
                type="title"
                style={[
                  styles.title,
                  { fontFamily: brandConfig?.theme.fonts.primaryBold },
                ]}
              >
                {item.title}
              </ThemedText>
            </ThemedView>
          </LinearGradient>
        </TouchableOpacity>
      );
    } else {
      // Blurred background version
      return (
        <TouchableOpacity
          style={styles.carouselItem}
          onPress={() => onPress(item)}
          activeOpacity={1}
        >
          {/* Blurred background image */}
          <FadeInImage
            source={{ uri: item.imageUrl }}
            style={styles.backgroundImageBlurred}
            resizeMode="cover"
          />
          {/* Dark overlay for blurred background */}
          <View style={styles.darkOverlay} />
          {/* Main centered image - use contain to maintain aspect ratio */}
          <FadeInImage
            source={{ uri: item.imageUrl }}
            style={styles.centeredImage}
            resizeMode="contain"
            showPlaceholder={false}
          />
          {/* Top gradient for header visibility */}
          <LinearGradient
            colors={["rgba(0, 0, 0, 0.6)", "transparent"] as const}
            style={styles.topGradient}
            pointerEvents="none"
          />
          <LinearGradient
            colors={
              [
                "transparent",
                hexToRgba(
                  brandConfig?.theme.colors.light.overlayGradientEnd ||
                    "#011620",
                  0.85
                ),
              ] as const
            }
            style={styles.overlay}
          >
            <ThemedView
              transparant
              style={[
                styles.contentContainer,
                audioState.showMiniPlayer &&
                  styles.contentContainerWithMiniPlayer,
              ]}
            >
              {item.isRecommended && (
                <View style={styles.recommendedBadge}>
                  <ThemedText style={styles.recommendedBadgeText}>
                    RECOMMENDED FOR YOU
                  </ThemedText>
                </View>
              )}
              <ThemedText
                type="title"
                style={[
                  styles.title,
                  { fontFamily: brandConfig?.theme.fonts.primaryBold },
                ]}
              >
                {item.title}
              </ThemedText>
              {item.leadText && (
                <ThemedText
                  numberOfLines={3}
                  style={[
                    styles.leadText,
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
  }

  // Portrait images use the original layout
  return (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={() => onPress(item)}
      activeOpacity={1}
    >
      <FadeInImage
        source={{ uri: item.imageUrl }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      {/* Top gradient for header visibility */}
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.6)", "transparent"] as const}
        style={styles.topGradient}
        pointerEvents="none"
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
        style={styles.overlay}
      >
        <ThemedView
          transparant
          style={[
            styles.contentContainer,
            audioState.showMiniPlayer && styles.contentContainerWithMiniPlayer,
          ]}
        >
          {item.isRecommended && (
            <View style={styles.recommendedBadge}>
              <ThemedText style={styles.recommendedBadgeText}>
                RECOMMENDED FOR YOU
              </ThemedText>
            </View>
          )}
          <ThemedText
            type="title"
            style={[
              styles.title,
              { fontFamily: brandConfig?.theme.fonts.primaryBold },
            ]}
          >
            {item.title}
          </ThemedText>
          {item.leadText && (
            <ThemedText
              numberOfLines={3}
              style={[
                styles.leadText,
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
};

const staticStyles = StyleSheet.create({
  backgroundImage: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  backgroundImageBlurred: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  centeredImage: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 5,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  contentContainerWithMiniPlayer: {
    paddingBottom: 160,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  recommendedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#CFF8FF",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  recommendedBadgeText: {
    color: "#00334C",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  leadText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "600",
    marginBottom: 16,
  },
});
