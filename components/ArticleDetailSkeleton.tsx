import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

/**
 * ArticleDetailSkeleton - Skeleton loader for article detail content area
 * Shows loading placeholders for author, title, subtitle, lead text, and content
 * while the full article is being fetched.
 */
export function ArticleDetailSkeleton() {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const backgroundColor = useThemeColor({}, "background");

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const shimmerTranslate = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  const skeletonBaseColor =
    backgroundColor === "#FFFFFF"
      ? "rgba(0, 0, 0, 0.08)"
      : "rgba(255, 255, 255, 0.08)";
  const skeletonHighlightColor =
    backgroundColor !== "#FFFFFF"
      ? "rgba(0, 0, 0, 0.04)"
      : "rgba(255, 255, 255, 0.12)";

  return (
    <View style={{ ...styles.container, width: screenWidth - 32 }}>
      {/* Subtitle skeleton (optional, 1 line) */}
      <View
        style={[
          styles.subtitleSkeleton,
          { backgroundColor: skeletonBaseColor },
        ]}
      >
        <Animated.View
          style={[
            styles.shimmer,
            {
              backgroundColor: skeletonHighlightColor,
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </View>

      {/* Lead text skeleton (2-3 lines) */}
      <View style={styles.leadTextContainer}>
        <View
          style={[styles.leadTextLine, { backgroundColor: skeletonBaseColor }]}
        >
          <Animated.View
            style={[
              styles.shimmer,
              {
                backgroundColor: skeletonHighlightColor,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View
          style={[styles.leadTextLine, { backgroundColor: skeletonBaseColor }]}
        >
          <Animated.View
            style={[
              styles.shimmer,
              {
                backgroundColor: skeletonHighlightColor,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.leadTextLine,
            { backgroundColor: skeletonBaseColor, width: "85%" },
          ]}
        >
          <Animated.View
            style={[
              styles.shimmer,
              {
                backgroundColor: skeletonHighlightColor,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
      </View>

      {/* Content paragraphs skeleton */}
      <View style={styles.contentContainer}>
        {/* Paragraph 1 */}
        {[...Array(4)].map((_, i) => (
          <View
            key={`p1-${i}`}
            style={[
              styles.contentLine,
              { backgroundColor: skeletonBaseColor },
              i === 3 && { width: "70%" },
            ]}
          >
            <Animated.View
              style={[
                styles.shimmer,
                {
                  backgroundColor: skeletonHighlightColor,
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </View>
        ))}

        {/* Spacing between paragraphs */}
        <View style={styles.paragraphSpacer} />

        {/* Paragraph 2 */}
        {[...Array(5)].map((_, i) => (
          <View
            key={`p2-${i}`}
            style={[
              styles.contentLine,
              { backgroundColor: skeletonBaseColor },
              i === 4 && { width: "60%" },
            ]}
          >
            <Animated.View
              style={[
                styles.shimmer,
                {
                  backgroundColor: skeletonHighlightColor,
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </View>
        ))}

        {/* Spacing between paragraphs */}
        <View style={styles.paragraphSpacer} />

        {/* Paragraph 3 */}
        {[...Array(3)].map((_, i) => (
          <View
            key={`p3-${i}`}
            style={[
              styles.contentLine,
              { backgroundColor: skeletonBaseColor },
              i === 2 && { width: "80%" },
            ]}
          >
            <Animated.View
              style={[
                styles.shimmer,
                {
                  backgroundColor: skeletonHighlightColor,
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  shimmer: {
    width: "100%",
    height: "100%",
  },
  subtitleSkeleton: {
    height: 20,
    borderRadius: 4,
    marginBottom: 16,
    width: "90%",
    overflow: "hidden",
  },
  leadTextContainer: {
    marginBottom: 24,
  },
  leadTextLine: {
    height: 18,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  contentContainer: {
    marginTop: 8,
  },
  contentLine: {
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
    overflow: "hidden",
  },
  paragraphSpacer: {
    height: 16,
  },
});
