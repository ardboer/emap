import GradientHeader from "@/components/GradientHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useColorScheme } from "@/hooks/useColorScheme";
import { fetchPDFArticleDetail } from "@/services/api";
import { PDFArticleDetail } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const HEADER_HEIGHT = screenHeight * 0.4;

export default function PDFArticleScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const { editionId, articleId } = useLocalSearchParams<{
    editionId: string;
    articleId: string;
  }>();

  const [article, setArticle] = useState<PDFArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll position tracking
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    const loadArticle = async () => {
      if (!editionId || !articleId) {
        setError("Missing article information");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`📖 Loading PDF article: ${editionId}/${articleId}`);

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
    };

    loadArticle();
  }, [editionId, articleId]);

  const handleBack = () => {
    router.back();
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader
          onSearchPress={handleSearchPress}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading article...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error || !article) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader
          onSearchPress={handleSearchPress}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#999" />
          <ThemedText type="title" style={styles.errorTitle}>
            {error || "Article not found"}
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <GradientHeader
          onSearchPress={handleSearchPress}
          showBackButton={true}
          onBackPress={handleBack}
        />
        {/* Scrollable Content */}
        <Animated.ScrollView
          style={[
            styles.scrollView,
            { backgroundColor: Colors[colorScheme].contentBackground },
          ]}
          contentContainerStyle={[styles.scrollContent]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Article Content */}
          <ThemedView
            style={[
              styles.contentContainer,
              { backgroundColor: Colors[colorScheme].contentBackground },
              getCenteredContentStyle(),
            ]}
          >
            <ThemedView style={styles.metaContainer}>
              <ThemedText style={styles.metaText}>
                Page {article.page}
              </ThemedText>
              <ThemedText style={styles.metaSeparator}>•</ThemedText>
              <ThemedText style={styles.metaText}>
                {article.blocks.length} block
                {article.blocks.length !== 1 ? "s" : ""}
              </ThemedText>
            </ThemedView>

            <ThemedText type="title" style={styles.title}>
              {article.title}
            </ThemedText>

            <ThemedView style={styles.divider} />

            <ThemedText style={styles.articleText}>
              {article.content.plain}
            </ThemedText>
          </ThemedView>
        </Animated.ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonFloating: {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
    // backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 0,
  },
  contentContainer: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 20,
    minHeight: screenHeight - 100,
    flex: 1,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 16,
    opacity: 0.6,
  },
  metaText: {
    fontSize: 14,
  },
  metaSeparator: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    lineHeight: 36,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginBottom: 24,
  },
  articleText: {
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  centerContent: {
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
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
