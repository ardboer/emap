import { CarouselProgressIndicator } from "@/components/CarouselProgressIndicator";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { featuredArticles } from "@/data/mockData";
import { Article } from "@/types";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
  const flatListRef = useRef<FlatList>(null);

  const handleArticlePress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

  const goToNextSlide = () => {
    const nextIndex = (currentIndex + 1) % featuredArticles.length;
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  const handleProgressComplete = () => {
    if (!isUserInteracting) {
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
  };

  const handleScrollEndDrag = () => {
    setIsUserInteracting(false);
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
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0.4,0.6,0.8)"]}
        style={styles.overlay}
      >
        <ThemedView transparant style={styles.contentContainer}>
          <ThemedText type="title" style={styles.title}>
            {item.title}
          </ThemedText>
          {item.subtitle && (
            <ThemedText type="subtitle" style={styles.subtitle}>
              {item.subtitle}
            </ThemedText>
          )}
          <ThemedText style={styles.leadText}>{item.leadText}</ThemedText>
          <ThemedView transparant style={styles.metaContainer}>
            <ThemedText style={styles.category}>{item.category}</ThemedText>
            <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText>
          </ThemedView>
        </ThemedView>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <CarouselProgressIndicator
        totalItems={featuredArticles.length}
        currentIndex={currentIndex}
        duration={SLIDE_DURATION}
        isPlaying={isPlaying}
        onProgressComplete={handleProgressComplete}
      />
      <FlatList
        ref={flatListRef}
        data={featuredArticles}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselItem: {
    width: screenWidth,
    height: screenHeight - 60, // Account for tab bar
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "green",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
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
});
