import ArticleTeaserHorizontal from "@/components/ArticleTeaserHorizontal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { fetchRelatedArticles } from "@/services/api";
import { Article } from "@/types";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface RelatedArticlesBlockProps {
  articleId: string;
}

export default function RelatedArticlesBlock({
  articleId,
}: RelatedArticlesBlockProps) {
  const { user, isAuthenticated } = useAuth();
  const { brandConfig } = useBrandConfig();
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get item count from config, default to 5
  const itemCount = brandConfig?.relatedArticlesBlock?.itemCount || 5;

  useEffect(() => {
    const loadRelatedArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const articles = await fetchRelatedArticles(
          articleId,
          itemCount,
          user?.userId,
          isAuthenticated
        );
        setRelatedArticles(articles);
      } catch (err) {
        setError("Failed to load related articles");
        console.error("Error loading related articles:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRelatedArticles();
  }, [articleId, itemCount, user?.userId, isAuthenticated]);

  const handleArticlePress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
          <ThemedText style={styles.loadingText}>
            Loading related articles...
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error || relatedArticles.length === 0) {
    return null; // Don't show the block if there's an error or no articles
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Related Articles</ThemedText>
      <FlatList
        data={relatedArticles}
        renderItem={({ item }) => (
          <ArticleTeaserHorizontal
            article={item}
            onPress={handleArticlePress}
          />
        )}
        keyExtractor={(item, index) => `related-${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
        snapToInterval={screenWidth * 0.7 + 12} // Card width + spacing
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    marginHorizontal: -16, // Negative margin to extend to screen edges
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    paddingHorizontal: 16, // Add padding back for the title
  },
  horizontalScrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
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
