import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { fetchTrendingArticles } from "@/services/api";
import { Article } from "@/types";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import ArticleTeaser from "./ArticleTeaser";

export default function TrendingArticles() {
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentBackground = useThemeColor({}, "contentBackground");
  useEffect(() => {
    const loadTrendingArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const articles = await fetchTrendingArticles(5);
        setTrendingArticles(articles);
      } catch (err) {
        setError("Failed to load trending articles");
        console.error("Error loading trending articles:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingArticles();
  }, []);

  if (loading) {
    return (
      <ThemedView
        style={[styles.container, { backgroundColor: contentBackground }]}
      >
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Trending Articles
        </ThemedText>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
          <ThemedText style={styles.loadingText}>
            Loading trending articles...
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error || trendingArticles.length === 0) {
    return null; // Don't show the section if there's an error or no articles
  }

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: contentBackground }]}
    >
      <ThemedView style={styles.divider} />
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Trending Articles
      </ThemedText>
      <ThemedView
        style={[
          styles.articlesContainer,
          { backgroundColor: contentBackground },
        ]}
      >
        {trendingArticles.map((article) => (
          <ArticleTeaser key={article.id} article={article} />
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  articlesContainer: {
    gap: 0, // ArticleTeaser already has marginBottom
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    opacity: 0.7,
  },
});
