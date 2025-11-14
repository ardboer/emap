import { ImageProps } from "expo-image";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, useColorScheme, View } from "react-native";

export interface FadeInImageProps extends ImageProps {
  /**
   * Duration of the fade-in animation in milliseconds
   * @default 300
   */
  fadeDuration?: number;
  /**
   * Custom placeholder color (overrides theme-based color)
   */
  placeholderColor?: string;
  /**
   * Whether to show a placeholder while loading
   * @default true
   */
  showPlaceholder?: boolean;
}

/**
 * FadeInImage - A wrapper around expo-image that adds a smooth fade-in effect
 * when images load, with a theme-aware placeholder.
 *
 * @example
 * ```tsx
 * <FadeInImage
 *   source={{ uri: 'https://example.com/image.jpg' }}
 *   style={styles.image}
 * />
 * ```
 */
function FadeInImageComponent({
  fadeDuration = 300,
  placeholderColor,
  showPlaceholder = true,
  style,
  onLoad,
  ...imageProps
}: FadeInImageProps) {
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLoaded, setIsLoaded] = useState(false);

  // Theme-aware placeholder colors - memoized
  const finalPlaceholderColor = useMemo(() => {
    if (placeholderColor) return placeholderColor;
    return colorScheme === "dark" ? "#2a2a2a" : "#f0f0f0";
  }, [placeholderColor, colorScheme]);

  const handleLoad = useCallback(
    (event: any) => {
      setIsLoaded(true);

      // Trigger fade-in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start();

      // Call original onLoad if provided
      if (onLoad) {
        onLoad(event);
      }
    },
    [fadeAnim, fadeDuration, onLoad]
  );

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder background */}
      {showPlaceholder && !isLoaded && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: finalPlaceholderColor },
          ]}
        />
      )}

      {/* Animated image */}
      {/* <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Image
          {...imageProps}
          style={[StyleSheet.absoluteFill]}
          onLoad={handleLoad}
          // Performance optimizations for expo-image
          cachePolicy="memory-disk"
          priority="normal"
          recyclingKey={
            imageProps.source &&
            typeof imageProps.source === "object" &&
            "uri" in imageProps.source
              ? imageProps.source.uri
              : undefined
          }
        />
      </Animated.View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});

// Memoize component to prevent unnecessary re-renders
// Only re-render if source URI changes
export const FadeInImage = memo(
  FadeInImageComponent,
  (prevProps, nextProps) => {
    // Compare source URIs
    const prevUri =
      prevProps.source &&
      typeof prevProps.source === "object" &&
      "uri" in prevProps.source
        ? prevProps.source.uri
        : null;
    const nextUri =
      nextProps.source &&
      typeof nextProps.source === "object" &&
      "uri" in nextProps.source
        ? nextProps.source.uri
        : null;

    return (
      prevUri === nextUri &&
      prevProps.fadeDuration === nextProps.fadeDuration &&
      prevProps.showPlaceholder === nextProps.showPlaceholder &&
      prevProps.placeholderColor === nextProps.placeholderColor
    );
  }
);
