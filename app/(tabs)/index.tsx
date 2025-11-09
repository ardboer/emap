import { CarouselProgressIndicator } from "@/components/CarouselProgressIndicator";
import { ThemedView } from "@/components/ThemedView";
import { useAudio } from "@/contexts/AudioContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Article } from "@/types";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CarouselErrorState } from "./highlights/components/CarouselErrorState";
import { CarouselFooter } from "./highlights/components/CarouselFooter";
import { CarouselHeader } from "./highlights/components/CarouselHeader";
import { CarouselItem } from "./highlights/components/CarouselItem";
import { CarouselLoadingState } from "./highlights/components/CarouselLoadingState";
import { useCarouselAnalytics } from "./highlights/hooks/useCarouselAnalytics";
import { useCarouselArticles } from "./highlights/hooks/useCarouselArticles";
import { useCarouselLifecycle } from "./highlights/hooks/useCarouselLifecycle";
import { useCarouselNavigation } from "./highlights/hooks/useCarouselNavigation";
import { useCarouselState } from "./highlights/hooks/useCarouselState";

export default function HighlightedScreen() {
  const { features } = useBrandConfig();
  const insets = useSafeAreaInsets();
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [useColorGradient] = useState(true);

  // Auth & Audio context
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { state: audioState } = useAudio();
  const { brandConfig } = useBrandConfig();

  // Theme colors
  const contentBackground = useThemeColor({}, "contentBackground");
  const recommendedBadgeBg = useThemeColor({}, "recommendedBadgeBg");
  const searchIconColor = useThemeColor({}, "searchIcon");

  // Get slide duration from brand config
  const slideDurationSeconds =
    brandConfig?.highlightsRecommendations?.slideDurationSeconds || 5;
  const SLIDE_DURATION = slideDurationSeconds * 1000;

  // Custom hooks for state management
  const {
    currentIndex,
    isPlaying,
    isUserInteracting,
    isCarouselVisible,
    screenDimensions,
    setCurrentIndex,
    setIsPlaying,
    setIsUserInteracting,
    setIsCarouselVisible,
  } = useCarouselState();

  const {
    articles,
    loading,
    error,
    isLoadingMore,
    hasMoreItems,
    wordpressArticleCount,
    imageColors,
    loadArticles,
  } = useCarouselArticles(
    user?.userId,
    isAuthenticated,
    brandConfig,
    currentIndex,
    isCarouselVisible,
    isUserInteracting
  );

  const {
    trackArticlePress,
    trackAutoAdvance,
    trackManualScrollStart,
    trackManualScrollEnd,
  } = useCarouselAnalytics(
    articles,
    currentIndex,
    wordpressArticleCount,
    isUserInteracting
  );

  const {
    flatListRef,
    goToNextSlide,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
  } = useCarouselNavigation(
    articles,
    currentIndex,
    setCurrentIndex,
    setIsPlaying,
    setIsUserInteracting,
    isCarouselVisible,
    screenDimensions.height,
    brandConfig,
    trackManualScrollStart,
    trackManualScrollEnd,
    0 // maxIndexReached - would need to be tracked if needed
  );

  // Lifecycle management
  useCarouselLifecycle(
    isAuthLoading,
    isAuthenticated,
    user?.userId,
    loadArticles,
    setIsCarouselVisible,
    setIsPlaying,
    isUserInteracting,
    currentIndex,
    setCurrentIndex,
    flatListRef,
    articles,
    screenDimensions.width,
    screenDimensions.height
  );

  // Event handlers
  const handleSearchPress = () => {
    router.push("/search");
  };

  const handleArticlePress = (article: Article) => {
    trackArticlePress(
      article,
      currentIndex,
      articles.length,
      wordpressArticleCount
    );
    router.push(`/article/${article.id}`);
  };

  const handleProgressComplete = () => {
    if (isLoadingMore) {
      console.log("⏸️ Skipping auto-advance: loading more recommendations");
      return;
    }

    const currentArticle = articles[currentIndex];
    if (!isUserInteracting && isCarouselVisible) {
      trackAutoAdvance(
        currentIndex,
        articles.length,
        currentIndex,
        currentArticle
      );
      goToNextSlide();
    }
  };

  // Render loading state
  if (loading) {
    return (
      <CarouselLoadingState
        insets={insets}
        searchIconColor={searchIconColor}
        slideDuration={SLIDE_DURATION}
        showMiniPlayer={audioState.showMiniPlayer}
        backgroundColor={contentBackground}
      />
    );
  }

  // Render error state
  if (error || articles.length === 0) {
    return (
      <CarouselErrorState
        error={error}
        onRetry={loadArticles}
        backgroundColor={contentBackground}
      />
    );
  }

  // Render carousel item
  const renderCarouselItem = ({
    item,
    index,
  }: {
    item: Article;
    index: number;
  }) => (
    <CarouselItem
      item={item}
      index={index}
      onPress={handleArticlePress}
      insets={insets}
      brandConfig={brandConfig}
      showMiniPlayer={audioState.showMiniPlayer}
      recommendedBadgeBg={recommendedBadgeBg}
      imageColors={imageColors}
      useColorGradient={useColorGradient}
      screenWidth={screenDimensions.width}
      screenHeight={screenDimensions.height}
    />
  );

  return (
    <ThemedView style={{ flex: 1, backgroundColor: contentBackground }}>
      {!isLoadingMore && (
        <CarouselProgressIndicator
          currentIndex={currentIndex}
          duration={SLIDE_DURATION}
          isPlaying={isPlaying && isCarouselVisible}
          onProgressComplete={handleProgressComplete}
          showMiniPlayer={audioState.showMiniPlayer}
        />
      )}

      <CarouselHeader
        insets={insets}
        searchIconColor={searchIconColor}
        onSearchPress={handleSearchPress}
        onUserPress={() => setSettingsDrawerVisible(true)}
      />

      <FlatList
        key={`${screenDimensions.width}x${screenDimensions.height}`}
        ref={flatListRef}
        data={articles}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id}
        horizontal={false}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={screenDimensions.height}
        snapToAlignment="start"
        disableIntervalMomentum={true}
        decelerationRate="fast"
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: screenDimensions.height,
          offset: screenDimensions.height * index,
          index,
        })}
        ListFooterComponent={
          <CarouselFooter
            isLoadingMore={isLoadingMore}
            screenHeight={screenDimensions.height}
            primaryColor={brandConfig?.theme.colors.light.primary}
          />
        }
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
