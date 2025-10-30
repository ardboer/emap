import { BrandLogo } from "@/components/BrandLogo";
import { CarouselProgressIndicator } from "@/components/CarouselProgressIndicator";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAudio } from "@/contexts/AudioContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import { fetchFeaturedArticles } from "@/services/api";
import { Article } from "@/types";
import { hexToRgba } from "@/utils/colors";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { getColors } from "react-native-image-colors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Configurable slide duration (in milliseconds)
const SLIDE_DURATION = 5000; // 7 seconds

export default function HighlightedScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [useColorGradient, setUseColorGradient] = useState(false);
  const [imageColors, setImageColors] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [isCarouselVisible, setIsCarouselVisible] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { state: audioState } = useAudio();
  const { brandConfig } = useBrandConfig();
  const backgroundColor = useThemeColor({}, "background");
  const contentBackground = useThemeColor({}, "contentBackground");

  // Analytics tracking state
  const [carouselStartTime, setCarouselStartTime] = useState<number | null>(
    null
  );
  const [articleViewStartTime, setArticleViewStartTime] = useState<
    number | null
  >(null);
  const [viewedArticles, setViewedArticles] = useState<Set<string>>(new Set());
  const [maxIndexReached, setMaxIndexReached] = useState(0);
  const [indexesViewed, setIndexesViewed] = useState<Set<number>>(new Set([0]));
  const [scrollProgression, setScrollProgression] = useState<number[]>([0]);
  const [scrollInteractions, setScrollInteractions] = useState(0);
  const [scrollVelocityData, setScrollVelocityData] = useState<
    {
      from: number;
      to: number;
      duration: number;
      timestamp: number;
    }[]
  >([]);

  const previousIndexRef = useRef(0);
  const indexChangeTimeRef = useRef<number>(Date.now());

  const handleArticlePress = (article: Article) => {
    const dwellTime = articleViewStartTime
      ? Date.now() - articleViewStartTime
      : 0;

    analyticsService.logEvent("carousel_article_click", {
      article_id: article.id,
      article_title: article.title,
      article_category: article.category,
      position: currentIndex,
      dwell_time_before_click_ms: dwellTime,
      dwell_time_before_click_seconds: Math.round(dwellTime / 1000),
      total_articles: articles.length,
      articles_viewed_before_click: viewedArticles.size,
      max_index_reached: maxIndexReached,
      scroll_depth_percentage: Math.round(
        ((maxIndexReached + 1) / articles.length) * 100
      ),
      click_depth_percentage: Math.round(
        ((currentIndex + 1) / articles.length) * 100
      ),
      clicked_before_completion: currentIndex < articles.length - 1,
      articles_remaining: articles.length - currentIndex - 1,
    });

    router.push(`/article/${article.id}`);
  };

  const extractImageColors = async (imageUrl: string, articleId: string) => {
    try {
      const result = await getColors(imageUrl, {
        fallback: "#1a1a2e",
        cache: true,
        key: articleId,
      });

      if (result.platform === "android") {
        return [result.dominant, result.vibrant, result.darkVibrant].filter(
          Boolean
        );
      } else if (result.platform === "ios") {
        return [result.secondary, result.secondary, result.secondary].filter(
          Boolean
        );
      }
      return ["#1a1a2e", "#16213e", "#0f3460"];
    } catch (error) {
      console.error("Error extracting colors:", error);
      return ["#1a1a2e", "#16213e", "#0f3460"];
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedArticles = await fetchFeaturedArticles();
      setArticles(fetchedArticles);

      // Load color gradient setting
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const colorGradientSetting = await AsyncStorage.getItem(
        "debug_use_color_gradient"
      );
      setUseColorGradient(colorGradientSetting === "true");

      // Extract colors from landscape images
      const colors: { [key: string]: string[] } = {};
      for (const article of fetchedArticles) {
        if (article.isLandscape) {
          colors[article.id] = await extractImageColors(
            article.imageUrl,
            article.id
          );
        }
      }
      setImageColors(colors);
    } catch (err) {
      setError("Failed to load articles");
      console.error("Error loading articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const goToNextSlide = () => {
    const nextIndex = (currentIndex + 1) % articles.length;
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  const handleProgressComplete = () => {
    if (!isUserInteracting && isCarouselVisible) {
      analyticsService.logEvent("carousel_auto_advance", {
        from_position: currentIndex,
        to_position: (currentIndex + 1) % articles.length,
        total_articles: articles.length,
        max_index_reached: maxIndexReached,
      });
      goToNextSlide();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);

    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleScrollBeginDrag = () => {
    setIsUserInteracting(true);
    setIsPlaying(false);
    setScrollInteractions((prev) => prev + 1);

    analyticsService.logEvent("carousel_manual_scroll_start", {
      current_index: currentIndex,
      max_index_reached: maxIndexReached,
      scroll_depth_percentage: Math.round(
        ((maxIndexReached + 1) / articles.length) * 100
      ),
      total_articles: articles.length,
    });
  };

  const handleScrollEndDrag = () => {
    setIsUserInteracting(false);

    analyticsService.logEvent("carousel_manual_scroll_end", {
      current_index: currentIndex,
      max_index_reached: maxIndexReached,
      scroll_depth_percentage: Math.round(
        ((maxIndexReached + 1) / articles.length) * 100
      ),
    });

    // Resume playing after a short delay, but only if carousel is visible
    setTimeout(() => {
      if (isCarouselVisible) {
        setIsPlaying(true);
      }
    }, 500);
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(index);

    // Ensure we resume playing after manual scroll, but only if carousel is visible
    if (!isUserInteracting && isCarouselVisible) {
      setIsPlaying(true);
    }
  };

  // Load articles on component mount
  useEffect(() => {
    loadArticles();
  }, []);

  // Track carousel session start/end
  useEffect(() => {
    if (articles.length === 0) return;

    const startTime = Date.now();
    setCarouselStartTime(startTime);
    setMaxIndexReached(0);
    setIndexesViewed(new Set([0]));
    setScrollProgression([0]);
    setViewedArticles(new Set());
    setScrollInteractions(0);
    setScrollVelocityData([]);

    analyticsService.logEvent("carousel_session_start", {
      total_articles: articles.length,
      first_article_id: articles[0]?.id,
      first_article_title: articles[0]?.title,
      session_start_time: new Date().toISOString(),
    });

    return () => {
      // Track carousel exit with comprehensive scroll depth data
      if (carouselStartTime) {
        const sessionDuration = Date.now() - carouselStartTime;
        const scrollDepthPercentage =
          ((maxIndexReached + 1) / articles.length) * 100;
        const uniqueIndexesViewed = indexesViewed.size;
        const completionRate = (uniqueIndexesViewed / articles.length) * 100;
        const reachedEnd = maxIndexReached === articles.length - 1;

        const velocityAnalysis =
          analyticsService.analyzeScrollVelocity(scrollVelocityData);

        analyticsService.logEvent("carousel_session_end", {
          // Session metrics
          session_duration_ms: sessionDuration,
          session_duration_seconds: Math.round(sessionDuration / 1000),

          // Scroll depth metrics
          max_index_reached: maxIndexReached,
          scroll_depth_percentage: Math.round(scrollDepthPercentage),
          unique_indexes_viewed: uniqueIndexesViewed,
          completion_rate: Math.round(completionRate),
          reached_end: reachedEnd,

          // Progression data
          scroll_progression: JSON.stringify(scrollProgression),
          indexes_viewed: JSON.stringify(
            Array.from(indexesViewed).sort((a, b) => a - b)
          ),

          // Content metrics
          total_articles: articles.length,
          articles_viewed_ids: JSON.stringify(
            Array.from(indexesViewed)
              .map((idx) => articles[idx]?.id)
              .filter(Boolean)
          ),

          // Interaction metrics
          scroll_interactions: scrollInteractions,
          avg_time_per_article:
            uniqueIndexesViewed > 0
              ? Math.round(sessionDuration / uniqueIndexesViewed)
              : 0,

          // Velocity metrics
          ...(velocityAnalysis || {}),
        });

        // Log drop-off point if user didn't complete
        if (!reachedEnd) {
          analyticsService.logEvent("carousel_drop_off", {
            drop_off_index: maxIndexReached,
            drop_off_percentage: Math.round(scrollDepthPercentage),
            articles_remaining: articles.length - maxIndexReached - 1,
            time_before_drop_off_ms: sessionDuration,
            last_article_id: articles[maxIndexReached]?.id,
            last_article_title: articles[maxIndexReached]?.title,
          });
        }
      }
    };
  }, [articles]);

  // Track article view changes with scroll depth analysis
  useEffect(() => {
    if (articles.length === 0) return;

    const currentArticle = articles[currentIndex];
    if (!currentArticle) return;

    // Calculate scroll direction
    const direction =
      currentIndex > previousIndexRef.current
        ? "forward"
        : currentIndex < previousIndexRef.current
        ? "backward"
        : null;

    if (direction) {
      // Track scroll velocity
      const now = Date.now();
      const transitionDuration = now - indexChangeTimeRef.current;

      setScrollVelocityData((prev) => [
        ...prev,
        {
          from: previousIndexRef.current,
          to: currentIndex,
          duration: transitionDuration,
          timestamp: now,
        },
      ]);

      indexChangeTimeRef.current = now;
    }

    // Log previous article dwell time
    if (articleViewStartTime && previousIndexRef.current !== currentIndex) {
      const previousArticle = articles[previousIndexRef.current];
      if (previousArticle) {
        const dwellTime = Date.now() - articleViewStartTime;

        analyticsService.logEvent("carousel_article_dwell", {
          article_id: previousArticle.id,
          article_title: previousArticle.title,
          article_category: previousArticle.category,
          dwell_time_ms: dwellTime,
          dwell_time_seconds: Math.round(dwellTime / 1000),
          position: previousIndexRef.current,
          was_auto_play: !isUserInteracting,
        });
      }
    }

    // Update max index reached (only for forward progression)
    if (currentIndex > maxIndexReached) {
      setMaxIndexReached(currentIndex);

      // Log milestone achievements
      const scrollDepthPercentage =
        ((currentIndex + 1) / articles.length) * 100;
      const timeToMilestone = carouselStartTime
        ? Date.now() - carouselStartTime
        : 0;

      if (scrollDepthPercentage >= 25 && scrollDepthPercentage < 50) {
        analyticsService.logEvent("carousel_milestone_25", {
          index: currentIndex,
          article_id: currentArticle.id,
          time_to_milestone_ms: timeToMilestone,
        });
      } else if (scrollDepthPercentage >= 50 && scrollDepthPercentage < 75) {
        analyticsService.logEvent("carousel_milestone_50", {
          index: currentIndex,
          article_id: currentArticle.id,
          time_to_milestone_ms: timeToMilestone,
        });
      } else if (scrollDepthPercentage >= 75 && scrollDepthPercentage < 100) {
        analyticsService.logEvent("carousel_milestone_75", {
          index: currentIndex,
          article_id: currentArticle.id,
          time_to_milestone_ms: timeToMilestone,
        });
      } else if (currentIndex === articles.length - 1) {
        analyticsService.logEvent("carousel_milestone_100", {
          index: currentIndex,
          article_id: currentArticle.id,
          time_to_milestone_ms: timeToMilestone,
          total_time_seconds: Math.round(timeToMilestone / 1000),
        });
      }
    }

    // Track all indexes viewed (including backward scrolling)
    setIndexesViewed((prev) => new Set(prev).add(currentIndex));
    setScrollProgression((prev) => [...prev, currentIndex]);
    setViewedArticles((prev) => new Set(prev).add(currentArticle.id));

    // Start tracking new article view time
    setArticleViewStartTime(Date.now());

    // Log detailed article view with scroll context
    analyticsService.logEvent("carousel_article_view", {
      // Article info
      article_id: currentArticle.id,
      article_title: currentArticle.title,
      article_category: currentArticle.category,

      // Position info
      position: currentIndex,
      total_articles: articles.length,
      position_percentage: Math.round(
        ((currentIndex + 1) / articles.length) * 100
      ),

      // Scroll depth info
      is_new_max: currentIndex > maxIndexReached,
      max_index_so_far: Math.max(maxIndexReached, currentIndex),
      scroll_depth_percentage: Math.round(
        ((Math.max(maxIndexReached, currentIndex) + 1) / articles.length) * 100
      ),

      // Scroll behavior
      scroll_direction: direction,
      is_backward_scroll: direction === "backward",
      is_auto_play: !isUserInteracting,

      // Session context
      unique_indexes_viewed: indexesViewed.size + 1,
      session_duration_ms: carouselStartTime
        ? Date.now() - carouselStartTime
        : 0,
    });

    // Track backward scrolling specifically
    if (direction === "backward") {
      analyticsService.logEvent("carousel_backward_scroll", {
        from_index: previousIndexRef.current,
        to_index: currentIndex,
        scroll_distance: previousIndexRef.current - currentIndex,
        max_index_reached: maxIndexReached,
        article_id: currentArticle.id,
      });
    }

    previousIndexRef.current = currentIndex;
  }, [currentIndex, articles]);

  // Log screen view when carousel is focused and handle visibility
  useFocusEffect(
    useCallback(() => {
      analyticsService.logScreenView("Highlights", "HighlightedScreen");
      setIsCarouselVisible(true);
      if (!isUserInteracting) {
        setIsPlaying(true);
      }

      return () => {
        // Pause carousel when screen loses focus
        setIsCarouselVisible(false);
        setIsPlaying(false);
      };
    }, [isUserInteracting])
  );

  // Handle focus/blur events to pause/resume when screen is not active
  useEffect(() => {
    return () => {
      setIsPlaying(false);
    };
  }, []);
  const styles = {
    ...staticStyles,
    container: {
      flex: 1,
      backgroundColor: contentBackground,
    },
  };
  const renderCarouselItem = ({ item }: { item: Article }) => {
    // For landscape images, choose between blurred background or color gradient
    if (item.isLandscape) {
      if (useColorGradient) {
        // Get extracted colors for this image, or use default gradient
        const extractedColors = imageColors[item.id] || [
          "#1a1a2e",
          "#16213e",
          "#0f3460",
        ];
        // Ensure we have at least 2 colors for the gradient
        const colors =
          extractedColors.length >= 2
            ? (extractedColors as [string, string, ...string[]])
            : (["#1a1a2e", "#16213e", "#0f3460"] as [
                string,
                string,
                ...string[]
              ]);

        // Color gradient background version
        return (
          <TouchableOpacity
            style={styles.carouselItem}
            onPress={() => handleArticlePress(item)}
            activeOpacity={1}
          >
            {/* Color gradient background - using extracted colors from image */}
            <LinearGradient
              colors={colors}
              style={styles.backgroundImageBlurred}
            />
            {/* Main centered image */}
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.centeredImage}
              contentFit="contain"
              contentPosition="center"
            />
            <LinearGradient
              colors={
                [
                  "transparent",
                  hexToRgba(
                    brandConfig?.theme.colors.light.overlayGradientEnd ||
                      "#011620",
                    0.7
                  ),
                ] as const
              }
              style={styles.overlay}
            >
              <ThemedView
                transparant
                style={[
                  styles.contentContainer,
                  audioState.showMiniPlayer &&
                    styles.contentContainerWithMiniPlayer,
                ]}
              >
                <ThemedText
                  type="title"
                  style={[
                    styles.title,
                    { fontFamily: brandConfig?.theme.fonts.primaryBold },
                  ]}
                >
                  {item.title}
                </ThemedText>
                <ThemedView transparant style={styles.metaContainer}>
                  <ThemedText
                    style={[
                      styles.category,
                      { fontFamily: brandConfig?.theme.fonts.primarySemiBold },
                    ]}
                  >
                    {item.category}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </LinearGradient>
          </TouchableOpacity>
        );
      } else {
        // Blurred background version
        return (
          <TouchableOpacity
            style={styles.carouselItem}
            onPress={() => handleArticlePress(item)}
            activeOpacity={1}
          >
            {/* Blurred background image */}
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.backgroundImageBlurred}
              contentFit="cover"
              blurRadius={50}
            />
            {/* Dark overlay for blurred background */}
            <View style={styles.darkOverlay} />
            {/* Main centered image */}
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.centeredImage}
              contentFit="contain"
              contentPosition="center"
            />
            <LinearGradient
              colors={
                [
                  "transparent",
                  hexToRgba(
                    brandConfig?.theme.colors.light.overlayGradientEnd ||
                      "#011620",
                    0.7
                  ),
                ] as const
              }
              style={styles.overlay}
            >
              <ThemedView
                transparant
                style={[
                  styles.contentContainer,
                  audioState.showMiniPlayer &&
                    styles.contentContainerWithMiniPlayer,
                ]}
              >
                <ThemedText
                  type="title"
                  style={[
                    styles.title,
                    { fontFamily: brandConfig?.theme.fonts.primaryBold },
                  ]}
                >
                  {item.title}
                </ThemedText>
                {item.leadText && (
                  <ThemedText
                    numberOfLines={3}
                    style={[
                      styles.leadText,
                      { fontFamily: brandConfig?.theme.fonts.primaryMedium },
                    ]}
                  >
                    {item.leadText}
                  </ThemedText>
                )}
              </ThemedView>
            </LinearGradient>
          </TouchableOpacity>
        );
      }
    }

    // Portrait images use the original layout
    return (
      <TouchableOpacity
        style={styles.carouselItem}
        onPress={() => handleArticlePress(item)}
        activeOpacity={1}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.backgroundImage}
          contentFit="cover"
          contentPosition="center"
        />
        <LinearGradient
          colors={
            [
              "transparent",
              hexToRgba(
                brandConfig?.theme.colors.light.overlayGradientEnd || "#011620",
                0.7
              ),
            ] as const
          }
          style={styles.overlay}
        >
          <ThemedView
            transparant
            style={[
              styles.contentContainer,
              audioState.showMiniPlayer &&
                styles.contentContainerWithMiniPlayer,
            ]}
          >
            <ThemedText
              type="title"
              style={[
                styles.title,
                { fontFamily: brandConfig?.theme.fonts.primaryBold },
              ]}
            >
              {item.title}
            </ThemedText>
            {item.leadText && (
              <ThemedText
                numberOfLines={3}
                style={[
                  styles.leadText,
                  { fontFamily: brandConfig?.theme.fonts.primaryMedium },
                ]}
              >
                {item.leadText}
              </ThemedText>
            )}
          </ThemedView>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading articles...</ThemedText>
      </ThemedView>
    );
  }

  if (error || articles.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>
          {error || "No articles available"}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadArticles}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CarouselProgressIndicator
        totalItems={articles.length}
        currentIndex={currentIndex}
        duration={SLIDE_DURATION}
        isPlaying={isPlaying && isCarouselVisible}
        onProgressComplete={handleProgressComplete}
      />
      <BrandLogo style={styles.brandLogo} width={100} height={35} />

      {/* User Settings Button */}
      <TouchableOpacity
        style={styles.userButton}
        onPress={() => setSettingsDrawerVisible(true)}
      >
        <Image
          source={require("@/assets/images/user-icon.png")}
          style={{ width: 24, height: 24 }}
          contentFit="contain"
        />
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={articles}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={screenWidth}
        decelerationRate="fast"
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      {/* Settings Drawer */}
      {React.createElement(
        require("@/components/SettingsDrawer").SettingsDrawer,
        {
          visible: settingsDrawerVisible,
          onClose: () => setSettingsDrawerVisible(false),
        }
      )}
    </ThemedView>
  );
}

const staticStyles = StyleSheet.create({
  brandLogo: {
    position: "absolute",
    top: 80,
    left: 12,
    zIndex: 10,
    // backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    padding: 8,
  },
  carouselItem: {
    width: screenWidth,
    height: screenHeight, // Account for tab bar
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  backgroundImageBlurred: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  centeredImage: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 100, // Reduced to match Figma spacing
  },
  contentContainerWithMiniPlayer: {
    paddingBottom: 160, // Adjusted for mini player
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 0,
  },
  leadText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  timestamp: {
    color: "white",
    fontSize: 14,
    opacity: 0.7,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  userButton: {
    position: "absolute",
    top: 80,
    right: 16,
    zIndex: 10,
    // backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  userIcon: {
    fontSize: 20,
    color: "white",
  },
});
