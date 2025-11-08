import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { fetchTrendingArticles } from "@/services/api";
import { nativeAdVariantManager } from "@/services/nativeAdVariantManager";
import { Article } from "@/types";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import ArticleTeaser from "./ArticleTeaser";
import NativeAdListItem from "./NativeAdListItem";

export default function TrendingArticles() {
  const { user, isAuthenticated } = useAuth();
  const { brandConfig } = useBrandConfig();
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentBackground = useThemeColor({}, "contentBackground");

  // Check if trending articles detail is enabled
  const isEnabled = brandConfig?.trendingArticlesDetail?.enabled ?? true;
  const itemCount = brandConfig?.trendingArticlesDetail?.itemCount || 5;

  useEffect(() => {
    // Don't load if disabled
    if (!isEnabled) {
      setLoading(false);
      return;
    }

    const loadTrendingArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize native ad variant manager
        await nativeAdVariantManager.initialize();

        const articles = await fetchTrendingArticles(
          itemCount,
          user?.userId,
          isAuthenticated
        );
        setTrendingArticles(articles);
      } catch (err) {
        setError("Failed to load trending articles");
        console.error("Error loading trending articles:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingArticles();
  }, [isEnabled, itemCount, user?.userId, isAuthenticated]);

  // Don't render if disabled
  if (!isEnabled) {
    return null;
  }

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
        {trendingArticles.map((article, index) => {
          // Check if we should show a native ad at this position
          if (
            nativeAdVariantManager.shouldShowAdAtPosition("trending", index)
          ) {
            return (
              <React.Fragment key={`ad-${index}`}>
                <NativeAdListItem position={index} viewType="trending" />
                <ArticleTeaser key={article.id} article={article} />
              </React.Fragment>
            );
          }

          return <ArticleTeaser key={article.id} article={article} />;
        })}
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
