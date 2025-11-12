import { AccessCheckDebugInfo } from "@/components/AccessCheckDebugInfo";
import { DisplayAd } from "@/components/DisplayAd";
import { FadeInImage } from "@/components/FadeInImage";
import { PaywallBottomSheet } from "@/components/PaywallBottomSheet";
import { RichContentRenderer } from "@/components/RichContentRenderer";
import ShareButton from "@/components/ShareButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TrendingArticles from "@/components/TrendingArticles";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useArticleAccess } from "@/hooks/useArticleAccess";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import { getAnonymousId } from "@/services/anonymousId";
import { formatArticleDetailDate } from "@/services/api/utils/formatters";
import { displayAdManager } from "@/services/displayAdManager";
import { trackArticleView } from "@/services/miso";
import { Article, StructuredContentNode } from "@/types";
import { Ionicons } from "@expo/vector-icons";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const HEADER_HEIGHT = screenHeight * 0.4;

export default function ArticleScreen() {
  const { id, source } = useLocalSearchParams<{
    id: string;
    source?: string;
  }>();
  const { user, isAuthenticated, login } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const { brandConfig } = useBrandConfig();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const contentBackground = useThemeColor({}, "contentBackground");

  // Access control for paywall
  const {
    isAllowed,
    shouldShowPaywall,
    recheckAccess,
    isChecking: isCheckingAccess,
    error: accessError,
    response: accessResponse,
  } = useArticleAccess(id || "");
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Initialize display ad manager
  useEffect(() => {
    if (brandConfig?.displayAds) {
      displayAdManager.initialize(brandConfig.displayAds);
    }
  }, [brandConfig]);

  // Check if after_lead ad should be shown
  const afterLeadAdPosition =
    brandConfig?.displayAds?.articleDetail?.positions?.find(
      (pos) => pos.type === "after_lead" && pos.enabled
    );

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

        // Track screen_view with source parameter
        analyticsService.logScreenView("Article Detail", "ArticleScreen", {
          article_id: id,
          article_title: fullArticle.title,
          source: source || "direct",
        });

        // Track article_view custom event
        analyticsService.logArticleView(
          id,
          fullArticle.title,
          fullArticle.category
        );

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

  // Fetch recommended articles for swipe navigation using Miso's user_to_products API
  useEffect(() => {
    const loadRecommendedArticles = async () => {
      if (!id) {
        console.log("No article ID for fetching recommended articles");
        return;
      }

      console.log("Fetching recommended articles for swipe navigation");
      try {
        const { fetchRecommendedArticles } = await import("@/services/api");
        const recommended = await fetchRecommendedArticles(
          5,
          user?.userId,
          isAuthenticated
        );
        console.log(
          "Recommended articles fetched:",
          recommended?.length || 0,
          "articles"
        );

        setRelatedArticles(recommended);
        setCurrentRelatedIndex(-1); // Reset index when article changes
      } catch (err) {
        console.error("Error loading recommended articles:", err);
        setRelatedArticles([]);
      }
    };

    loadRecommendedArticles();
  }, [id, user?.userId, isAuthenticated]);

  // Show paywall when access is denied
  useEffect(() => {
    if (shouldShowPaywall && article && !paywallVisible) {
      console.log("🚫 Access denied, showing paywall for article:", id);
      setPaywallVisible(true);

      // Track paywall shown event
      analyticsService.logEvent("article_paywall_shown", {
        article_id: id,
        article_title: article.title,
        source: source || "direct",
      });
    }
  }, [shouldShowPaywall, article, id, source, paywallVisible]);

  // Hide paywall when access is granted
  useEffect(() => {
    console.log("📊 Access state for paywall visibility:", {
      isAllowed,
      paywallVisible,
      shouldShowPaywall,
      articleId: id,
    });

    if (isAllowed && paywallVisible) {
      console.log("✅ Access granted, hiding paywall for article:", id);
      setPaywallVisible(false);

      // Track paywall dismissed due to access granted
      analyticsService.logEvent("article_paywall_access_granted", {
        article_id: id,
        article_title: article?.title,
      });
    }
  }, [isAllowed, paywallVisible, id, article]);

  /**
   * Handle paywall close - navigate back to previous screen
   */
  const handleClosePaywall = () => {
    console.log("ℹ️ User closed paywall, navigating back");

    analyticsService.logEvent("article_paywall_dismissed", {
      article_id: id,
      article_title: article?.title,
    });

    // Navigate back to previous screen (e.g., highlights carousel)
    router.back();
  };

  /**
   * Handle subscribe button press
   */
  const handleSubscribe = () => {
    console.log("💳 User clicked subscribe from paywall");

    analyticsService.logEvent("article_paywall_subscribe_clicked", {
      article_id: id,
      article_title: article?.title,
    });

    // PaywallBottomSheet handles opening the subscription URL
  };

  /**
   * Handle sign in button press
   */
  const handleSignIn = async () => {
    console.log("🔐 User clicked sign in from paywall");

    analyticsService.logEvent("article_paywall_signin_clicked", {
      article_id: id,
      article_title: article?.title,
    });

    // Start login flow (don't close paywall yet - let auth success handle it)
    await login();
  };

  /**
   * Handle authentication success
   * This is called by PaywallBottomSheet when user successfully authenticates
   */
  const handleAuthSuccess = async () => {
    console.log("🔐 Authentication successful, rechecking access");

    analyticsService.logEvent("article_paywall_auth_success", {
      article_id: id,
      article_title: article?.title,
    });

    // Manually trigger access recheck with a small delay to ensure token is available
    setTimeout(async () => {
      console.log("🔄 Triggering manual access recheck after auth");
      await recheckAccess();
    }, 200);
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
          articleId={id}
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
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme].contentBackground },
        ]}
      >
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
                marginTop: insets.top,
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

        {/* Share Button */}
        <Animated.View style={[styles.shareButtonTop, backButtonAnimatedStyle]}>
          <View
            style={[
              styles.shareButtonContainer,
              {
                backgroundColor: Colors[colorScheme].contentBackButtonBg,
                marginTop: insets.top,
              },
            ]}
          >
            <ShareButton
              title={article.title}
              message={article.leadText || article.subtitle || ""}
              url={(() => {
                // Use article.link from API, or construct fallback URL
                const fallbackUrl = brandConfig?.domain
                  ? `${brandConfig.domain}${
                      brandConfig.domain.endsWith("/") ? "" : "/"
                    }article/${id}`
                  : `article/${id}`;
                const shareUrl = article.link || fallbackUrl;
                console.log("[ArticleScreen] Share URL:", {
                  articleLink: article.link,
                  brandDomain: brandConfig?.domain,
                  articleId: id,
                  fallbackUrl,
                  finalUrl: shareUrl,
                });
                return shareUrl;
              })()}
              iconColor={Colors[colorScheme].contentBackButtonText}
              iconSize={20}
            />
          </View>
        </Animated.View>

        {/* Access Check Debug Info - Fixed position below header */}
        <View
          style={[
            styles.debugInfoContainer,
            {
              top: 120,
            },
          ]}
        >
          <AccessCheckDebugInfo
            response={accessResponse}
            isChecking={isCheckingAccess}
            isAllowed={isAllowed}
            error={accessError}
          />
        </View>

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
                paddingBottom: 40,
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
                {article.publishDate
                  ? formatArticleDetailDate(article.publishDate).toUpperCase()
                  : article.timestamp?.toUpperCase() || "RECENTLY"}
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

            {/* Display ad after lead text if configured */}
            {afterLeadAdPosition && (
              <DisplayAd
                context="article_detail"
                size={afterLeadAdPosition.size}
                onAdLoaded={() => console.log("After-lead ad loaded")}
              />
            )}

            {/* Render content - in-content ads are injected by RichContentRenderer */}
            {renderContent()}

            {/* Trending Articles Section */}
            <TrendingArticles />
          </View>
        </Animated.ScrollView>

        <PaywallBottomSheet
          visible={paywallVisible}
          onClose={handleClosePaywall}
          onSubscribe={handleSubscribe}
          onSignIn={handleSignIn}
          onAuthSuccess={handleAuthSuccess}
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
    top: 8,
    left: 16,
    zIndex: 10,
  },
  shareButtonTop: {
    position: "absolute",
    top: 8,
    right: 16,
    zIndex: 10,
  },
  debugInfoContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 5,
  },
  shareButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginTop: 16,
    paddingVertical: 4,
    borderRadius: 8,
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
    padding: 16,
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
    ...getCenteredContentStyle(),
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
    fontSize: 22,
    lineHeight: 26,
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
