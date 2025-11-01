import { BannerAd } from "@/components/BannerAd";
import { FadeInImage } from "@/components/FadeInImage";
import { PaywallBottomSheet } from "@/components/PaywallBottomSheet";
import { RichContentRenderer } from "@/components/RichContentRenderer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TrendingArticles from "@/components/TrendingArticles";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AdSizes } from "@/services/admob";
import { getAnonymousId } from "@/services/anonymousId";
import { trackArticleView } from "@/services/miso";
import { Article, StructuredContentNode } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
  const { user, isAuthenticated } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const { brandConfig } = useBrandConfig();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  const contentBackground = useThemeColor({}, "contentBackground");

  // Related articles state for swipe navigation
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [currentRelatedIndex, setCurrentRelatedIndex] = useState(-1);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

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
      console.log("article id to be retrieved", id);
      try {
        setLoading(true);
        setError(null);

        // Fetch the complete article with content in one API call
        const fetchSingleArticle = (await import("@/services/api"))
          .fetchSingleArticle;
        const fullArticle = await fetchSingleArticle(id);

        setArticle(fullArticle);

        // Track article view with Miso
        const anonymousId = await getAnonymousId();
        trackArticleView({
          articleId: id,
          userId: user?.userId,
          isAuthenticated,
          anonymousId,
        });
      } catch (err) {
        setError("Failed to load article");
        console.error("Error loading article:", err);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id, isAuthenticated, user?.userId]);

  // Fetch related articles for swipe navigation
  useEffect(() => {
    const loadRelatedArticles = async () => {
      if (!id) {
        console.log("No article ID for fetching related articles");
        return;
      }

      console.log("Fetching related articles for article ID:", id);
      try {
        const { fetchRelatedArticles } = await import("@/services/api");
        const related = await fetchRelatedArticles(
          id,
          5,
          user?.userId,
          isAuthenticated
        );
        console.log(
          "Related articles fetched:",
          related?.length || 0,
          "articles"
        );

        // Fallback to trending articles if no related articles found
        // if (!related || related.length === 0) {
        //   console.log(
        //     "No related articles found, falling back to trending articles"
        //   );
        //   const { fetchTrendingArticles } = await import("@/services/api");
        //   related = await fetchTrendingArticles(5);
        //   console.log(
        //     "Trending articles fetched:",
        //     related?.length || 0,
        //     "articles"
        //   );
        // }

        console.log("Final articles data:", related);
        setRelatedArticles(related);
        setCurrentRelatedIndex(-1); // Reset index when article changes
      } catch (err) {
        console.error("Error loading related articles:", err);
        setRelatedArticles([]);
      }
    };

    loadRelatedArticles();
  }, [id]);

  useEffect(() => {
    if (article && paywallEnabled) {
      // Check if user is authenticated before showing paywall
      if (isAuthenticated) {
        console.log(
          "[ArticleScreen] Paywall NOT shown - User is authenticated",
          {
            articleId: id,
            userId: user?.userId,
            userEmail: user?.email,
          }
        );
        return;
      }

      console.log(
        "[ArticleScreen] Scheduling paywall to show in 2 seconds - User not authenticated",
        {
          articleId: id,
          paywallEnabled,
        }
      );

      // Show paywall after 2 seconds for unauthenticated users
      const timer = setTimeout(() => {
        console.log("[ArticleScreen] Showing paywall now", {
          articleId: id,
        });
        setShowPaywall(true);
      }, 2000);

      return () => {
        console.log("[ArticleScreen] Clearing paywall timer", {
          articleId: id,
        });
        clearTimeout(timer);
      };
    } else {
      if (!article) {
        console.log("[ArticleScreen] Paywall NOT shown - No article loaded");
      }
      if (!paywallEnabled) {
        console.log(
          "[ArticleScreen] Paywall NOT shown - Paywall disabled in debug settings"
        );
      }
    }
  }, [article, paywallEnabled, isAuthenticated, id, user]);

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

  // Handle swipe to next related article
  const handleSwipeToNextArticle = () => {
    console.log("handleSwipeToNextArticle called");
    console.log("Related articles:", relatedArticles.length);
    console.log("Current index:", currentRelatedIndex);

    if (relatedArticles.length === 0) {
      console.log("No related articles available");
      return;
    }

    const nextIndex = currentRelatedIndex + 1;
    console.log("Next index:", nextIndex);

    if (nextIndex >= relatedArticles.length) {
      console.log("At the end of related articles");
      // At the end of related articles, provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const nextArticle = relatedArticles[nextIndex];
    console.log("Next article:", nextArticle);

    if (nextArticle?.id) {
      console.log("Navigating to article:", nextArticle.id);
      // Haptic feedback for successful navigation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Update index
      setCurrentRelatedIndex(nextIndex);

      // Navigate to next article
      router.push(`/article/${nextArticle.id}`);
    } else {
      console.log("Next article has no ID");
    }
  };

  // Create pan gesture for swipe detection
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Activate when horizontal movement exceeds 20px
    .failOffsetY([-15, 15]) // Fail if vertical movement exceeds 15px (prioritize horizontal)
    .onStart(() => {
      console.log("Gesture started");
    })
    .onUpdate((event) => {
      console.log("Gesture update:", {
        translationX: event.translationX,
        velocityX: event.velocityX,
      });
    })
    .onEnd((event) => {
      const { translationX, velocityX } = event;

      console.log("Swipe ended:", { translationX, velocityX });

      // Detect left swipe (negative X direction)
      // Require sufficient velocity and distance
      if (translationX < -50 && velocityX < -500) {
        console.log("Left swipe triggered!");
        handleSwipeToNextArticle();
      }
    })
    .runOnJS(true);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: contentBackground }]}
      >
        <ThemedView
          style={[styles.centerContent, { backgroundColor: contentBackground }]}
        >
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
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {/* Fixed Header Image */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <FadeInImage
            source={{ uri: article.imageUrl }}
            style={styles.headerImage}
          />
        </Animated.View>

        {/* Back Button */}
        <Animated.View style={[styles.backButtonTop, backButtonAnimatedStyle]}>
          <TouchableOpacity
            style={[
              styles.backButtonContainer,
              {
                backgroundColor: Colors[colorScheme].contentBackButtonBg,
              },
            ]}
            onPress={() => router.back()}
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
        </Animated.View>

        {/* Swipe Indicator */}
        {/* {relatedArticles.length > 0 &&
          currentRelatedIndex < relatedArticles.length - 1 && (
            <View style={styles.swipeIndicator}>
              <ThemedText style={styles.swipeIndicatorText}>
                ← Swipe for next article
              </ThemedText>
              {currentRelatedIndex >= 0 && (
                <ThemedText style={styles.swipeProgress}>
                  {currentRelatedIndex + 2} of {relatedArticles.length}
                </ThemedText>
              )}
            </View>
          )} */}

        {/* Scrollable Content */}
        <Animated.ScrollView
          ref={scrollViewRef}
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
          <View
            style={[
              styles.contentContainer,
              {
                backgroundColor: Colors[colorScheme].contentBackground,
              },
            ]}
          >
            <View style={styles.metaContainer}>
              <Text
                style={[
                  styles.timestamp,
                  {
                    color: Colors[colorScheme].contentMetaText,
                    fontFamily: brandConfig?.theme.fonts.primaryMedium,
                  },
                ]}
              >
                {article.timestamp?.toUpperCase() || "65 DAYS AGO"}
              </Text>
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: Colors[colorScheme].contentTitleText,
                  fontFamily: brandConfig?.theme.fonts.primaryBold,
                },
              ]}
            >
              {article.title}
            </Text>

            {article.subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: Colors[colorScheme].contentTitleText,
                    fontFamily: brandConfig?.theme.fonts.primaryBold,
                  },
                ]}
              >
                {article.subtitle}
              </Text>
            )}

            <Text
              style={[
                styles.leadText,
                {
                  color: Colors[colorScheme].contentTitleText,
                  fontFamily: brandConfig?.theme.fonts.primaryBold,
                },
              ]}
            >
              {article.leadText}
            </Text>

            {/* Banner Ad below lead text */}
            <BannerAd
              showLoadingIndicator={true}
              showErrorMessage={false}
              onAdLoaded={() => console.log("Banner ad loaded successfully")}
              onAdFailedToLoad={(error) =>
                console.log("Banner ad failed to load:", error)
              }
              size={AdSizes.MEDIUM_RECTANGLE}
              style={styles.bannerAd}
            />

            <ThemedView style={styles.divider} />

            {/* Render content based on type */}
            {renderContent()}

            {/* Trending Articles Section */}
            <TrendingArticles />
          </View>
        </Animated.ScrollView>

        <PaywallBottomSheet
          visible={showPaywall}
          onClose={handleClosePaywall}
          onSubscribe={handleSubscribe}
          onSignIn={handleSignIn}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 16,
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
  },
  backButtonText: {
    fontSize: 12,
    paddingTop: 4,
    lineHeight: 12,
    fontWeight: "600" as "600",
    textTransform: "uppercase" as "uppercase",
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
    marginBottom: 18,
  },
  timestamp: {
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
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700" as "700",
    marginBottom: 18,
  },
  leadText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400" as "400",
    marginBottom: 20,
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
  swipeIndicator: {
    position: "absolute",
    top: 100,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  swipeIndicatorText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  swipeProgress: {
    color: "white",
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
});
