import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { formatArticleDetailDate } from "@/services/api/utils/formatters";
import { Article } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
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

interface ArticleTeaserHeroProps {
  article: Article;
  onPress?: (article: Article) => void;
}

function ArticleTeaserHero({ article, onPress }: ArticleTeaserHeroProps) {
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
    <TouchableOpacity style={styles.heroContainer} onPress={handlePress}>
      <ThemedView style={styles.imageContainer}>
        <FadeInImage
          source={{ uri: article.imageUrl }}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0.8)"]}
          style={styles.gradient}
        >
          <ThemedView style={styles.contentContainer}>
            <ThemedView style={styles.headerRow}>
              <ThemedText type="defaultSemiBold" style={styles.title}>
                {article.title}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </LinearGradient>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    width: "100%",
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: "transparent",
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
  },
  contentContainer: {
    padding: 16,
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "transparent",
  },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bookmarkButton: {
    marginTop: -4,
  },
});

// Memoize component - critical for list performance
// Only re-render if article ID changes
export default memo(ArticleTeaserHero, (prevProps, nextProps) => {
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.onPress === nextProps.onPress
  );
});
