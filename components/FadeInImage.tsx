import React, { memo } from "react";
import { ImageStyle, StyleSheet, View, ViewStyle } from "react-native";
import FastImage, { ResizeMode, Source } from "react-native-fast-image";

export interface FadeInImageProps {
  /**
   * Image source - can be a URI string or FastImage Source object
   */
  source: string | Source;
  /**
   * Custom placeholder color
   */
  placeholderColor?: string;
  /**
   * Whether to show a placeholder while loading
   * @default true
   */
  showPlaceholder?: boolean;
  /**
   * Style for the image
   */
  style?: ImageStyle | ViewStyle;
  /**
   * Resize mode for the image
   */
  resizeMode?: ResizeMode;
  /**
   * Callback when image loads
   */
  onLoad?: () => void;
  /**
   * Callback when image fails to load
   */
  onError?: () => void;
}

/**
 * FadeInImage - Optimized image component using react-native-fast-image
 * for better performance with native caching and decoding.
 *
 * @example
 * ```tsx
 * <FadeInImage
 *   source="https://example.com/image.jpg"
 *   style={styles.image}
 * />
 * ```
 */
function FadeInImageComponent({
  source,
  placeholderColor = "#f0f0f0",
  showPlaceholder = true,
  style,
  resizeMode = FastImage.resizeMode.cover,
  onLoad,
  onError,
}: FadeInImageProps) {
  // Convert string source to FastImage Source object
  const imageSource: Source =
    typeof source === "string"
      ? {
          uri: source,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }
      : {
          ...source,
          priority: source.priority || FastImage.priority.normal,
          cache: source.cache || FastImage.cacheControl.immutable,
        };

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder background */}
      {showPlaceholder && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: placeholderColor },
          ]}
        />
      )}

      {/* FastImage - no animation wrapper for maximum performance */}
      <FastImage
        source={imageSource}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        onLoad={onLoad}
        onError={onError}
      />
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
      typeof prevProps.source === "string"
        ? prevProps.source
        : prevProps.source.uri;
    const nextUri =
      typeof nextProps.source === "string"
        ? nextProps.source
        : nextProps.source.uri;

    return (
      prevUri === nextUri &&
      prevProps.showPlaceholder === nextProps.showPlaceholder &&
      prevProps.placeholderColor === nextProps.placeholderColor
    );
  }
);
