import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { formatArticleDetailDate } from "@/services/api/utils/formatters";
import { Article } from "@/types";
import { router } from "expo-router";
import React, { memo, useCallback } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { FadeInImage } from "./FadeInImage";

const { width: screenWidth } = Dimensions.get("window");

// Calculate responsive thumbnail size
// Base size for iPhone SE (320px): 100x75
// Scale up for larger screens, with 20% increase at iPhone 16 Pro width (393px)
const getResponsiveThumbnailSize = () => {
  const baseWidth = 320; // iPhone SE width
  const baseThumbnailWidth = 100;
  const baseThumbnailHeight = 75;

  // Calculate scale factor (1.0 at 320px, 1.2 at 393px and above)
  const scaleFactor = Math.min(
    1.5,
    Math.max(1.0, ((screenWidth - baseWidth) / (393 - baseWidth)) * 0.2 + 1.5)
  );

  return {
    width: Math.round(baseThumbnailWidth * scaleFactor),
    height: Math.round(baseThumbnailHeight * scaleFactor),
  };
};

const thumbnailSize = getResponsiveThumbnailSize();

interface ArticleTeaserProps {
  article: Article;
  onPress?: (article: Article) => void;
}

function ArticleTeaser({ article, onPress }: ArticleTeaserProps) {
  const colorScheme = useColorScheme() ?? "light";

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(article);
    } else {
      console.log("opening article.id", article.id);

      // Pre-format the date to avoid flickering
      const formattedDate = article.publishDate
        ? formatArticleDetailDate(article.publishDate).toUpperCase()
        : article.timestamp?.toUpperCase() || "RECENTLY";

      router.push({
        pathname: `/article/${article.id}` as any,
        params: {
          previewTitle: article.title,
          previewCategory: article.category,
          previewDate: formattedDate,
        },
      });
    }
  }, [
    article.id,
    article.title,
    article.category,
    article.publishDate,
    article.timestamp,
    onPress,
  ]);

  return (
    <TouchableOpacity style={styles.articleContainer} onPress={handlePress}>
      <ThemedView style={styles.imageWrapper}>
        <FadeInImage
          source={{ uri: article.imageUrl }}
          style={styles.thumbnail}
        />
      </ThemedView>
      <ThemedView style={styles.contentContainer}>
        <ThemedView style={styles.metaContainer}>
          <ThemedText
            style={[
              styles.category,
              { color: Colors[colorScheme].articlePreTeaserTitleText },
            ]}
            numberOfLines={1}
          >
            {article.category}
          </ThemedText>
          {/* <BookmarkButton
            article={article}
            iconSize={16}
            iconColor={Colors[colorScheme].text}
            style={styles.bookmarkButton}
          /> */}
        </ThemedView>
        <ThemedText
          type="defaultSemiBold"
          numberOfLines={4}
          style={[
            styles.title,
            { color: Colors[colorScheme].articleTeaserTitleText },
          ]}
        >
          {article.title}
        </ThemedText>
        {/* <ThemedText style={styles.leadText} numberOfLines={2}>
          {article.leadText}
        </ThemedText>
        <ThemedView style={styles.metaContainer}>
          <ThemedText style={styles.category}>{article.category}</ThemedText>
          <ThemedText style={styles.timestamp}>{article.timestamp}</ThemedText>
        </ThemedView> */}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  articleContainer: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
  imageWrapper: {
    paddingTop: 4,
    backgroundColor: "transparent",
  },
  thumbnail: {
    width: thumbnailSize.width,
    height: thumbnailSize.height,
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 16,
    lineHeight: 20, // 1.25em of 16px
    fontWeight: "600",
  },
  leadText: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  category: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
    flex: 1,
  },
  bookmarkButton: {
    padding: 4,
    marginRight: -4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
});

// Memoize component - critical for list performance
// Only re-render if article ID changes
export default memo(ArticleTeaser, (prevProps, nextProps) => {
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.onPress === nextProps.onPress
  );
});
