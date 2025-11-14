import { AccessCheckDebugInfo } from "@/components/AccessCheckDebugInfo";
import { ArticleDetailSkeleton } from "@/components/ArticleDetailSkeleton";
import BookmarkButton from "@/components/BookmarkButton";
import { DisplayAd } from "@/components/DisplayAd";
import { FadeInImage } from "@/components/FadeInImage";
import { PaywallBottomSheet } from "@/components/PaywallBottomSheet";
import { RichContentRenderer } from "@/components/RichContentRenderer";
import ShareButton from "@/components/ShareButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TrendingArticles from "@/components/TrendingArticles";
import { Colors } from "@/constants/Colors";
import {
  ArticleStyleProvider,
  useArticleStyleContext,
} from "@/contexts/ArticleStyleContext";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

function ArticleScreenContent() {
  const {
    id,
    source,
    previewTitle,
    previewImage,
    previewCategory,
    previewDate,
  } = useLocalSearchParams<{
    id: string;
    source?: string;
    previewTitle?: string;
    previewImage?: string;
    previewCategory?: string;
    previewDate?: string;
  }>();
  const { user, isAuthenticated, login } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const { brandConfig } = useBrandConfig();
  const styles = useArticleStyleContext();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we have preview data to show immediately
  const hasPreviewData = !!previewTitle;

  // Use preview data while loading, then switch to full article data
  const displayTitle = article?.title || previewTitle;
  const displayCategory = article?.category || previewCategory;
  const displayDate = article?.publishDate || article?.timestamp || previewDate;
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
  const [showAuthorBio, setShowAuthorBio] = useState(false);

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

        // Debug: Check if author_data is present
        console.log("Article loaded - author_data:", fullArticle.author_data);

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

  // Helper function to extract plain text from structured content
  const extractTextFromStructured = (
    content: string | StructuredContentNode[]
  ): string => {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";

    let text = "";
    const extractText = (nodes: StructuredContentNode[]): void => {
      for (const node of nodes) {
        if (node.text) {
          text += node.text;
        }
        if (node.children) {
          extractText(node.children);
        }
      }
    };
    extractText(content);
    return text.trim();
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

  // Show loading state only if we don't have preview data
  if (loading && !hasPreviewData) {
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

  // Only show error if we have an error AND no preview data to show
  if (error && !hasPreviewData) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="title">{error}</ThemedText>
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

  // Show error if article failed to load and we're done loading
  if (!loading && !article && !hasPreviewData) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="title">Article not found</ThemedText>
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
        {/* Fixed Header Image - Show skeleton while loading, then high-res image */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          {article?.imageUrl ? (
            <FadeInImage
              source={{ uri: article.imageUrl }}
              style={styles.headerImage}
              fadeDuration={300}
            />
          ) : (
            <View
              style={[
                styles.headerImage,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            />
          )}
        </Animated.View>

        {/* Back Button */}
        <Animated.View style={[styles.backButtonTop, backButtonAnimatedStyle]}>
          <TouchableOpacity
            style={[styles.backButtonContainer, { marginTop: insets.top }]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={10}
              color={styles.colors.contentBackButtonText}
            />
            <Text style={styles.backButtonText}>BACK</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Action Buttons (Share & Bookmark) */}
        <Animated.View style={[styles.shareButtonTop, backButtonAnimatedStyle]}>
          <View
            style={[styles.shareButtonContainer, { marginTop: insets.top }]}
          >
            {article && (
              <>
                <BookmarkButton
                  article={article}
                  iconColor={styles.colors.contentBackButtonText}
                  iconSize={24}
                />
                <ShareButton
                  title={article.title}
                  message={
                    extractTextFromStructured(article.leadText) ||
                    article.subtitle ||
                    ""
                  }
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
                  iconColor={styles.colors.contentBackButtonText}
                  iconSize={20}
                />
              </>
            )}
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
          <View style={[styles.contentContainer, { paddingBottom: 40 }]}>
            {/* Show preview data with skeleton while loading */}
            {loading && hasPreviewData && (
              <>
                {/* Preview metadata */}
                <View style={styles.metaContainer}>
                  <View />
                  {displayDate && (
                    <Text
                      style={[
                        styles.timestamp,
                        {
                          color: Colors[colorScheme].contentMetaText,
                          fontFamily: brandConfig?.theme.fonts.primaryMedium,
                        },
                      ]}
                    >
                      {displayDate.toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Preview title */}
                <Text
                  style={[
                    styles.title,
                    {
                      color: Colors[colorScheme].contentTitleText,
                      fontFamily: brandConfig?.theme.fonts.primaryBold,
                    },
                  ]}
                >
                  {displayTitle}
                </Text>

                {/* Skeleton for rest of content */}
                <ArticleDetailSkeleton />
              </>
            )}

            {/* Show full article content when loaded */}
            {!loading && article && (
              <>
                {/* Author and Date Row */}
                <View style={styles.metaContainer}>
                  {/* Author Info - Left Side */}
                  {article.author_data && article.author_data.last_name ? (
                    <TouchableOpacity
                      style={styles.authorInfoCompact}
                      onPress={() => setShowAuthorBio(!showAuthorBio)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="account-edit"
                        size={18}
                        color={Colors[colorScheme].contentMetaText}
                        style={styles.authorIconCompact}
                      />
                      <Text
                        style={[
                          styles.authorNameCompact,
                          {
                            color: Colors[colorScheme].contentMetaText,
                            fontFamily:
                              brandConfig?.theme.fonts.primarySemiBold,
                          },
                        ]}
                      >
                        {article.author_data.first_name}{" "}
                        {article.author_data.last_name}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  {/* Date - Right Side */}
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
                      ? formatArticleDetailDate(
                          article.publishDate
                        ).toUpperCase()
                      : article.timestamp?.toUpperCase() || "RECENTLY"}
                  </Text>
                </View>

                {/* Author Bio - Expandable */}
                {article.author_data &&
                  article.author_data.last_name &&
                  showAuthorBio &&
                  article.author_data.bio && (
                    <View style={styles.authorBioContainer}>
                      <Text
                        style={[
                          styles.authorBio,
                          {
                            color: Colors[colorScheme].contentMetaText,
                            fontFamily: brandConfig?.theme.fonts.primary,
                          },
                        ]}
                      >
                        {article.author_data.bio}
                      </Text>
                    </View>
                  )}

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

                {/* Render leadText - support both string and structured content */}
                {article.leadText && (
                  <>
                    {Array.isArray(article.leadText) ? (
                      <>
                        <RichContentRenderer
                          content={article.leadText as StructuredContentNode[]}
                          style={styles.leadText}
                          articleId={id}
                          textStyleOverride="leadText"
                        />
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.leadText,
                          {
                            color: Colors[colorScheme].contentTitleText,
                            fontFamily: brandConfig?.theme.fonts.primaryBold,
                          },
                        ]}
                        allowFontScaling={false}
                      >
                        {article.leadText}
                      </Text>
                    )}
                  </>
                )}
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
              </>
            )}
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

// Wrapper component that provides article styles via context
export default function ArticleScreen() {
  return (
    <ArticleStyleProvider>
      <ArticleScreenContent />
    </ArticleStyleProvider>
  );
}
