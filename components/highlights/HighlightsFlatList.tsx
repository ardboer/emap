import { CarouselItem } from "@/components/highlights/CarouselItem";
import { NativeAdItem } from "@/components/highlights/NativeAdItem";
import { ThemedText } from "@/components/ThemedText";
import { Article } from "@/types";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";

interface HighlightsFlatListProps {
  articles: Article[];
  flatListRef: React.RefObject<FlatList | null>;
  screenWidth: number;
  screenHeight: number;
  imageColors: { [key: string]: string[] };
  useColorGradient: boolean;
  insets: EdgeInsets;
  isLoadingMore: boolean;
  brandConfig: any;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onArticlePress: (article: Article) => void;
}

export const HighlightsFlatList: React.FC<HighlightsFlatListProps> = ({
  articles,
  flatListRef,
  screenWidth,
  screenHeight,
  imageColors,
  useColorGradient,
  insets,
  isLoadingMore,
  brandConfig,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  onArticlePress,
}) => {
  const renderCarouselItem = ({
    item,
    index,
  }: {
    item: Article;
    index: number;
  }) => {
    // Handle native ad items
    if (item.isNativeAd) {
      return <NativeAdItem item={item} index={index} insets={insets} />;
    }

    // Handle regular article items
    return (
      <CarouselItem
        item={item}
        imageColors={imageColors}
        useColorGradient={useColorGradient}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        insets={insets}
        onPress={onArticlePress}
      />
    );
  };

  const renderFooterComponent = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={[styles.loadingFooter, { height: screenHeight }]}>
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
    <FlatList
      key={`${screenWidth}x${screenHeight}`}
      ref={flatListRef}
      data={articles}
      renderItem={renderCarouselItem}
      keyExtractor={(item) => item.id}
      horizontal={false}
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      snapToInterval={screenHeight}
      snapToAlignment="start"
      disableIntervalMomentum={true}
      decelerationRate="fast"
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      scrollEventThrottle={16}
      getItemLayout={(data, index) => ({
        length: screenHeight,
        offset: screenHeight * index,
        index,
      })}
      ListFooterComponent={renderFooterComponent}
    />
  );
};

const styles = StyleSheet.create({
  loadingFooter: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
