import { analyticsService } from "@/services/analytics";
import {
  fetchHighlightsWithRecommendations,
  fetchRecommendedArticlesWithExclude,
} from "@/services/api";
import { nativeAdInstanceManager } from "@/services/nativeAdInstanceManager";
import { Article } from "@/types";
import { useEffect, useRef, useState } from "react";
import { extractColorsForArticles } from "../utils/colorExtraction";

export interface CarouselArticlesState {
  articles: Article[];
  loading: boolean;
  error: string | null;
  isLoadingMore: boolean;
  hasMoreItems: boolean;
  wordpressArticleCount: number;
  imageColors: { [key: string]: string[] };
  loadArticles: () => Promise<void>;
  loadMoreRecommendations: () => Promise<void>;
}

/**
 * Custom hook to manage article loading and endless scroll
 * Handles initial load, color extraction, and loading more recommendations
 */
export function useCarouselArticles(
  userId: string | undefined,
  isAuthenticated: boolean,
  brandConfig: any,
  currentIndex: number,
  isCarouselVisible: boolean,
  isUserInteracting: boolean
): CarouselArticlesState {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageColors, setImageColors] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [wordpressArticleCount, setWordpressArticleCount] = useState(0);

  // Endless scroll state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [loadedMisoIds, setLoadedMisoIds] = useState<Set<string>>(new Set());
  const [totalMisoItemsLoaded, setTotalMisoItemsLoaded] = useState(0);

  // Ref to track in-flight loadMoreRecommendations requests
  const loadMoreInProgressRef = useRef(false);

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
      const fetchedArticles = await fetchHighlightsWithRecommendations(
        userId,
        isAuthenticated
      );

      // Find the index where Miso articles start
      let lastWordPressIndex = -1;
      for (let i = 0; i < fetchedArticles.length; i++) {
        const article = fetchedArticles[i];
        if (article.source === "miso") {
          break;
        }
        if (article.source === "wordpress" || article.isNativeAd) {
          lastWordPressIndex = i;
        }
      }

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

      // Extract colors from landscape images BEFORE setting articles
      const colors = await extractColorsForArticles(fetchedArticles);
      setImageColors(colors);

      // Set articles AFTER colors are extracted
      setArticles(fetchedArticles);

      // Trigger initial preload for native ads near starting position
      const config = brandConfig?.nativeAds as any;
      if (config?.enabled && fetchedArticles.length > 0) {
        const preloadDistance = config?.preloadDistance || 2;
        const unloadDistance = config?.unloadDistance || 3;

        setTimeout(() => {
          nativeAdInstanceManager.handlePositionChange(
            0,
            preloadDistance,
            unloadDistance
          );
        }, 100);
      }
    } catch (err) {
      setError("Failed to load articles");
      console.error("Error loading articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRecommendations = async () => {
    // Check if request is already in progress
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
      loadMoreInProgressRef.current = true;
      setIsLoadingMore(true);

      const brandPrefix = brandConfig?.shortcode.toUpperCase() || "NT";

      // Build comprehensive exclude list
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
        userId,
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

      // Check if we got fewer items than requested
      if (newArticles.length < itemsPerLoad) {
        console.log(
          "⚠️ Received fewer items than requested, might be near end"
        );
        setHasMoreItems(false);
      }

      // Extract colors for landscape images
      const colors = await extractColorsForArticles(markedNewArticles);
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
    } finally {
      loadMoreInProgressRef.current = false;
      setIsLoadingMore(false);
      // Resume playing if carousel is visible and user not interacting
      if (isCarouselVisible && !isUserInteracting) {
        // Note: This would need to be handled by parent component
      }
    }
  };

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

  return {
    articles,
    loading,
    error,
    isLoadingMore,
    hasMoreItems,
    wordpressArticleCount,
    imageColors,
    loadArticles,
    loadMoreRecommendations,
  };
}
