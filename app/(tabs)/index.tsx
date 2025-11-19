import { BrandLogo } from "@/components/BrandLogo";
import { CarouselProgressIndicator } from "@/components/CarouselProgressIndicator";
import { HighlightsFlatList } from "@/components/highlights/HighlightsFlatList";
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
import { formatArticleDetailDate } from "@/services/api/utils/formatters";
import { nativeAdInstanceManager } from "@/services/nativeAdInstanceManager";
import { Article } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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

  // Simplified tracking state for highlights
  const [viewedArticles, setViewedArticles] = useState<Set<string>>(new Set());
  const [maxIndexReached, setMaxIndexReached] = useState(0);
  const [indexesViewed, setIndexesViewed] = useState<Set<number>>(new Set([0]));

  const previousIndexRef = useRef(0);
  const wasUnfocusedRef = useRef(false);
  // Ref to track in-flight loadMoreRecommendations requests
  const loadMoreInProgressRef = useRef(false);

  const handleSearchPress = () => {
    router.push("/search");
  };

  const handleArticlePress = (article: Article) => {
    // Track highlights click
    analyticsService.logHighlightsClick(
      currentIndex,
      article.id,
      article.title
    );

    // Pre-format the date to avoid flickering
    const formattedDate = article.publishDate
      ? formatArticleDetailDate(article.publishDate).toUpperCase()
      : article.timestamp?.toUpperCase() || "RECENTLY";

    router.push({
      pathname: `/article/${article.id}` as any,
      params: {
        source: "highlights",
        previewTitle: article.title,
        previewCategory: article.category || "",
        previewDate: formattedDate,
      },
    });
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
        // Use different color properties for variety in the gradient
        return [result.primary, result.secondary, result.detail].filter(
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
      console.log("🎨 Starting color extraction for landscape images...");
      for (const article of fetchedArticles) {
        if (article.isLandscape) {
          // console.log(
          //   `🎨 Extracting colors for article ${
          //     article.id
          //   }: ${article.title.substring(0, 30)}...`
          // );
          const extractedColors = await extractImageColors(
            article.imageUrl,
            article.id
          );
          colors[article.id] = extractedColors;
          console.log(
            `✅ Extracted colors for ${article.id}:`,
            extractedColors
          );
        }
      }
      console.log(
        `🎨 Color extraction complete. Total colors extracted: ${
          Object.keys(colors).length
        }`
      );
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

        // Endless scroll exhausted (analytics removed)
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

      // Endless scroll loaded (analytics removed)

      console.log("✅ Loaded more recommendations:", {
        newItems: newArticles.length,
        totalArticles: articles.length + newArticles.length,
        totalMisoLoaded: totalMisoItemsLoaded + newArticles.length,
      });
    } catch (error) {
      console.error("❌ Error loading more recommendations:", error);

      // Endless scroll error (analytics removed)

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
      goToNextSlide();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / screenHeight);

    // DEBUG: Log scroll events to detect skipping
    if (index !== currentIndex) {
      // console.log("📜 Scroll detected:", {
      //   scrollPosition,
      //   calculatedIndex: index,
      //   currentIndex,
      //   skipped: Math.abs(index - currentIndex) > 1,
      //   articleAtIndex: articles[index]?.title?.substring(0, 30),
      //   isNativeAd: articles[index]?.isNativeAd,
      // });
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
  };

  const handleScrollEndDrag = () => {
    setIsUserInteracting(false);

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

  // Track when articles are loaded (removed carousel session tracking)
  useEffect(() => {
    if (articles.length === 0) return;

    // Reset tracking state
    setMaxIndexReached(0);
    setIndexesViewed(new Set([0]));
    setViewedArticles(new Set());
  }, [articles]);

  // Track highlights view when article changes
  useEffect(() => {
    if (articles.length === 0) return;

    const currentArticle = articles[currentIndex];
    if (!currentArticle) return;

    // Track highlights view
    analyticsService.logHighlightsView(
      currentIndex,
      currentArticle.id,
      currentArticle.title
    );

    // Update tracking state
    setIndexesViewed((prev) => new Set(prev).add(currentIndex));
    setViewedArticles((prev) => new Set(prev).add(currentArticle.id));
    if (currentIndex > maxIndexReached) {
      setMaxIndexReached(currentIndex);
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
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={{
            top: insets.top + 10,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            position: "absolute",
            left: 16,
            right: 16,
          }}
        >
          <BrandLogo
            style={[styles.brandLogo]}
            width={136 * 0.8}
            height={52 * 0.8}
          />
          <ThemedView style={[styles.topRightIcons]}>
            <TouchableOpacity style={styles.iconButton} disabled>
              <Ionicons
                name="search"
                size={26}
                color={searchIconColor}
                opacity={0.5}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} disabled>
              <UserIcon width={26} height={26} opacity={0.5} />
            </TouchableOpacity>
          </ThemedView>
        </View>
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
      <View
        style={{
          top: insets.top + 0,
          flexDirection: "row",
          justifyContent: "space-between",
          position: "absolute",
          left: 16,
          right: 16,
        }}
      >
        <BrandLogo
          style={[styles.brandLogo, { marginTop: 8 }]}
          width={136 * 0.8}
          height={52 * 0.8}
        />

        {/* Top Right Icons Container */}
        <ThemedView style={[styles.topRightIcons, { marginTop: 16 }]}>
          {/* Search Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSearchPress}
          >
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
      </View>
      <HighlightsFlatList
        articles={articles}
        flatListRef={flatListRef}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        imageColors={imageColors}
        useColorGradient={useColorGradient}
        insets={insets}
        isLoadingMore={isLoadingMore}
        brandConfig={brandConfig}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onArticlePress={handleArticlePress}
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
    zIndex: 10,
    borderRadius: 8,
    padding: 8,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
    zIndex: 10,
    flexDirection: "row",
    gap: 16,
    backgroundColor: "transparent",
  },
  iconButton: {
    borderRadius: 20,
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  userIcon: {
    fontSize: 20,
    color: "white",
  },
});
