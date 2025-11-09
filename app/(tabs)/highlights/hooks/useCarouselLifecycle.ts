import { analyticsService } from "@/services/analytics";
import { cacheService } from "@/services/cache";
import { nativeAdInstanceManager } from "@/services/nativeAdInstanceManager";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect } from "react";
import { AppState } from "react-native";

/**
 * Custom hook to manage carousel lifecycle events
 * Handles focus/blur, orientation changes, app state, and tab press events
 */
export function useCarouselLifecycle(
  isAuthLoading: boolean,
  isAuthenticated: boolean,
  userId: string | undefined,
  loadArticles: () => Promise<void>,
  setIsCarouselVisible: (visible: boolean) => void,
  setIsPlaying: (playing: boolean) => void,
  isUserInteracting: boolean,
  currentIndex: number,
  setCurrentIndex: (index: number) => void,
  flatListRef: React.RefObject<any>,
  articles: any[],
  screenWidth: number,
  screenHeight: number
) {
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();

  // Load articles when auth is ready
  useEffect(() => {
    if (!isAuthLoading) {
      loadArticles();
    }
  }, [isAuthLoading, isAuthenticated, userId]);

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
  useEffect(() => {
    if (params.scrollToTop && isFocused) {
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
      const timeoutId = setTimeout(() => {
        const router = require("expo-router").router;
        router.setParams({ scrollToTop: undefined, timestamp: undefined });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    params.scrollToTop,
    params.timestamp,
    isFocused,
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

    const { Dimensions } = require("react-native");
    const subscription = Dimensions.addEventListener(
      "change",
      ({ window }: any) => {
        const { width, height } = window;
        const newOrientation = width > height ? "landscape" : "portrait";

        // Only reload if orientation actually changed
        if (newOrientation !== previousOrientation) {
          previousOrientation = newOrientation;

          // Clear the cache for both orientations to force fresh data
          (async () => {
            await cacheService.remove("highlights_landscape");
            await cacheService.remove("highlights_portrait");
            await cacheService.remove("featured_articles_landscape");
            await cacheService.remove("featured_articles_portrait");

            // Clear ads and refresh content to get appropriate images
            nativeAdInstanceManager.clearAll();
            loadArticles();
          })();
        }
      }
    );

    return () => {
      subscription?.remove();
    };
  }, [screenWidth, screenHeight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsPlaying(false);
      nativeAdInstanceManager.clearAll();
    };
  }, []);
}
