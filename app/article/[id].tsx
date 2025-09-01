import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { fetchArticleContent, fetchArticles } from "@/services/api";
import { Article } from "@/types";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) {
        setError("No article ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, fetch all articles to find the one with matching ID
        const articles = await fetchArticles();
        const foundArticle = articles.find((a) => a.id === id);

        if (!foundArticle) {
          setError("Article not found");
          setLoading(false);
          return;
        }

        setArticle(foundArticle);

        // Then fetch the full content
        const fullContent = await fetchArticleContent(id);
        setContent(fullContent);
      } catch (err) {
        setError("Failed to load article");
        console.error("Error loading article:", err);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading article...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="title">{error || "Article not found"}</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButtonTop}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>

        <Image source={{ uri: article.imageUrl }} style={styles.headerImage} />

        <ThemedView style={styles.contentContainer}>
          <ThemedView style={styles.metaContainer}>
            <ThemedText style={styles.category}>{article.category}</ThemedText>
            <ThemedText style={styles.timestamp}>
              {article.timestamp}
            </ThemedText>
          </ThemedView>

          <ThemedText type="title" style={styles.title}>
            {article.title}
          </ThemedText>

          {article.subtitle && (
            <ThemedText type="subtitle" style={styles.subtitle}>
              {article.subtitle}
            </ThemedText>
          )}

          <ThemedText style={styles.leadText}>{article.leadText}</ThemedText>

          <ThemedView style={styles.divider} />

          {content ? (
            <ThemedText style={styles.content}>{content}</ThemedText>
          ) : (
            <ThemedText style={styles.content}>{article.content}</ThemedText>
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  backButtonTop: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  headerImage: {
    width: screenWidth,
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7,
    textTransform: "uppercase",
  },
  timestamp: {
    fontSize: 14,
    opacity: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    opacity: 0.8,
    lineHeight: 24,
  },
  leadText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
    lineHeight: 24,
    opacity: 0.9,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.8,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
