import ArticleTeaserHorizontal from "@/components/ArticleTeaserHorizontal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { fetchRecommendedArticles } from "@/services/api";
import { Article } from "@/types";
import React, { memo, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface RecommendedBlockHorizontalProps {
  onArticlePress?: (article: Article) => void;
}

function RecommendedBlockHorizontal({
  onArticlePress,
}: RecommendedBlockHorizontalProps) {
  const { user, isAuthenticated } = useAuth();
  const { brandConfig } = useBrandConfig();
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get item count from config, default to 5
  const itemCount = brandConfig?.recommendedBlockListView?.itemCount || 5;

  useEffect(() => {
    const loadRecommendedArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const articles = await fetchRecommendedArticles(
          itemCount,
          user?.userId,
          isAuthenticated
        );
        setRecommendedArticles(articles);
      } catch (err) {
        setError("Failed to load recommended articles");
        console.error("Error loading recommended articles:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendedArticles();
  }, [itemCount, user?.userId, isAuthenticated]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
          <ThemedText style={styles.loadingText}>
            Loading recommended articles...
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error || recommendedArticles.length === 0) {
    return null; // Don't show the block if there's an error or no articles
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={recommendedArticles}
        renderItem={({ item }) => (
          <ArticleTeaserHorizontal article={item} onPress={onArticlePress} />
        )}
        keyExtractor={(item, index) => `recommended-${item.id}-${index}`}
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
  RecommendedBlockHorizontal,
  (
    prevProps: RecommendedBlockHorizontalProps,
    nextProps: RecommendedBlockHorizontalProps
  ) => {
    return prevProps.onArticlePress === nextProps.onArticlePress;
  }
);
