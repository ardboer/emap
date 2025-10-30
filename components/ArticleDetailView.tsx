import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { fetchPDFArticleDetail } from "@/services/api";
import { PDFArticleDetail } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
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
  const colorScheme = useColorScheme() ?? "light";
  const { brandConfig } = useBrandConfig();

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
      <ActivityIndicator
        size="large"
        color={Colors[colorScheme].contentTitleText}
      />
      <ThemedText style={styles.loadingText}>Loading article...</ThemedText>
    </ThemedView>
  );

  const renderError = () => (
    <ThemedView style={styles.centerContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={64}
        color={Colors[colorScheme].icon}
      />
      <ThemedText style={styles.errorTitle}>Unable to load article</ThemedText>
      <ThemedText style={styles.errorMessage}>{error}</ThemedText>
      <TouchableOpacity
        style={[
          styles.retryButton,
          {
            backgroundColor: Colors[colorScheme].contentBackButtonBg,
          },
        ]}
        onPress={loadArticle}
        accessibilityRole="button"
        accessibilityLabel="Retry loading article"
      >
        <ThemedText
          style={[
            styles.retryButtonText,
            { color: Colors[colorScheme].contentBackButtonText },
          ]}
        >
          Try Again
        </ThemedText>
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
        {/* Article Meta */}
        <ThemedView style={styles.metaContainer}>
          <ThemedText
            style={[
              styles.metaText,
              { color: Colors[colorScheme].contentMetaText },
            ]}
          >
            {/* Placeholder for timestamp - would come from article data */}
            65 DAYS AGO
          </ThemedText>
        </ThemedView>

        {/* Article Title */}
        <ThemedText
          style={[
            styles.title,
            {
              color: Colors[colorScheme].contentTitleText,
              fontFamily: brandConfig?.theme.fonts.primaryBold,
            },
          ]}
        >
          {article.title}
        </ThemedText>

        {/* Article Lead Text (if available) */}
        {article.content.plain && (
          <ThemedText
            style={[
              styles.leadText,
              {
                color: Colors[colorScheme].contentTitleText,
                fontFamily: brandConfig?.theme.fonts.primaryBold,
              },
            ]}
          >
            {/* First paragraph as lead - you may want to extract this differently */}
            {article.content.plain.split("\n\n")[0]}
          </ThemedText>
        )}

        {/* Article Body */}
        <ThemedText
          style={[
            styles.articleText,
            {
              color: Colors[colorScheme].contentBodyText,
              fontFamily: brandConfig?.theme.fonts.primary,
            },
          ]}
        >
          {article.content.plain}
        </ThemedText>

        {/* Highlight Box Example - You can add this based on article content */}
        {/* <ThemedView
          style={[
            styles.highlightBox,
            {
              backgroundColor:
                Colors[colorScheme].highlightBoxBg,
              borderTopColor:
                Colors[colorScheme].highlightBoxBorder,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.highlightBoxTitle,
              {
                color: Colors[colorScheme].highlightBoxText,
                fontFamily: brandConfig.theme.fonts.primaryBold,
              },
            ]}
          >
            Highlight Title
          </ThemedText>
          <ThemedText
            style={[
              styles.highlightBoxText,
              {
                color: Colors[colorScheme].highlightBoxText,
                fontFamily: brandConfig.theme.fonts.primary,
              },
            ]}
          >
            Highlight content goes here...
          </ThemedText>
        </ThemedView> */}
      </ScrollView>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].contentBackground },
      ]}
    >
      {/* Header with back button */}
      <View
        style={[
          styles.header,
          { backgroundColor: Colors[colorScheme].contentBackground },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: Colors[colorScheme].contentBackButtonBg,
            },
          ]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to PDF"
        >
          <Ionicons
            name="chevron-back"
            size={10}
            color={Colors[colorScheme].contentBackButtonText}
          />
          <Text
            style={[
              styles.backButtonText,
              {
                color: Colors[colorScheme].contentBackButtonText,
                fontFamily: brandConfig?.theme.fonts.primarySemiBold,
              },
            ]}
          >
            BACK
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && renderLoading()}
      {error && !loading && renderError()}
      {article && !loading && !error && renderArticle()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 12,
    lineHeight: 12,
    fontWeight: "600" as "600",
    textTransform: "uppercase" as "uppercase",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 100,
  },
  metaContainer: {
    marginBottom: 18,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 12,
    fontWeight: "500" as "500",
    textTransform: "uppercase" as "uppercase",
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700" as "700",
    marginBottom: 18,
  },
  leadText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700" as "700",
    marginBottom: 18,
  },
  articleText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400" as "400",
    marginBottom: 18,
  },
  highlightBox: {
    padding: 12,
    borderRadius: 4,
    borderTopWidth: 2,
    gap: 16,
    marginBottom: 18,
  },
  highlightBoxTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
  },
  highlightBoxText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
