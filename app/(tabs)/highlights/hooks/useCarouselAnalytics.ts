import { analyticsService } from "@/services/analytics";
import { Article } from "@/types";
import { useEffect, useState } from "react";

export interface CarouselAnalytics {
  trackArticlePress: (
    article: Article,
    currentIndex: number,
    totalArticles: number,
    wordpressCount: number
  ) => void;
  trackAutoAdvance: (
    currentIndex: number,
    totalArticles: number,
    maxIndexReached: number,
    article: Article
  ) => void;
  trackManualScrollStart: (
    currentIndex: number,
    maxIndexReached: number,
    totalArticles: number
  ) => void;
  trackManualScrollEnd: (
    currentIndex: number,
    maxIndexReached: number,
    totalArticles: number
  ) => void;
  trackBackwardScroll: (
    fromIndex: number,
    toIndex: number,
    maxIndexReached: number,
    articleId: string
  ) => void;
}

/**
 * Custom hook to manage carousel analytics tracking
 * Simplified to track only essential carousel session events
 */
export function useCarouselAnalytics(
  articles: Article[],
  currentIndex: number,
  wordpressArticleCount: number,
  isUserInteracting: boolean
): CarouselAnalytics {
  // Analytics tracking state
  const [carouselStartTime, setCarouselStartTime] = useState<number | null>(
    null
  );
  const [maxIndexReached, setMaxIndexReached] = useState(0);
  const [indexesViewed, setIndexesViewed] = useState<Set<number>>(new Set([0]));
  const [scrollProgression, setScrollProgression] = useState<number[]>([0]);
  const [scrollInteractions, setScrollInteractions] = useState(0);

  // Track carousel session start/end
  useEffect(() => {
    if (articles.length === 0) return;

    const startTime = Date.now();
    setCarouselStartTime(startTime);
    setMaxIndexReached(0);
    setIndexesViewed(new Set([0]));
    setScrollProgression([0]);
    setScrollInteractions(0);

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
      // Track carousel exit with scroll depth data
      if (carouselStartTime) {
        const sessionDuration = Date.now() - carouselStartTime;
        const scrollDepthPercentage =
          ((maxIndexReached + 1) / articles.length) * 100;
        const uniqueIndexesViewed = indexesViewed.size;
        const completionRate = (uniqueIndexesViewed / articles.length) * 100;
        const reachedEnd = maxIndexReached === articles.length - 1;

        analyticsService.logEvent("carousel_session_end", {
          session_duration_ms: sessionDuration,
          session_duration_seconds: Math.round(sessionDuration / 1000),
          max_index_reached: maxIndexReached,
          scroll_depth_percentage: Math.round(scrollDepthPercentage),
          unique_indexes_viewed: uniqueIndexesViewed,
          completion_rate: Math.round(completionRate),
          reached_end: reachedEnd,
          total_articles: articles.length,
          scroll_interactions: scrollInteractions,
          avg_time_per_article:
            uniqueIndexesViewed > 0
              ? Math.round(sessionDuration / uniqueIndexesViewed)
              : 0,
        });
      }
    };
  }, [articles]);

  // Track index changes for scroll depth and highlights view
  useEffect(() => {
    if (articles.length === 0) return;

    const currentArticle = articles[currentIndex];
    if (!currentArticle) return;

    // Update max index reached (only for forward progression)
    if (currentIndex > maxIndexReached) {
      setMaxIndexReached(currentIndex);
    }

    // Track all indexes viewed
    setIndexesViewed((prev) => new Set(prev).add(currentIndex));
    setScrollProgression((prev) => [...prev, currentIndex]);

    // Track highlights view
    analyticsService.logEvent("highlights_view", {
      index: currentIndex,
      article_id: currentArticle.id,
      article_title: currentArticle.title,
    });
  }, [currentIndex, articles]);

  const trackArticlePress = (
    article: Article,
    currentIndex: number,
    totalArticles: number,
    wordpressCount: number
  ) => {
    // Track highlights click
    analyticsService.logEvent("highlights_click", {
      index: currentIndex,
      article_id: article.id,
      article_title: article.title,
    });

    // Also track detailed carousel article press
    analyticsService.logEvent("carousel_article_press", {
      article_id: article.id,
      article_title: article.title,
      article_category: article.category,
      article_source: article.source || "wordpress",
      is_recommended: article.isRecommended || false,
      position: currentIndex,
      total_articles: totalArticles,
      wordpress_count: wordpressCount,
      miso_count: totalArticles - wordpressCount,
    });
  };

  const trackAutoAdvance = (
    currentIndex: number,
    totalArticles: number,
    maxIndexReached: number,
    article: Article
  ) => {
    analyticsService.logEvent("carousel_auto_advance", {
      from_position: currentIndex,
      to_position: (currentIndex + 1) % totalArticles,
      total_articles: totalArticles,
      max_index_reached: maxIndexReached,
      article_source: article?.source || "native-ad",
      is_native_ad: article?.isNativeAd || false,
    });
  };

  const trackManualScrollStart = (
    currentIndex: number,
    maxIndexReached: number,
    totalArticles: number
  ) => {
    setScrollInteractions((prev) => prev + 1);
    // No event logging - just track interaction count
  };

  const trackManualScrollEnd = (
    currentIndex: number,
    maxIndexReached: number,
    totalArticles: number
  ) => {
    // No event logging
  };

  const trackBackwardScroll = (
    fromIndex: number,
    toIndex: number,
    maxIndexReached: number,
    articleId: string
  ) => {
    // No event logging
  };

  return {
    trackArticlePress,
    trackAutoAdvance,
    trackManualScrollStart,
    trackManualScrollEnd,
    trackBackwardScroll,
  };
}
