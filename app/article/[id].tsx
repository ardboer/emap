import { BannerAd } from "@/components/BannerAd";
import { PaywallBottomSheet } from "@/components/PaywallBottomSheet";
import RelatedArticles from "@/components/RelatedArticles";
import { RichContentRenderer } from "@/components/RichContentRenderer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Article, StructuredContentNode } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
  const { id } = useLocalSearchParams<{ id: string }>(); // const id = 345162; //
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallEnabled, setPaywallEnabled] = useState(true);

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
    // Load paywall debug setting
    AsyncStorage.getItem("debug_show_paywall").then((value) => {
      setPaywallEnabled(value !== "false"); // Default to true if not set
    });
  }, []);

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
      } catch (err) {
        setError("Failed to load article");
        console.error("Error loading article:", err);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  useEffect(() => {
    if (article && paywallEnabled) {
      // Show paywall after 2 seconds
      const timer = setTimeout(() => {
        setShowPaywall(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [article, paywallEnabled]);

  const handleClosePaywall = () => {
    setShowPaywall(false);
  };

  const handleSubscribe = () => {
    console.log("Subscribe button pressed");
    // TODO: Implement subscription flow
    setShowPaywall(false);
  };

  const handleSignIn = () => {
    console.log("Sign In button pressed");
    // TODO: Implement sign in flow
    setShowPaywall(false);
  };

  // Helper function to render content based on type
  const renderContent = () => {
    if (!article?.content) return null;

    // Debug logging
    console.log("Article content type:", typeof article.content);
    console.log("Is array:", Array.isArray(article.content));
    if (Array.isArray(article.content)) {
      console.log("Content length:", article.content.length);
      console.log("First few items:", article.content.slice(0, 3));
    }

    // If content is structured (array), use RichContentRenderer
    if (Array.isArray(article.content)) {
      return (
        <RichContentRenderer
          content={article.content as StructuredContentNode[]}
          style={styles.richContent}
        />
      );
    }

    // If content is string, use ThemedText
    return (
      <ThemedText style={styles.content}>
        {article.content as string}
      </ThemedText>
    );
  };

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
            {/* <ThemedText style={styles.category}>{article.author}</ThemedText> */}
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

          {/* Banner Ad below lead text */}
          <BannerAd
            showLoadingIndicator={true}
            showErrorMessage={false}
            onAdLoaded={() => console.log("Banner ad loaded successfully")}
            onAdFailedToLoad={(error) =>
              console.log("Banner ad failed to load:", error)
            }
            style={styles.bannerAd}
          />

          <ThemedView style={styles.divider} />

          {/* Render content based on type */}
          {renderContent()}

          {/* Related Articles Section */}
          <RelatedArticles currentArticleId={article.id} />
        </ThemedView>
      </Animated.ScrollView>

      <PaywallBottomSheet
        visible={showPaywall}
        onClose={handleClosePaywall}
        onSubscribe={handleSubscribe}
        onSignIn={handleSignIn}
      />
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
  bannerAd: {
    marginVertical: 20,
    alignSelf: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.8,
  },
  richContent: {
    marginBottom: 16,
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
