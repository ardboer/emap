import { fetchPDFArticleDetail } from "@/services/api";
import { PDFArticleDetail } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface ArticleDetailViewProps {
  editionId: string;
  articleId: string;
  onBack: () => void;
}

export default function ArticleDetailView({
  editionId,
  articleId,
  onBack,
}: ArticleDetailViewProps) {
  const [article, setArticle] = useState<PDFArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📖 Loading article: ${editionId}/${articleId}`);

      const articleData = await fetchPDFArticleDetail(editionId, articleId);
      setArticle(articleData);
      console.log(`✅ Article loaded: ${articleData.title}`);
    } catch (err) {
      console.error("❌ Error loading article:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load article";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [editionId, articleId]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  const renderLoading = () => (
    <ThemedView style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <ThemedText style={styles.loadingText}>Loading article...</ThemedText>
    </ThemedView>
  );

  const renderError = () => (
    <ThemedView style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#999" />
      <ThemedText style={styles.errorTitle}>Unable to load article</ThemedText>
      <ThemedText style={styles.errorMessage}>{error}</ThemedText>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={loadArticle}
        accessibilityRole="button"
        accessibilityLabel="Retry loading article"
      >
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  const renderArticle = () => {
    if (!article) return null;

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <ThemedText type="title" style={styles.title}>
          {article.title}
        </ThemedText>

        <ThemedView style={styles.metaContainer}>
          <ThemedText style={styles.metaText}>Page {article.page}</ThemedText>
          <ThemedText style={styles.metaSeparator}>•</ThemedText>
          <ThemedText style={styles.metaText}>
            {article.blocks.length} block
            {article.blocks.length !== 1 ? "s" : ""}
          </ThemedText>
        </ThemedView>

        <ThemedText style={styles.articleText}>
          {article.content.plain}
        </ThemedText>
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header with back button */}
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to PDF"
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <ThemedText style={styles.backButtonText}>Back to PDF</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Content */}
      {loading && renderLoading()}
      {error && !loading && renderError()}
      {article && !loading && !error && renderArticle()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButtonText: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    marginBottom: 12,
    lineHeight: 38,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    opacity: 0.6,
  },
  metaText: {
    fontSize: 14,
  },
  metaSeparator: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  articleText: {
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
