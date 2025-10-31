import ArticleTeaser from "@/components/ArticleTeaser";
import GradientHeader from "@/components/GradientHeader";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { fetchClinicalArticles } from "@/services/api";
import { Article } from "@/types";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClinicalScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const colorScheme = useColorScheme() ?? "light";
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { articles: fetchedArticles, hasMore: more } =
        await fetchClinicalArticles(1);
      setArticles(fetchedArticles);
      setHasMore(more);
      setCurrentPage(1);
    } catch (err) {
      setError("Failed to load articles");
      console.error("Error loading clinical articles:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load more articles for pagination
  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const { articles: fetchedArticles, hasMore: more } =
        await fetchClinicalArticles(nextPage);

      // Append new articles to existing ones
      setArticles((prev) => [...prev, ...fetchedArticles]);
      setHasMore(more);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Error loading more clinical articles:", err);
      // Don't show error for pagination failures, just stop loading
    } finally {
      setLoadingMore(false);
    }
  };

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(null);
      const { articles: fetchedArticles, hasMore: more } =
        await fetchClinicalArticles(1);
      setArticles(fetchedArticles);
      setHasMore(more);
      setCurrentPage(1);
    } catch (err) {
      setError("Failed to refresh articles");
      console.error("Error refreshing clinical articles:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle end reached for infinite scroll
  const handleEndReached = () => {
    if (!loadingMore && hasMore) {
      loadMoreArticles();
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleArticlePress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <ArticleTeaser article={item} onPress={() => handleArticlePress(item)} />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
        <ThemedText style={styles.footerText}>Loading more...</ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <ThemedView style={styles.centerContent}>
        <ThemedText style={styles.emptyText}>
          No clinical articles available
        </ThemedText>
      </ThemedView>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader onSearchPress={handleSearchPress} />
        <SkeletonLoader variant="list" count={8} />
      </ThemedView>
    );
  }

  if (error && articles.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <GradientHeader onSearchPress={handleSearchPress} />
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContainer,
          { backgroundColor: Colors[colorScheme].articleListBackground },
        ]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.6,
  },
  retryButton: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
});
