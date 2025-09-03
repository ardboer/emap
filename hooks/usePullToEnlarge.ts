import { Gesture } from "react-native-gesture-handler";
import {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface UsePullToEnlargeProps {
  maxScale?: number;
  springConfig?: {
    damping: number;
    stiffness: number;
  };
  scrollY?: any;
}

export const usePullToEnlarge = ({
  maxScale = 1.3,
  springConfig = { damping: 15, stiffness: 150 },
  scrollY,
}: UsePullToEnlargeProps = {}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      isGestureActive.value = true;
      startY.value = event.y;
    })
    .onUpdate((event) => {
      // Only respond to downward pulls when at the top of the scroll
      const isAtTop = scrollY ? scrollY.value <= 0 : true;
      const isPullingDown = event.translationY > 0;

      if (isAtTop && isPullingDown) {
        const pullDistance = Math.min(event.translationY, 200);
        const progress = pullDistance / 200;

        // Use interpolation for smoother scaling
        scale.value = interpolate(progress, [0, 1], [1, maxScale], "clamp");

        // Add slight vertical translation for more natural feel
        translateY.value = pullDistance * 0.2;
      }
    })
    .onEnd(() => {
      isGestureActive.value = false;

      // Spring back to original state
      scale.value = withSpring(1, springConfig);
      translateY.value = withSpring(0, springConfig);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    };
  });

  const resetAnimation = () => {
    scale.value = withSpring(1, springConfig);
    translateY.value = withSpring(0, springConfig);
  };

  return {
    panGesture,
    animatedStyle,
    resetAnimation,
    isGestureActive,
  };
};
