import ArticleTeaserHorizontal from "@/components/ArticleTeaserHorizontal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { fetchTrendingArticles } from "@/services/api";
import { Article } from "@/types";
import React, { memo, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface TrendingBlockHorizontalProps {
  onArticlePress?: (article: Article) => void;
}

function TrendingBlockHorizontal({
  onArticlePress,
}: TrendingBlockHorizontalProps) {
  const { user, isAuthenticated } = useAuth();
  const { brandConfig } = useBrandConfig();
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get item count from config, default to 5
  const itemCount = brandConfig?.trendingBlockListView?.itemCount || 5;

  useEffect(() => {
    const loadTrendingArticles = async () => {
      try {
        setLoading(true);
        setError(null);
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
  }, [itemCount, user?.userId, isAuthenticated]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
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
    return null; // Don't show the block if there's an error or no articles
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={trendingArticles}
        renderItem={({ item }) => (
          <ArticleTeaserHorizontal article={item} onPress={onArticlePress} />
        )}
        keyExtractor={(item, index) => `trending-${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
        snapToInterval={screenWidth * 0.7 + 12} // Card width + spacing
        decelerationRate="fast"
        snapToAlignment="start"
        nestedScrollEnabled={true}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  horizontalScrollContent: {
    paddingRight: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    opacity: 0.7,
  },
});

// Memoize component - only re-render if onArticlePress changes
export default memo(
  TrendingBlockHorizontal,
  (
    prevProps: TrendingBlockHorizontalProps,
    nextProps: TrendingBlockHorizontalProps
  ) => {
    return prevProps.onArticlePress === nextProps.onArticlePress;
  }
);
