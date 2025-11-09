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

// Card width is 70% of screen width to show partial next item
const CARD_WIDTH = screenWidth * 0.7;
const CARD_SPACING = 12;

interface ArticleTeaserHorizontalProps {
  article: Article;
  onPress?: (article: Article) => void;
}

export default function ArticleTeaserHorizontal({
  article,
  onPress,
}: ArticleTeaserHorizontalProps) {
  const colorScheme = useColorScheme() ?? "light";

  const handlePress = () => {
    if (onPress) {
      onPress(article);
    } else {
      console.log("opening article.id", article.id);
      router.push(`/article/${article.id}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.cardContainer, { width: CARD_WIDTH }]}
      onPress={handlePress}
    >
      <ThemedView style={styles.imageWrapper}>
        <FadeInImage
          source={{ uri: article.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      </ThemedView>
      <ThemedView style={styles.contentContainer}>
        <ThemedText style={styles.category}>{article.category}</ThemedText>
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
  category: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
});
