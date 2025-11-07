import { useBrandConfig } from "@/hooks/useBrandConfig";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CarouselProgressIndicatorProps {
  currentIndex: number;
  duration?: number; // Duration in milliseconds
  isPlaying?: boolean;
  onProgressComplete?: () => void;
  showMiniPlayer: boolean; // For positioning above mini player or tab bar
}

export const CarouselProgressIndicator: React.FC<
  CarouselProgressIndicatorProps
> = ({
  currentIndex,
  duration = 5000,
  isPlaying = true,
  onProgressComplete,
  showMiniPlayer,
}) => {
  const { brandConfig } = useBrandConfig();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  // Get colors from brand config
  const progressFillColor =
    brandConfig?.theme.colors.light.progressIndicatorFill || "#10D1F0";
  const progressBackgroundColor =
    brandConfig?.theme.colors.light.progressIndicatorBackground || "#00334C";

  // Calculate bottom position based on mini player visibility
  // Tab bar is ~49px, mini player adds ~44px
  const bottomPosition = showMiniPlayer
    ? 93 + insets.bottom // Above mini player
    : 49 + insets.bottom; // Above tab bar

  useEffect(() => {
    if (isPlaying) {
      // Reset and start progress animation for current slide
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
    } else {
      // Pause progress when not playing
      progress.value = withTiming(progress.value, { duration: 0 });
    }
  }, [currentIndex, isPlaying, duration, onProgressComplete]);

  // Reset progress when slide changes
  useEffect(() => {
    progress.value = 0;
  }, [currentIndex]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View style={[styles.container, { bottom: bottomPosition }]}>
      <View
        style={[
          styles.progressBarContainer,
          { backgroundColor: progressBackgroundColor },
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  progressBarContainer: {
    height: 3,
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: 3,
    borderRadius: 0,
    position: "absolute",
    top: 0,
    left: 0,
  },
});
