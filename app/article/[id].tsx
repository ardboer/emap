import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Article } from "@/types";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const HEADER_HEIGHT = screenHeight * 0.4;

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll position tracking
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated styles for stretchy header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    // When scrollY is negative (pulling down), scale up dramatically
    // When scrollY is positive (scrolling up), scale stays at 1
    const scale = interpolate(scrollY.value, [-300, 0], [2.5, 1], "clamp");

    // Adjust translateY to keep image centered when scaling
    const translateY = interpolate(scrollY.value, [-300, 0], [0, 0], "clamp");

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  // Back button animated style
  const backButtonAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.8], "clamp");
    return { opacity };
  });

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

        // Fetch the complete article with content in one API call
        const fetchSingleArticle = (await import("@/services/api"))
          .fetchSingleArticle;
        const fullArticle = await fetchSingleArticle(id);

        setArticle(fullArticle);
        setContent(fullArticle.content);
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
    <View style={styles.container}>
      {/* Fixed Header Image */}
      <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
        <Image source={{ uri: article.imageUrl }} style={styles.headerImage} />
      </Animated.View>

      {/* Back Button */}
      <Animated.View style={[styles.backButtonTop, backButtonAnimatedStyle]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Spacer to push content below header */}
        <View style={styles.headerSpacer} />

        {/* Article Content */}
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
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 0,
  },
  headerImage: {
    width: "100%",
    height: "100%",
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
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSpacer: {
    height: HEADER_HEIGHT,
  },
  contentContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: -20,
    minHeight: screenHeight - HEADER_HEIGHT + 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
