import { BrandLogo } from "@/components/BrandLogo";
import { CarouselProgressIndicator } from "@/components/CarouselProgressIndicator";
import { FadeInImage } from "@/components/FadeInImage";
import { NativeAdCarouselItem } from "@/components/NativeAdCarouselItem";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { UserIcon } from "@/components/UserIcon";
import { useAudio } from "@/contexts/AudioContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import {
  fetchHighlightsWithRecommendations,
  fetchRecommendedArticlesWithExclude,
} from "@/services/api";
import { nativeAdInstanceManager } from "@/services/nativeAdInstanceManager";
import { Article } from "@/types";
import { hexToRgba } from "@/utils/colors";
import { Ionicons } from "@expo/vector-icons";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { getColors } from "react-native-image-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HighlightedScreen() {
  const { features } = useBrandConfig();
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const params = useLocalSearchParams();

  // Make screen dimensions reactive to orientation changes
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });
  const screenWidth = screenDimensions.width;
  const screenHeight = screenDimensions.height;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [useColorGradient, setUseColorGradient] = useState(true);
  const [imageColors, setImageColors] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [isCarouselVisible, setIsCarouselVisible] = useState(true);
  const [wordpressArticleCount, setWordpressArticleCount] = useState(0);

  // Endless scroll state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [loadedMisoIds, setLoadedMisoIds] = useState<Set<string>>(new Set());
  const [totalMisoItemsLoaded, setTotalMisoItemsLoaded] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { state: audioState } = useAudio();
  const { brandConfig } = useBrandConfig();
  const backgroundColor = useThemeColor({}, "background");
  const contentBackground = useThemeColor({}, "contentBackground");
  const recommendedBadgeBg = useThemeColor({}, "recommendedBadgeBg");
  const searchIconColor = useThemeColor({}, "searchIcon");

  // Get slide duration from brand config (in seconds), default to 5 seconds
  const slideDurationSeconds =
    brandConfig?.highlightsRecommendations?.slideDurationSeconds || 5;
  const SLIDE_DURATION = slideDurationSeconds * 1000; // Convert to milliseconds

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
  const wasUnfocusedRef = useRef(false);
  // Ref to track in-flight loadMoreRecommendations requests
  const loadMoreInProgressRef = useRef(false);

  const handleSearchPress = () => {
    router.push("/search");
  };

  const handleArticlePress = (article: Article) => {
    const dwellTime = articleViewStartTime
      ? Date.now() - articleViewStartTime
      : 0;

    analyticsService.logEvent("carousel_article_click", {
      article_id: article.id,
      article_title: article.title,
      article_category: article.category,
      article_source: article.source || "wordpress",
      is_recommended: article.isRecommended || false,
      position: currentIndex,
      dwell_time_before_click_ms: dwellTime,
      dwell_time_before_click_seconds: Math.round(dwellTime / 1000),
      total_articles: articles.length,
      wordpress_count: wordpressArticleCount,
      miso_count: articles.length - wordpressArticleCount,
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

      // Reset endless scroll state
      setIsLoadingMore(false);
      setHasMoreItems(true);
      setLoadedMisoIds(new Set());
      setTotalMisoItemsLoaded(0);

      // Fetch combined articles (WordPress + Miso recommendations)
      // Uses authenticated user ID when logged in, otherwise anonymous
      const fetchedArticles = await fetchHighlightsWithRecommendations(
        user?.userId,
        isAuthenticated
      );

      // Find the index where Miso articles start (first non-WordPress, non-native-ad article)
      // Native ads within WordPress section should be counted as WordPress for progress
      let lastWordPressIndex = -1;
      for (let i = 0; i < fetchedArticles.length; i++) {
        const article = fetchedArticles[i];
        // Stop counting when we hit the first Miso article
        if (article.source === "miso") {
          break;
        }
        // Count WordPress articles and native ads that appear before Miso articles
        if (article.source === "wordpress" || article.isNativeAd) {
          lastWordPressIndex = i;
        }
      }

      // WordPress count includes native ads in the WordPress section
      const wpCount = lastWordPressIndex + 1;
      setWordpressArticleCount(wpCount);

      const actualWpCount = fetchedArticles.filter(
        (a) => a.source === "wordpress"
      ).length;
      const nativeAdCount = fetchedArticles.filter((a) => a.isNativeAd).length;

      console.log(
        `📰 Loaded ${
          fetchedArticles.length
        } articles: ${actualWpCount} WordPress, ${nativeAdCount} Native Ads, ${
          fetchedArticles.length - actualWpCount - nativeAdCount
        } Miso`
      );
      console.log(
        `📊 Progress will show for first ${wpCount} items (WordPress + native ads in WP section)`
      );

      // DEBUG: Log article details
      // console.log(
      //   "📋 Article order:",
      //   fetchedArticles.map((a, i) => ({
      //     index: i,
      //     id: a.id,
      //     title: a.title.substring(0, 30),
      //     source: a.source,
      //     isNativeAd: a.isNativeAd,
      //     inProgressSection: i < wpCount,
      //   }))
      // );

      // Track initial Miso IDs for exclusion in endless scroll
      const brandPrefix = brandConfig?.shortcode.toUpperCase() || "NT";
      const initialMisoIds = new Set<string>();

      fetchedArticles.forEach((article) => {
        if (article.source === "miso") {
          initialMisoIds.add(`${brandPrefix}-${article.id}`);
        }
      });

      setLoadedMisoIds(initialMisoIds);
      setTotalMisoItemsLoaded(initialMisoIds.size);

      console.log("📊 Initial load complete:", {
        totalArticles: fetchedArticles.length,
        wordpressCount: wpCount,
        initialMisoCount: initialMisoIds.size,
        endlessScrollEnabled:
          brandConfig?.highlightsRecommendations?.endlessScroll?.enabled,
      });

      // Load color gradient setting
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const colorGradientSetting = await AsyncStorage.getItem(
        "debug_use_color_gradient"
      );
      setUseColorGradient(true); // colorGradientSetting === "true"

      // Extract colors from landscape images BEFORE setting articles
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

      // Set articles AFTER colors are extracted
      setArticles(fetchedArticles);

      // Trigger initial preload for native ads near starting position
      const config = brandConfig?.nativeAds as any;
      if (config?.enabled && fetchedArticles.length > 0) {
        const preloadDistance = config?.preloadDistance || 2;
        const unloadDistance = config?.unloadDistance || 3;

        // Trigger preload for ads near position 0
        // FIX: Add cleanup to prevent memory leak
        const timeoutId = setTimeout(() => {
          nativeAdInstanceManager.handlePositionChange(
            0,
            preloadDistance,
            unloadDistance
          );
        }, 100);

        // Store timeout ID for cleanup
        return () => clearTimeout(timeoutId);
      }
    } catch (err) {
      setError("Failed to load articles");
      console.error("Error loading articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRecommendations = async () => {
    // FIX: Race condition - check if request is already in progress using ref
    if (loadMoreInProgressRef.current || isLoadingMore || !hasMoreItems) {
      console.log("⏸️ Skipping load more:", {
        inProgress: loadMoreInProgressRef.current,
        isLoadingMore,
        hasMoreItems,
      });
      return;
    }

    // Check if endless scroll is enabled
    if (!brandConfig?.highlightsRecommendations?.endlessScroll?.enabled) {
      return;
    }

    try {
      // FIX: Set ref to prevent concurrent requests
      loadMoreInProgressRef.current = true;
      setIsLoadingMore(true);

      const brandPrefix = brandConfig?.shortcode.toUpperCase() || "NT";

      // Build comprehensive exclude list:
      // 1. All WordPress article IDs
      // 2. All previously loaded Miso article IDs
      const wordpressIds = articles
        .filter((a) => a.source === "wordpress")
        .map((a) => `${brandPrefix}-${a.id}`);

      const misoIds = Array.from(loadedMisoIds);
      const excludeIds = [...wordpressIds, ...misoIds];

      console.log("📥 Fetching more recommendations:", {
        excludeCount: excludeIds.length,
        wordpressCount: wordpressIds.length,
        misoCount: misoIds.length,
        requestingItems:
          brandConfig?.highlightsRecommendations?.endlessScroll?.itemsPerLoad ||
          5,
      });

      // Fetch more items
      const itemsPerLoad =
        brandConfig?.highlightsRecommendations?.endlessScroll?.itemsPerLoad ||
        5;
      const newArticles = await fetchRecommendedArticlesWithExclude(
        itemsPerLoad,
        excludeIds,
        user?.userId,
        isAuthenticated
      );

      if (newArticles.length === 0) {
        console.log("✅ No more recommendations available");
        setHasMoreItems(false);

        analyticsService.logEvent("carousel_endless_scroll_exhausted", {
          total_items_loaded: articles.length,
          total_miso_items: totalMisoItemsLoaded,
          wordpress_count: wordpressArticleCount,
        });
        return;
      }

      // Mark as Miso source and recommended
      const markedNewArticles = newArticles.map((article) => ({
        ...article,
        source: "miso" as const,
        isRecommended: true,
      }));

      // Track new Miso IDs
      const newMisoIds = new Set(loadedMisoIds);
      markedNewArticles.forEach((article) => {
        newMisoIds.add(`${brandPrefix}-${article.id}`);
      });
      setLoadedMisoIds(newMisoIds);

      // Append to articles array
      setArticles((prev) => [...prev, ...markedNewArticles]);
      setTotalMisoItemsLoaded((prev) => prev + newArticles.length);

      // Check if we got fewer items than requested (might be end of content)
      if (newArticles.length < itemsPerLoad) {
        console.log(
          "⚠️ Received fewer items than requested, might be near end"
        );
        setHasMoreItems(false);
      }

      // Extract colors for landscape images
      const colors: { [key: string]: string[] } = {};
      for (const article of markedNewArticles) {
        if (article.isLandscape) {
          colors[article.id] = await extractImageColors(
            article.imageUrl,
            article.id
          );
        }
      }
      setImageColors((prev) => ({ ...prev, ...colors }));

      // Analytics
      analyticsService.logEvent("carousel_endless_scroll_loaded", {
        items_loaded: newArticles.length,
        total_articles_now: articles.length + newArticles.length,
        total_miso_items: totalMisoItemsLoaded + newArticles.length,
        trigger_index: currentIndex,
        exclude_list_size: excludeIds.length,
      });

      console.log("✅ Loaded more recommendations:", {
        newItems: newArticles.length,
        totalArticles: articles.length + newArticles.length,
        totalMisoLoaded: totalMisoItemsLoaded + newArticles.length,
      });
    } catch (error) {
      console.error("❌ Error loading more recommendations:", error);

      analyticsService.logEvent("carousel_endless_scroll_error", {
        error_message: error instanceof Error ? error.message : "Unknown error",
        trigger_index: currentIndex,
        total_articles: articles.length,
      });

      // Don't set hasMoreItems to false on error - allow retry
    } finally {
      // FIX: Clear in-progress flag in finally block
      loadMoreInProgressRef.current = false;
      setIsLoadingMore(false);
      // Resume playing if carousel is visible and user not interacting
      if (isCarouselVisible && !isUserInteracting) {
        setIsPlaying(true);
      }
    }
  };

  const goToNextSlide = () => {
    const nextIndex = (currentIndex + 1) % articles.length;

    // DEBUG: Log slide navigation
    console.log("➡️ Going to next slide:", {
      currentIndex,
      nextIndex,
      totalArticles: articles.length,
      wordpressCount: wordpressArticleCount,
      currentArticle: articles[currentIndex]?.title,
      nextArticle: articles[nextIndex]?.title,
      nextSource: articles[nextIndex]?.source,
    });

    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  const handleProgressComplete = () => {
    // Don't auto-advance if we're loading more recommendations
    if (isLoadingMore) {
      console.log("⏸️ Skipping auto-advance: loading more recommendations");
      return;
    }

    // Auto-advance for ALL slides (WordPress + Miso)
    const currentArticle = articles[currentIndex];

    // DEBUG: Log progress completion details
    console.log("🔄 Progress Complete:", {
      currentIndex,
      totalArticles: articles.length,
      currentSource: currentArticle?.source,
      isNativeAd: currentArticle?.isNativeAd,
      nextIndex: (currentIndex + 1) % articles.length,
      shouldAdvance: !isUserInteracting && isCarouselVisible,
      isLoadingMore,
    });

    if (!isUserInteracting && isCarouselVisible) {
      analyticsService.logEvent("carousel_auto_advance", {
        from_position: currentIndex,
        to_position: (currentIndex + 1) % articles.length,
        total_articles: articles.length,
        max_index_reached: maxIndexReached,
        article_source: currentArticle?.source || "native-ad",
        is_native_ad: currentArticle?.isNativeAd || false,
      });
      goToNextSlide();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / screenHeight);

    // DEBUG: Log scroll events to detect skipping
    if (index !== currentIndex) {
      console.log("📜 Scroll detected:", {
        scrollPosition,
        calculatedIndex: index,
        currentIndex,
        skipped: Math.abs(index - currentIndex) > 1,
        articleAtIndex: articles[index]?.title?.substring(0, 30),
        isNativeAd: articles[index]?.isNativeAd,
      });
      setCurrentIndex(index);

      // Trigger lazy loading/unloading for native ads
      const config = brandConfig?.nativeAds as any;
      if (config?.enabled) {
        const preloadDistance = config?.preloadDistance || 2;
        const unloadDistance = config?.unloadDistance || 3;

        nativeAdInstanceManager.handlePositionChange(
          index,
          preloadDistance,
          unloadDistance
        );
      }
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
    // FIX: Store timeout ID for cleanup
    const timeoutId = setTimeout(() => {
      if (isCarouselVisible) {
        setIsPlaying(true);
      }
    }, 500);

    // Note: This timeout is intentionally not cleaned up as it's part of user interaction flow
    // and should complete even if component unmounts shortly after
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / screenHeight);

    // Force scroll to the exact index to prevent skipping
    if (index !== currentIndex) {
      flatListRef.current?.scrollToIndex({
        index: index,
        animated: false,
      });
    }

    setCurrentIndex(index);

    // Ensure we resume playing after manual scroll, but only if carousel is visible
    if (!isUserInteracting && isCarouselVisible) {
      setIsPlaying(true);
    }
  };

  // Note: Tab visibility is already controlled by the href prop in _layout.tsx
  // No redirect needed here - let the tab render normally like other tabs

  // Load articles when auth is ready
  useEffect(() => {
    // Wait for auth to finish loading before fetching articles
    if (!isAuthLoading) {
      loadArticles();
    }
  }, [isAuthLoading, isAuthenticated, user?.userId]);

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
      wordpress_count: wordpressArticleCount,
      miso_count: articles.length - wordpressArticleCount,
      first_article_id: articles[0]?.id,
      first_article_title: articles[0]?.title,
      first_article_source: articles[0]?.source || "wordpress",
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
      article_source: currentArticle.source || "wordpress",
      is_recommended: currentArticle.isRecommended || false,

      // Position info
      position: currentIndex,
      total_articles: articles.length,
      wordpress_count: wordpressArticleCount,
      miso_count: articles.length - wordpressArticleCount,
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

  // Endless scroll trigger - load more when 3 items from end
  useEffect(() => {
    if (articles.length === 0 || !hasMoreItems || isLoadingMore) return;

    // Check if endless scroll is enabled
    if (!brandConfig?.highlightsRecommendations?.endlessScroll?.enabled) return;

    // Calculate distance from end
    const triggerThreshold =
      brandConfig?.highlightsRecommendations?.endlessScroll?.triggerThreshold ||
      3;
    const distanceFromEnd = articles.length - currentIndex - 1;

    // Trigger load when at threshold distance from end
    if (distanceFromEnd === triggerThreshold) {
      console.log("🔄 Endless scroll triggered:", {
        currentIndex,
        totalArticles: articles.length,
        distanceFromEnd,
        loadedMisoIds: loadedMisoIds.size,
      });

      loadMoreRecommendations();
    }
  }, [currentIndex, articles.length, hasMoreItems, isLoadingMore, brandConfig]);

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

  // Handle tab press to scroll to top and refresh when already in view
  // Listen for route params to detect when tab is pressed while already focused
  useEffect(() => {
    // Check if scrollToTop param is present (set by tab press listener)
    if (params.scrollToTop && isCarouselVisible) {
      // Scroll to index 0 instantly (no animation)
      if (currentIndex !== 0) {
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: false,
        });
        setCurrentIndex(0);
      }

      // Refresh content when tab is pressed while already in view
      console.log("🔄 Tab pressed while in view - refreshing content");
      nativeAdInstanceManager.clearAll();
      loadArticles();

      // Analytics
      analyticsService.logEvent("carousel_tab_press_scroll_to_top", {
        previous_index: currentIndex,
        total_articles: articles.length,
        scroll_distance: currentIndex,
      });

      // Clear the param by navigating without it to prevent re-triggering
      // Use a small timeout to ensure the scroll completes first
      // FIX: Add cleanup for timeout
      const timeoutId = setTimeout(() => {
        router.setParams({ scrollToTop: undefined, timestamp: undefined });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    params.scrollToTop,
    params.timestamp,
    isCarouselVisible,
    currentIndex,
    articles.length,
  ]);

  // Handle app coming back from background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && isFocused) {
        console.log(
          "📱 App returned from background - resetting to index 0 and refreshing"
        );
        // Scroll to index 0
        if (currentIndex !== 0) {
          flatListRef.current?.scrollToIndex({
            index: 0,
            animated: false,
          });
          setCurrentIndex(0);
        }
        // Clear ads and refresh content
        nativeAdInstanceManager.clearAll();
        loadArticles();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isFocused, currentIndex]);

  // Handle device orientation changes
  useEffect(() => {
    let previousOrientation =
      screenWidth > screenHeight ? "landscape" : "portrait";

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      const { width, height } = window;
      const newOrientation = width > height ? "landscape" : "portrait";

      // Update screen dimensions state
      setScreenDimensions({ width, height });

      // Only reload if orientation actually changed
      if (newOrientation !== previousOrientation) {
        previousOrientation = newOrientation;

        // Clear the cache for both orientations to force fresh data
        (async () => {
          const { cacheService } = await import("@/services/cache");
          await cacheService.remove("highlights_landscape");
          await cacheService.remove("highlights_portrait");
          await cacheService.remove("featured_articles_landscape");
          await cacheService.remove("featured_articles_portrait");

          // Clear ads and refresh content to get appropriate images
          nativeAdInstanceManager.clearAll();
          loadArticles();
        })();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Handle focus/blur events to pause/resume when screen is not active
  useEffect(() => {
    return () => {
      setIsPlaying(false);
      // Cleanup all native ads on unmount
      nativeAdInstanceManager.clearAll();
    };
  }, []);
  const styles = {
    ...staticStyles,
    container: {
      flex: 1,
      backgroundColor: contentBackground,
    },
    carouselItem: {
      width: screenWidth,
      height: screenHeight,
      position: "relative" as const,
    },
    loadingFooter: {
      height: screenHeight,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  };
  const renderCarouselItem = ({
    item,
    index,
  }: {
    item: Article;
    index: number;
  }) => {
    // Handle native ad items
    if (item.isNativeAd) {
      return (
        <NativeAdCarouselItem
          item={item}
          position={index}
          shouldLoad={true}
          onAdClicked={() => {
            analyticsService.logEvent("native_ad_click", {
              position: index,
              ad_id: item.id,
            });
          }}
          onLoadComplete={(success) => {
            if (!success) {
              console.warn(`Native ad at position ${index} failed to load`);
            }
          }}
          insets={insets}
          showingProgress={false}
        />
      );
    }

    // Render recommended badge for Miso articles
    const renderRecommendedBadge = () => {
      return (
        <View
          style={[
            styles.recommendedBadge,
            { top: insets.top + 60, backgroundColor: recommendedBadgeBg },
          ]}
        >
          <ThemedText
            style={[
              styles.recommendedBadgeText,
              { fontFamily: brandConfig?.theme.fonts.primarySemiBold },
            ]}
          >
            {item.isRecommended ? "Recommended for you" : "Editors Pick"}
          </ThemedText>
        </View>
      );
    };

    // For landscape images OR when no portrait image is available, use landscape layout
    // This provides a fallback when portrait images are missing
    if (item.isLandscape || !item.imageUrl) {
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
            {/* Main centered image - use contain to maintain aspect ratio */}
            <FadeInImage
              source={{ uri: item.imageUrl }}
              style={styles.centeredImage}
              contentFit="contain"
              contentPosition="center"
            />
            {/* Top gradient for header visibility */}
            <LinearGradient
              colors={["rgba(0, 0, 0, 0.6)", "transparent"] as const}
              style={styles.topGradient}
              pointerEvents="none"
            />
            {renderRecommendedBadge()}
            <LinearGradient
              colors={
                [
                  "transparent",
                  hexToRgba(
                    brandConfig?.theme.colors.light.overlayGradientEnd ||
                      "#011620",
                    0.85
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
            <FadeInImage
              source={{ uri: item.imageUrl }}
              style={styles.backgroundImageBlurred}
              contentFit="cover"
              blurRadius={50}
            />
            {/* Dark overlay for blurred background */}
            <View style={styles.darkOverlay} />
            {/* Main centered image - use contain to maintain aspect ratio */}
            <FadeInImage
              source={{ uri: item.imageUrl }}
              style={styles.centeredImage}
              contentFit="contain"
              contentPosition="center"
            />
            {/* Top gradient for header visibility */}
            <LinearGradient
              colors={["rgba(0, 0, 0, 0.6)", "transparent"] as const}
              style={styles.topGradient}
              pointerEvents="none"
            />
            {renderRecommendedBadge()}
            <LinearGradient
              colors={
                [
                  "transparent",
                  hexToRgba(
                    brandConfig?.theme.colors.light.overlayGradientEnd ||
                      "#011620",
                    0.85
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
        <FadeInImage
          source={{ uri: item.imageUrl }}
          style={styles.backgroundImage}
          contentFit="cover"
          contentPosition="center"
        />
        {/* Top gradient for header visibility */}
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.6)", "transparent"] as const}
          style={styles.topGradient}
          pointerEvents="none"
        />
        {renderRecommendedBadge()}
        <LinearGradient
          colors={
            [
              "transparent",
              hexToRgba(
                brandConfig?.theme.colors.light.overlayGradientEnd || "#011620",
                0.85
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
      <ThemedView style={styles.container}>
        <CarouselProgressIndicator
          currentIndex={0}
          duration={SLIDE_DURATION}
          isPlaying={false}
          onProgressComplete={() => {}}
          showMiniPlayer={audioState.showMiniPlayer}
        />
        <BrandLogo
          style={[styles.brandLogo, { top: insets.top + 10 }]}
          width={100}
          height={35}
        />
        <ThemedView style={[styles.topRightIcons, { top: insets.top + 10 }]}>
          <TouchableOpacity style={styles.iconButton} disabled>
            <Ionicons
              name="search"
              size={24}
              color={searchIconColor}
              opacity={0.5}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} disabled>
            <UserIcon width={24} height={24} opacity={0.5} />
          </TouchableOpacity>
        </ThemedView>
        <SkeletonLoader variant="carousel" />
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

  const renderFooterComponent = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator
          size="large"
          color={brandConfig?.theme.colors.light.primary}
        />
        <ThemedText style={styles.loadingText}>
          Loading more recommendations...
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {!isLoadingMore && (
        <CarouselProgressIndicator
          currentIndex={currentIndex}
          duration={SLIDE_DURATION}
          isPlaying={isPlaying && isCarouselVisible}
          onProgressComplete={handleProgressComplete}
          showMiniPlayer={audioState.showMiniPlayer}
        />
      )}
      <BrandLogo
        style={[styles.brandLogo, { top: insets.top + 10 }]}
        width={100}
        height={35}
      />

      {/* Top Right Icons Container */}
      <ThemedView style={[styles.topRightIcons, { top: insets.top + 10 }]}>
        {/* Search Button */}
        <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
          <Ionicons name="search" size={24} color={searchIconColor} />
        </TouchableOpacity>

        {/* User Settings Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setSettingsDrawerVisible(true)}
        >
          <UserIcon width={24} height={24} />
        </TouchableOpacity>
      </ThemedView>

      <FlatList
        key={`${screenWidth}x${screenHeight}`}
        ref={flatListRef}
        data={articles}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id}
        horizontal={false}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        //showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        disableIntervalMomentum={true}
        decelerationRate="fast"
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        ListFooterComponent={renderFooterComponent}
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
    top: 20,
    left: 12,
    zIndex: 10,
    borderRadius: 8,
    padding: 8,
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
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 5,
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
  topRightIcons: {
    position: "absolute",
    top: 80,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "transparent",
  },
  iconButton: {
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
  recommendedBadge: {
    position: "absolute",
    top: 80,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 20,
  },
  recommendedBadgeText: {
    color: "#011620",
    fontSize: 12,
    fontWeight: "600",
  },
});
