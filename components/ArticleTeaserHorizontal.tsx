import BookmarkButton from "@/components/BookmarkButton";
import { FadeInImage } from "@/components/FadeInImage";
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

const { width: screenWidth } = Dimensions.get("window");

// Card width is 70% of screen width to show partial next item
const CARD_WIDTH = screenWidth * 0.7;
const CARD_SPACING = 12;

interface ArticleTeaserHorizontalProps {
  article: Article;
  onPress?: (article: Article) => void;
}

function ArticleTeaserHorizontal({
  article,
  onPress,
}: ArticleTeaserHorizontalProps) {
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
          previewCategory: article.category || "",
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
    <TouchableOpacity
      style={[styles.cardContainer, { width: CARD_WIDTH }]}
      onPress={handlePress}
    >
      <ThemedView style={styles.imageWrapper}>
        <FadeInImage source={{ uri: article.imageUrl }} style={styles.image} />
      </ThemedView>
      <ThemedView style={styles.contentContainer}>
        <ThemedView style={styles.headerRow}>
          <ThemedText style={styles.category}>{article.category}</ThemedText>
          <BookmarkButton
            article={article}
            iconSize={18}
            iconColor={Colors[colorScheme].text}
            style={styles.bookmarkButton}
          />
        </ThemedView>
        <ThemedText
          type="defaultSemiBold"
          style={[
            styles.title,
            { color: Colors[colorScheme].articleTeaserTitleText },
          ]}
          numberOfLines={3}
        >
          {article.title}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginRight: CARD_SPACING,
    backgroundColor: "transparent",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 3 / 2,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    paddingTop: 12,
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  category: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
  },
  bookmarkButton: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
});

// Memoize component to prevent unnecessary re-renders
// Only re-render if article ID changes
export default memo(ArticleTeaserHorizontal, (prevProps, nextProps) => {
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.onPress === nextProps.onPress
  );
});
