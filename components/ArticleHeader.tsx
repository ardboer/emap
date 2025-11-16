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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BookmarkButton from "./BookmarkButton";
import ShareButton from "./ShareButton";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Animate gradient colors based on scroll position
  const animatedProps = useAnimatedProps(() => {
    if (!scrollY) {
      return {
        colors: [
          "rgba(1, 22, 32, 1)",
          "rgba(1, 22, 32, 1)",
          "rgba(1, 22, 32, 0)",
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
        `rgba(1, 22, 32, ${opacity1})`,
        `rgba(1, 22, 32, ${opacity1})`,
        `rgba(1, 22, 32, ${opacity3})`,
      ],
    };
  });

  return (
    <>
      {/* Linear Gradient Overlay Background with animated colors */}
      <AnimatedLinearGradient
        // @ts-ignore - animatedProps typing issue with expo-linear-gradient
        animatedProps={animatedProps}
        locations={[0, 0.33, 1]}
        style={[styles.gradientOverlay, { height: 50 + insets.top }]}
        pointerEvents="none"
      />

      {/* Back Button */}
      <Animated.View
        style={[
          styles.backButtonContainer,
          { marginTop: insets.top + (Platform.OS === "android" ? 12 : 0) },
          backButtonAnimatedStyle,
        ]}
      >
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={32} color={iconColor} />
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
                iconSize={32}
              />
              <ShareButton
                title={article.title}
                message={shareMessage || article.subtitle || ""}
                url={shareUrl || `article/${article.id}`}
                iconColor={iconColor}
                iconSize={32}
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
    top: 0,
    left: 16,
    zIndex: 200,
  },
  actionButtonsContainer: {
    position: "absolute",
    top: 0,
    right: 16,
    zIndex: 200,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});
