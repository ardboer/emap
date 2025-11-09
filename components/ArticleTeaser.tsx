import { FadeInImage } from "@/components/FadeInImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { Article } from "@/types";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

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
  source?: string;
}

export default function ArticleTeaser({
  article,
  onPress,
  source = "article_list",
}: ArticleTeaserProps) {
  const colorScheme = useColorScheme() ?? "light";

  const handlePress = () => {
    if (onPress) {
      onPress(article);
    } else {
      console.log("opening article.id", article.id);
      router.push(`/article/${article.id}?source=${source}`);
    }
  };

  return (
    <TouchableOpacity style={styles.articleContainer} onPress={handlePress}>
      <ThemedView style={styles.imageWrapper}>
        <FadeInImage
          source={{ uri: article.imageUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      </ThemedView>
      <ThemedView style={styles.contentContainer}>
        <ThemedView style={styles.metaContainer}>
          <ThemedText style={styles.category} numberOfLines={1}>
            {article.category}
          </ThemedText>
          {/* <ThemedText style={styles.timestamp}>{article.timestamp}</ThemedText> */}
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
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
});
