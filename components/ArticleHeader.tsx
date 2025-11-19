import { useThemeColor } from "@/hooks/useThemeColor";
import { Article } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BookmarkButton from "./BookmarkButton";
import ShareButton from "./ShareButton";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Helper function to convert hex color to RGB values
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 1, g: 22, b: 32 }; // fallback to default dark color
};

interface ArticleHeaderProps {
  article?: Article | null;
  backButtonAnimatedStyle?: any;
  iconColor?: string;
  onBack?: () => void;
  shareUrl?: string;
  shareMessage?: string;
  scrollY?: SharedValue<number>;
  headerHeight?: number;
}

export function ArticleHeader({
  article,
  backButtonAnimatedStyle,
  iconColor = "#FFFFFF",
  onBack,
  shareUrl,
  shareMessage,
  scrollY,
  headerHeight = 300,
}: ArticleHeaderProps) {
  const insets = useSafeAreaInsets();
  const headerGradientColor = useThemeColor({}, "articleHeaderBackground");
  const rgb = hexToRgb(headerGradientColor);

  const handleBack = async () => {
    if (onBack) {
      onBack();
    } else {
      const canGoBack = await router.canGoBack();
      if (canGoBack) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    }
  };

  // iOS: Animate gradient colors based on scroll position
  const animatedProps = useAnimatedProps(() => {
    if (!scrollY) {
      return {
        colors: [
          `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
          `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
          `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`,
        ],
      };
    }

    // Start fading in when user is 80% through the header
    const fadeStart = headerHeight * 0.8;
    const fadeEnd = headerHeight;

    const opacity1 = interpolate(
      scrollY.value,
      [fadeStart, fadeEnd],
      [0.5, 1],
      "clamp"
    );

    const opacity3 = interpolate(
      scrollY.value,
      [fadeStart, fadeEnd],
      [0, 1],
      "clamp"
    );

    return {
      colors: [
        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity1})`,
        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity1})`,
        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity3})`,
      ],
    };
  });

  // Android: Show full background once scrolled past the image
  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { opacity: 0 };
    }

    // Show full background once scrolled past the header
    const opacity = scrollY.value >= headerHeight ? 1 : 0;

    return { opacity };
  });

  return (
    <>
      {/* Linear Gradient Overlay Background - Platform specific implementation */}
      {Platform.OS === "ios" ? (
        <AnimatedLinearGradient
          // @ts-ignore - animatedProps typing issue with expo-linear-gradient
          animatedProps={animatedProps}
          locations={[0, 0.33, 1]}
          style={[styles.gradientOverlay, { height: 40 + insets.top }]}
          pointerEvents="none"
        />
      ) : (
        <Animated.View
          style={[
            styles.gradientOverlay,
            {
              height: 50 + insets.top,
              backgroundColor: headerGradientColor,
            },
            animatedStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {/* Back Button */}
      <Animated.View
        style={[
          styles.backButtonContainer,
          { marginTop: insets.top + (Platform.OS === "android" ? 12 : 0) },
          backButtonAnimatedStyle,
        ]}
      >
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={iconColor} />
        </TouchableOpacity>
      </Animated.View>

      {/* Action Buttons (Share & Bookmark) */}
      <Animated.View
        style={[
          styles.actionButtonsContainer,
          { marginTop: insets.top + (Platform.OS === "android" ? 12 : 0) },
          backButtonAnimatedStyle,
        ]}
      >
        <View style={styles.actionButtons}>
          {article && (
            <>
              <BookmarkButton
                article={article}
                iconColor={iconColor}
                iconSize={28}
              />
              <ShareButton
                title={article.title}
                message={shareMessage || article.subtitle || ""}
                url={shareUrl || `article/${article.id}`}
                iconColor={iconColor}
                iconSize={28}
              />
            </>
          )}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButtonContainer: {
    position: "absolute",
    top: 4,
    left: 16,
    zIndex: 200,
  },
  actionButtonsContainer: {
    position: "absolute",
    top: 4,
    right: 16,
    zIndex: 200,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});
