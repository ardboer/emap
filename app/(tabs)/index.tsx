import { BrandLogo } from "@/components/BrandLogo";
import { CarouselProgressIndicator } from "@/components/CarouselProgressIndicator";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAudio } from "@/contexts/AudioContext";
import { analyticsService } from "@/services/analytics";
import { fetchFeaturedArticles } from "@/services/api";
import { Article } from "@/types";
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
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Configurable slide duration (in milliseconds)
const SLIDE_DURATION = 7000; // 7 seconds

export default function HighlightedScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { state: audioState } = useAudio();

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

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedArticles = await fetchFeaturedArticles();
      setArticles(fetchedArticles);
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
    if (!isUserInteracting) {
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

    // Resume playing after a short delay
    setTimeout(() => {
      setIsPlaying(true);
    }, 500);
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(index);

    // Ensure we resume playing after manual scroll
    if (!isUserInteracting) {
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

  // Log screen view when carousel is focused
  useFocusEffect(
    useCallback(() => {
      analyticsService.logScreenView("Highlights", "HighlightedScreen");
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  // Handle focus/blur events to pause/resume when screen is not active
  useEffect(() => {
    return () => {
      setIsPlaying(false);
    };
  }, []);

  const renderCarouselItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={() => handleArticlePress(item)}
      activeOpacity={1}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <LinearGradient
        colors={[
          "transparent",
          "rgba(0,0.4,0.6,0.8)",
          "rgba(0,0.4,0.6,0.8)",
          "rgba(0,0.4,0.6,0.8)",
        ]}
        style={styles.overlay}
      >
        <ThemedView
          transparant
          style={[
            styles.contentContainer,
            audioState.showMiniPlayer && styles.contentContainerWithMiniPlayer,
          ]}
        >
          <ThemedText type="title" style={styles.title}>
            {item.title}
          </ThemedText>
          {/* {item.subtitle && (
            <ThemedText type="subtitle" style={styles.subtitle}>
              {item.subtitle}
            </ThemedText>
          )}
          <ThemedText style={styles.leadText}>{item.leadText}</ThemedText> */}
          <ThemedView transparant style={styles.metaContainer}>
            <ThemedText style={styles.category}>{item.category}</ThemedText>
            {/* <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText> */}
          </ThemedView>
        </ThemedView>
      </LinearGradient>
    </TouchableOpacity>
  );

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
        isPlaying={isPlaying}
        onProgressComplete={handleProgressComplete}
      />
      <BrandLogo style={styles.brandLogo} width={100} height={35} />

      {/* User Settings Button */}
      <TouchableOpacity
        style={styles.userButton}
        onPress={() => setSettingsDrawerVisible(true)}
      >
        {React.createElement(require("@/components/ui/IconSymbol").IconSymbol, {
          name: "person.fill",
          size: 24,
          color: "white",
        })}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
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
    // backgroundColor: "green",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 120,
  },
  contentContainerWithMiniPlayer: {
    paddingBottom: 180, // 40 (original) + 50 (miniplayer height + margin)
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "white",
    fontSize: 20,
    marginBottom: 12,
    opacity: 0.9,
  },
  leadText: {
    color: "white",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.9,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
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
