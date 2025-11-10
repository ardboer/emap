import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface SkeletonLoaderProps {
  variant?:
    | "carousel"
    | "list"
    | "magazine"
    | "podcast-horizontal"
    | "podcast-vertical";
  count?: number; // Number of skeleton items to show for list/magazine/podcast variant
  showHero?: boolean; // Whether to show a hero skeleton at the start (for list variant)
}

export function SkeletonLoader({
  variant = "carousel",
  count = 5,
  showHero = true,
}: SkeletonLoaderProps) {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const backgroundColor = useThemeColor({}, "background");
  const skeletonBase = useThemeColor({}, "text");
  const skeletonHighlight = useThemeColor({}, "background");
  const backgroundColorContent = useThemeColor({}, "contentBackground");
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
    backgroundColor != "#FFFFFF"
      ? "rgba(0, 0, 0, 0.04)"
      : "rgba(255, 255, 255, 0.12)";

  if (variant === "carousel") {
    return (
      <View
        style={[
          styles.carouselContainer,
          { backgroundColor: backgroundColorContent },
        ]}
      >
        {/* Image skeleton */}
        <View
          style={[styles.imageSkeleton, { backgroundColor: skeletonBaseColor }]}
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

        {/* Content skeleton at bottom */}
        <View style={styles.contentSkeleton}>
          {/* Category skeleton */}
          <View
            style={[
              styles.categorySkeleton,
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

          {/* Title skeleton - 2 lines */}
          <View
            style={[
              styles.titleSkeleton,
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
          <View
            style={[
              styles.titleSkeleton,
              { backgroundColor: skeletonBaseColor, width: "80%" },
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

          {/* Lead text skeleton */}
          <View
            style={[
              styles.leadTextSkeleton,
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
          <View
            style={[
              styles.leadTextSkeleton,
              { backgroundColor: skeletonBaseColor, width: "90%" },
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

          {/* Meta info skeleton */}
          <View style={styles.metaSkeleton}>
            <View
              style={[styles.metaItem, { backgroundColor: skeletonBaseColor }]}
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
              style={[styles.metaItem, { backgroundColor: skeletonBaseColor }]}
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
        </View>
      </View>
    );
  }

  // List variant for article teasers
  if (variant === "list") {
    return (
      <View
        style={[
          styles.listContainer,
          { backgroundColor: backgroundColorContent },
        ]}
      >
        {/* Hero skeleton (first item) - resembles ArticleTeaserHero */}
        {showHero && (
          <View style={styles.listHeroContainer}>
            <View
              style={[
                styles.listHeroImageSkeleton,
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
            {/* Hero title overlay at bottom */}
            <View style={styles.listHeroContentSkeleton}>
              <View
                style={[
                  styles.listHeroTitleSkeleton,
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
              <View
                style={[
                  styles.listHeroTitleSkeleton,
                  { backgroundColor: skeletonBaseColor, width: "80%" },
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
          </View>
        )}

        {/* Regular list items */}
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.listItemSkeleton}>
            {/* Image skeleton */}
            <View
              style={[
                styles.listImageSkeleton,
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

            {/* Content skeleton */}
            <View style={styles.listContentSkeleton}>
              {/* Category skeleton */}
              <View
                style={[
                  styles.listCategorySkeleton,
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

              {/* Title skeleton - 2 lines */}
              <View
                style={[
                  styles.listTitleSkeleton,
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
              <View
                style={[
                  styles.listTitleSkeleton,
                  { backgroundColor: skeletonBaseColor, width: "70%" },
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

              {/* Meta info skeleton */}
              <View
                style={[
                  styles.listMetaSkeleton,
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
            </View>
          </View>
        ))}
      </View>
    );
  }

  // Magazine grid variant
  if (variant === "magazine") {
    return (
      <View
        style={[
          styles.magazineContainer,
          { backgroundColor: backgroundColorContent },
        ]}
      >
        <View style={styles.magazineGrid}>
          {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.magazineItemSkeleton}>
              {/* Magazine cover skeleton */}
              <View
                style={[
                  styles.magazineCoverSkeleton,
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
              {/* Magazine title skeleton */}
              <View
                style={[
                  styles.magazineTitleSkeleton,
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
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Podcast horizontal variant (for multiple feeds)
  if (variant === "podcast-horizontal") {
    return (
      <View style={styles.podcastHorizontalContainer}>
        {Array.from({ length: count }).map((_, categoryIndex) => (
          <View key={categoryIndex} style={styles.podcastCategory}>
            {/* Category title skeleton */}
            <View
              style={[
                styles.podcastCategoryTitle,
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
            {/* Horizontal scrolling podcast cards */}
            <View style={styles.podcastHorizontalScroll}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.podcastHorizontalCard}>
                  <View
                    style={[
                      styles.podcastHorizontalCover,
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
                  <View
                    style={[
                      styles.podcastHorizontalTitle,
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
                  <View
                    style={[
                      styles.podcastHorizontalMeta,
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
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  // Podcast vertical variant (for single feed)
  if (variant === "podcast-vertical") {
    return (
      <View style={styles.podcastVerticalContainer}>
        {/* Category title skeleton */}
        <View
          style={[
            styles.podcastCategoryTitle,
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
        {/* Vertical list of podcast cards */}
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.podcastVerticalCard}>
            <View
              style={[
                styles.podcastVerticalCover,
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
            <View style={styles.podcastVerticalContent}>
              <View
                style={[
                  styles.podcastVerticalTitle,
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
              <View
                style={[
                  styles.podcastVerticalTitle,
                  { backgroundColor: skeletonBaseColor, width: "70%" },
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
              <View
                style={[
                  styles.podcastVerticalDescription,
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
              <View
                style={[
                  styles.podcastVerticalMeta,
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
            </View>
          </View>
        ))}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  carouselContainer: {
    width: screenWidth,
    height: screenHeight,
    position: "relative",
  },
  imageSkeleton: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
  },
  contentSkeleton: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    paddingTop: 48,
  },
  categorySkeleton: {
    width: 120,
    height: 22,
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  titleSkeleton: {
    width: "100%",
    height: 26,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  leadTextSkeleton: {
    width: "100%",
    height: 22,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  metaSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaItem: {
    width: 80,
    height: 22,
    borderRadius: 4,
    overflow: "hidden",
  },
  // List variant styles
  listContainer: {
    padding: 16,
  },
  listHeroContainer: {
    width: "100%",
    marginBottom: 16,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  listHeroImageSkeleton: {
    width: "100%",
    aspectRatio: 3 / 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  listHeroContentSkeleton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  listHeroTitleSkeleton: {
    width: "100%",
    height: 24,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  listItemSkeleton: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  listImageSkeleton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
  },
  listContentSkeleton: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  listCategorySkeleton: {
    width: 80,
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  listTitleSkeleton: {
    width: "100%",
    height: 20,
    borderRadius: 4,
    marginBottom: 6,
    overflow: "hidden",
  },
  listMetaSkeleton: {
    width: 100,
    height: 14,
    borderRadius: 4,
    overflow: "hidden",
  },
  // Magazine grid variant styles
  magazineContainer: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: "transparent",
  },
  magazineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  magazineItemSkeleton: {
    width: "50%",
    padding: 8,
  },
  magazineCoverSkeleton: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  magazineTitleSkeleton: {
    width: "80%",
    height: 16,
    borderRadius: 4,
    overflow: "hidden",
  },
  // Podcast horizontal variant styles
  podcastHorizontalContainer: {
    padding: 16,
  },
  podcastCategory: {
    marginBottom: 32,
  },
  podcastCategoryTitle: {
    width: 150,
    height: 24,
    borderRadius: 4,
    marginBottom: 16,
    marginLeft: 4,
    overflow: "hidden",
  },
  podcastHorizontalScroll: {
    flexDirection: "row",
  },
  podcastHorizontalCard: {
    width: 160,
    marginRight: 16,
  },
  podcastHorizontalCover: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
  },
  podcastHorizontalTitle: {
    width: "100%",
    height: 18,
    borderRadius: 4,
    marginBottom: 4,
    overflow: "hidden",
  },
  podcastHorizontalMeta: {
    width: 80,
    height: 14,
    borderRadius: 4,
    overflow: "hidden",
  },
  // Podcast vertical variant styles
  podcastVerticalContainer: {
    padding: 16,
  },
  podcastVerticalCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  podcastVerticalCover: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
  },
  podcastVerticalContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  podcastVerticalTitle: {
    width: "100%",
    height: 20,
    borderRadius: 4,
    marginBottom: 6,
    overflow: "hidden",
  },
  podcastVerticalDescription: {
    width: "90%",
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  podcastVerticalMeta: {
    width: 120,
    height: 14,
    borderRadius: 4,
    overflow: "hidden",
  },
});
