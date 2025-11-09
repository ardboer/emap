import { nativeAdInstanceManager } from "@/services/nativeAdInstanceManager";
import { Article } from "@/types";
import { useRef } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

export interface CarouselNavigation {
  flatListRef: React.RefObject<FlatList | null>;
  goToNextSlide: () => void;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollBeginDrag: () => void;
  handleScrollEndDrag: () => void;
  handleMomentumScrollEnd: (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => void;
}

/**
 * Custom hook to manage carousel navigation and scroll handlers
 * Handles scroll events, navigation, and native ad preloading
 */
export function useCarouselNavigation(
  articles: Article[],
  currentIndex: number,
  setCurrentIndex: (index: number) => void,
  setIsPlaying: (playing: boolean) => void,
  setIsUserInteracting: (interacting: boolean) => void,
  isCarouselVisible: boolean,
  screenHeight: number,
  brandConfig: any,
  trackManualScrollStart: (
    currentIndex: number,
    maxIndexReached: number,
    totalArticles: number
  ) => void,
  trackManualScrollEnd: (
    currentIndex: number,
    maxIndexReached: number,
    totalArticles: number
  ) => void,
  maxIndexReached: number
): CarouselNavigation {
  const flatListRef = useRef<FlatList>(null);

  const goToNextSlide = () => {
    const nextIndex = (currentIndex + 1) % articles.length;

    console.log("➡️ Going to next slide:", {
      currentIndex,
      nextIndex,
      totalArticles: articles.length,
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / screenHeight);

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
    trackManualScrollStart(currentIndex, maxIndexReached, articles.length);
  };

  const handleScrollEndDrag = () => {
    setIsUserInteracting(false);
    trackManualScrollEnd(currentIndex, maxIndexReached, articles.length);

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
    if (isCarouselVisible) {
      setIsPlaying(true);
    }
  };

  return {
    flatListRef,
    goToNextSlide,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
  };
}
