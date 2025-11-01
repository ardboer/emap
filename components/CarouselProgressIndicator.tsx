import { useBrandConfig } from "@/hooks/useBrandConfig";
import { hexToRgba } from "@/utils/colors";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

interface CarouselProgressIndicatorProps {
  totalItems: number;
  currentIndex: number;
  duration?: number; // Duration in milliseconds
  isPlaying?: boolean;
  onProgressComplete?: () => void;
  style?: any;
  wordpressItemCount: number; // Number of WordPress items (only show progress for these)
}

const ProgressBar: React.FC<{
  index: number;
  currentIndex: number;
  width: number;
  duration: number;
  isPlaying: boolean;
  onProgressComplete?: () => void;
  progressFillColor: string;
  progressBackgroundColor: string;
}> = ({
  index,
  currentIndex,
  width,
  duration,
  isPlaying,
  onProgressComplete,
  progressFillColor,
  progressBackgroundColor,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (index === currentIndex && isPlaying) {
      // Start progress animation for current slide with smooth easing
      progress.value = 0;
      const timeoutId = setTimeout(() => {
        progress.value = withTiming(
          1,
          {
            duration,
            easing: Easing.linear, // Linear easing for consistent progress
          },
          (finished) => {
            if (finished && onProgressComplete) {
              runOnJS(onProgressComplete)();
            }
          }
        );
      }, 50);

      return () => clearTimeout(timeoutId);
    } else if (index < currentIndex) {
      // Completed slides should be fully filled
      progress.value = withTiming(1, { duration: 200 });
    } else {
      // Future slides should be empty
      progress.value = withTiming(0, { duration: 200 });
    }
  }, [currentIndex, isPlaying, index, duration, onProgressComplete]);

  const progressStyle = useAnimatedStyle(() => {
    const isActive = index === currentIndex;
    const isPast = index < currentIndex;

    let progressWidth = 0;
    if (isPast) {
      progressWidth = width - 4; // Fully filled for past slides
    } else if (isActive) {
      progressWidth = (width - 4) * progress.value; // Animated for current slide
    }

    return {
      width: progressWidth,
    };
  });

  return (
    <View
      style={[
        styles.progressBarContainer,
        { width: width - 4, backgroundColor: progressBackgroundColor },
      ]}
    >
      <Animated.View
        style={[
          styles.progressBarFill,
          progressStyle,
          { backgroundColor: progressFillColor },
        ]}
      />
    </View>
  );
};

export const CarouselProgressIndicator: React.FC<
  CarouselProgressIndicatorProps
> = ({
  totalItems,
  currentIndex,
  duration = 7000,
  isPlaying = true,
  onProgressComplete,
  style,
  wordpressItemCount,
}) => {
  const { brandConfig } = useBrandConfig();
  const insets = useSafeAreaInsets();
  // Only render progress bars for WordPress articles
  const displayItemCount = wordpressItemCount;
  const indicatorWidth = (screenWidth - 48) / displayItemCount; // 24px padding on each side

  // Only show progress bars if we're viewing a WordPress article
  const shouldShowProgress =
    currentIndex < wordpressItemCount && displayItemCount > 0;

  // Get colors from brand config
  const overlayGradientStart =
    brandConfig?.theme.colors.light.overlayGradientStart || "#011620";
  const progressFillColor =
    brandConfig?.theme.colors.light.progressIndicatorFill || "#10D1F0";
  const progressBackgroundColor =
    brandConfig?.theme.colors.light.progressIndicatorBackground || "#00334C";

  // Create gradient colors using brand config - ensure proper typing for LinearGradient
  const gradientColors: readonly [string, string, ...string[]] = [
    hexToRgba(overlayGradientStart, 0.5),
    hexToRgba(overlayGradientStart, 0.3),
    "transparent",
  ] as const;

  return (
    <View style={[styles.container, style]}>
      {shouldShowProgress ? (
        <LinearGradient
          colors={gradientColors}
          style={styles.gradientBackground}
        >
          <View style={[styles.progressContainer, { top: 10 + insets.top }]}>
            {Array.from({ length: displayItemCount }, (_, index) => (
              <ProgressBar
                key={index}
                index={index}
                currentIndex={currentIndex}
                width={indicatorWidth}
                duration={duration}
                isPlaying={isPlaying && currentIndex < wordpressItemCount}
                progressFillColor={progressFillColor}
                progressBackgroundColor={progressBackgroundColor}
                onProgressComplete={
                  index === currentIndex ? onProgressComplete : undefined
                }
              />
            ))}
          </View>
        </LinearGradient>
      ) : (
        // Keep container but make it transparent for Miso articles
        <View style={styles.gradientBackground} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  gradientBackground: {
    paddingTop: 60, // Safe area + some padding
    paddingHorizontal: 24,
    paddingBottom: 12,
    height: 200,
  },
  progressContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 30,
    left: 24,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    position: "absolute",
    top: 0,
    left: 0,
  },
});
