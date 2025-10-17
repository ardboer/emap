import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Article } from "@/types";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface ArticleTeaserProps {
  article: Article;
  onPress?: (article: Article) => void;
}

export default function ArticleTeaser({
  article,
  onPress,
}: ArticleTeaserProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(article);
    } else {
      console.log("opening article.id", article.id);
      router.push(`/article/${article.id}`);
    }
  };

  return (
    <TouchableOpacity style={styles.articleContainer} onPress={handlePress}>
      <Image
        source={{ uri: article.imageUrl }}
        style={styles.thumbnail}
        contentFit="cover"
      />
      <ThemedView style={styles.contentContainer}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
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
    marginBottom: 16,
    // backgroundColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  thumbnail: {
    width: 180,
    height: 120,
    marginTop: 16,
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
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
