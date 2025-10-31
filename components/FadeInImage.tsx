import { Image, ImageProps } from "expo-image";
import React, { useRef, useState } from "react";
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
export function FadeInImage({
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

  // Theme-aware placeholder colors
  const defaultPlaceholderColor =
    colorScheme === "dark" ? "#2a2a2a" : "#f0f0f0";
  const finalPlaceholderColor = placeholderColor || defaultPlaceholderColor;

  const handleLoad = (event: any) => {
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
  };

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
      <Animated.View
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
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
