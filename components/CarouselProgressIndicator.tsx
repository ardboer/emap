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

const { width: screenWidth } = Dimensions.get("window");

interface CarouselProgressIndicatorProps {
  totalItems: number;
  currentIndex: number;
  duration?: number; // Duration in milliseconds
  isPlaying?: boolean;
  onProgressComplete?: () => void;
  style?: any;
}

const ProgressBar: React.FC<{
  index: number;
  currentIndex: number;
  width: number;
  duration: number;
  isPlaying: boolean;
  onProgressComplete?: () => void;
}> = ({
  index,
  currentIndex,
  width,
  duration,
  isPlaying,
  onProgressComplete,
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
    <View style={[styles.progressBarContainer, { width: width - 4 }]}>
      <Animated.View style={[styles.progressBarFill, progressStyle]} />
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
}) => {
  const indicatorWidth = (screenWidth - 48) / totalItems; // 24px padding on each side

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.3)", "transparent"]}
        style={styles.gradientBackground}
      >
        <View style={styles.progressContainer}>
          {Array.from({ length: totalItems }, (_, index) => (
            <ProgressBar
              key={index}
              index={index}
              currentIndex={currentIndex}
              width={indicatorWidth}
              duration={duration}
              isPlaying={isPlaying}
              onProgressComplete={
                index === currentIndex ? onProgressComplete : undefined
              }
            />
          ))}
        </View>
      </LinearGradient>
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
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  progressBarContainer: {
    height: 4, // Slightly thicker for better visibility
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)", // More subtle background
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRadius: 2,
    position: "absolute",
    top: 0,
    left: 0,
  },
});
