import { AccessCheckDebugInfo } from "@/components/AccessCheckDebugInfo";
import { ArticleDetailSkeleton } from "@/components/ArticleDetailSkeleton";
import { ArticleHeader } from "@/components/ArticleHeader";
import { DisplayAd } from "@/components/DisplayAd";
import { FadeInImage } from "@/components/FadeInImage";
import { PaywallBottomSheet } from "@/components/PaywallBottomSheet";
import { RichContentRenderer } from "@/components/RichContentRenderer";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

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
    fallbackUrl,
    isSlug,
  } = useLocalSearchParams<{
    id: string;
    source?: string;
    previewTitle?: string;
    previewImage?: string;
    previewCategory?: string;
    previewDate?: string;
    fallbackUrl?: string;
    isSlug?: string;
  }>();
  const { user, isAuthenticated, login } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const { brandConfig } = useBrandConfig();
  const styles = useArticleStyleContext();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedArticleId, setResolvedArticleId] = useState<string>("");

  // Check if we have preview data to show immediately
  const hasPreviewData = !!previewTitle;

  // Use preview data while loading, then switch to full article data
  const displayTitle = article?.title || previewTitle;
  const displayCategory = article?.category || previewCategory;
  const displayDate = article?.publishDate || article?.timestamp || previewDate;
  const insets = useSafeAreaInsets();
  const contentBackground = useThemeColor({}, "contentBackground");

  // Access control for paywall - use resolved article ID, not the slug
  const {
    isAllowed,
    shouldShowPaywall,
    recheckAccess,
    isChecking: isCheckingAccess,
    error: accessError,
    response: accessResponse,
  } = useArticleAccess(resolvedArticleId);
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

      try {
        setLoading(true);
        setError(null);

        let articleId = id;

        // If this is a slug (not a numeric ID), resolve it first
        if (isSlug === "true" || isNaN(Number(id))) {
          console.log("🔗 Resolving slug to article ID:", id);
          try {
            const { getPostBySlug } = await import("@/services/api");
            const result = await getPostBySlug(id);
            articleId = result.id.toString();
            console.log("🔗 ✅ Resolved slug to article ID:", articleId);
            // Set the resolved article ID for access check
            setResolvedArticleId(articleId);
          } catch (slugError) {
            console.error("❌ Failed to resolve slug:", slugError);
            // If slug resolution fails and we have a fallback URL, redirect to webview
            if (fallbackUrl) {
              console.log(
                "🔗 Redirecting to webview with fallback URL:",
                fallbackUrl
              );
              router.replace(`/webview?url=${encodeURIComponent(fallbackUrl)}`);
              return;
            }
            throw new Error("Failed to resolve article slug");
          }
        } else {
          // If it's already a numeric ID, set it immediately
          setResolvedArticleId(articleId);
        }

        console.log("📰 Loading article with ID:", articleId);

        // Fetch the complete article with content in one API call
        const fetchSingleArticle = (await import("@/services/api"))
          .fetchSingleArticle;
        const fullArticle = await fetchSingleArticle(articleId);

        setArticle(fullArticle);

        // Debug: Check if author_data is present
        console.log("Article loaded - author_data:", fullArticle.author_data);

        // Track screen_view with source parameter
        analyticsService.logScreenView("Article Detail", "ArticleScreen", {
          article_id: articleId,
          article_title: fullArticle.title,
          source: source || "direct",
        });

        // Track article_view custom event
        analyticsService.logArticleView(
          articleId,
          fullArticle.title,
          fullArticle.category
        );

        // Track article view with Miso
        const anonymousId = await getAnonymousId();
        trackArticleView({
          articleId: articleId,
          userId: user?.userId,
          isAuthenticated,
          anonymousId,
        });
      } catch (err) {
        console.error("❌ Error loading article:", err);

        // If we have a fallback URL, redirect to webview
        if (fallbackUrl) {
          console.log(
            "🔗 Article load failed, redirecting to webview:",
            fallbackUrl
          );
          router.replace(`/webview?url=${encodeURIComponent(fallbackUrl)}`);
          return;
        }

        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id, isAuthenticated, user?.userId]);

  // Fetch recommended articles for swipe navigation using Miso's user_to_products API
  useEffect(() => {
    const loadRecommendedArticles = async () => {
      if (!id || !article) {
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
   * Handle paywall close - always navigate to home tab
   */
  const handleClosePaywall = async () => {
    console.log("ℹ️ User closed paywall, navigating to home");

    analyticsService.logEvent("article_paywall_dismissed", {
      article_id: id,
      article_title: article?.title,
    });

    // Always navigate to home tab - works in all scenarios
    // Whether app was running or opened from closed state
    const canGoBack = await router.canGoBack();
    if (canGoBack) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
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
      <View style={styles.container}>
        {/* Header with consistent navigation */}
        <View style={[styles.headerContainer, { height: HEADER_HEIGHT }]}>
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
        </View>
        <ArticleHeader
          backButtonAnimatedStyle={backButtonAnimatedStyle}
          iconColor={styles.colors.contentBackButtonText}
          scrollY={scrollY}
          headerHeight={HEADER_HEIGHT}
        />
        <ThemedView
          style={[styles.centerContent, { backgroundColor: contentBackground }]}
        >
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading article...</ThemedText>
        </ThemedView>
      </View>
    );
  }

  // Only show error if we have an error AND no preview data to show
  if (error && !hasPreviewData) {
    return (
      <View style={styles.container}>
        {/* Header with consistent navigation */}
        <View style={[styles.headerContainer, { height: HEADER_HEIGHT }]}>
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
        </View>
        <ArticleHeader
          backButtonAnimatedStyle={backButtonAnimatedStyle}
          iconColor={styles.colors.contentBackButtonText}
          scrollY={scrollY}
          headerHeight={HEADER_HEIGHT}
        />
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="title">{error}</ThemedText>
        </ThemedView>
      </View>
    );
  }

  // Show error if article failed to load and we're done loading
  if (!loading && !article && !hasPreviewData) {
    return (
      <View style={styles.container}>
        {/* Header with consistent navigation */}
        <View style={[styles.headerContainer, { height: HEADER_HEIGHT }]}>
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
        </View>
        <ArticleHeader
          backButtonAnimatedStyle={backButtonAnimatedStyle}
          iconColor={styles.colors.contentBackButtonText}
          scrollY={scrollY}
          headerHeight={HEADER_HEIGHT}
        />
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="title">Article not found</ThemedText>
        </ThemedView>
      </View>
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

        {/* Consistent Article Header */}
        <ArticleHeader
          article={article}
          backButtonAnimatedStyle={backButtonAnimatedStyle}
          iconColor={styles.colors.contentBackButtonText}
          scrollY={scrollY}
          headerHeight={HEADER_HEIGHT}
          shareUrl={(() => {
            if (!article) return undefined;
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
          shareMessage={
            article
              ? extractTextFromStructured(article.leadText) ||
                article.subtitle ||
                ""
              : ""
          }
        />

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
          style={[styles.scrollView]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              // justifyContent: "center",
              alignItems: "center",
            },
          ]}
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
                paddingBottom: 40,
                maxWidth: brandConfig?.layout?.maxContentWidth,
              },
            ]}
          >
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
                      <Svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={styles.authorIconCompact}
                      >
                        <Path
                          d="M10.8244 9.93749C10.1105 8.70327 9.01038 7.81827 7.72647 7.39874C8.36155 7.02068 8.85497 6.44459 9.13095 5.75896C9.40693 5.07333 9.45021 4.31606 9.25416 3.60344C9.0581 2.89083 8.63354 2.26227 8.04568 1.8143C7.45782 1.36633 6.73916 1.12372 6.00007 1.12372C5.26097 1.12372 4.54231 1.36633 3.95445 1.8143C3.36659 2.26227 2.94203 2.89083 2.74598 3.60344C2.54992 4.31606 2.5932 5.07333 2.86918 5.75896C3.14517 6.44459 3.63858 7.02068 4.27366 7.39874C2.98975 7.81781 1.8896 8.70281 1.17569 9.93749C1.14951 9.98018 1.13215 10.0277 1.12462 10.0772C1.11709 10.1267 1.11956 10.1772 1.13187 10.2258C1.14419 10.2743 1.1661 10.3199 1.19631 10.3598C1.22653 10.3997 1.26443 10.4332 1.3078 10.4583C1.35116 10.4833 1.3991 10.4994 1.44879 10.5056C1.49848 10.5119 1.54891 10.5081 1.59711 10.4945C1.64531 10.4809 1.69029 10.4578 1.72942 10.4265C1.76854 10.3953 1.80101 10.3565 1.82491 10.3125C2.70803 8.78624 4.26897 7.87499 6.00007 7.87499C7.73116 7.87499 9.2921 8.78624 10.1752 10.3125C10.1991 10.3565 10.2316 10.3953 10.2707 10.4265C10.3098 10.4578 10.3548 10.4809 10.403 10.4945C10.4512 10.5081 10.5017 10.5119 10.5513 10.5056C10.601 10.4994 10.649 10.4833 10.6923 10.4583C10.7357 10.4332 10.7736 10.3997 10.8038 10.3598C10.834 10.3199 10.8559 10.2743 10.8683 10.2258C10.8806 10.1772 10.883 10.1267 10.8755 10.0772C10.868 10.0277 10.8506 9.98018 10.8244 9.93749ZM3.37507 4.49999C3.37507 3.98082 3.52902 3.4733 3.81746 3.04162C4.1059 2.60994 4.51587 2.27349 4.99552 2.07481C5.47518 1.87613 6.00298 1.82415 6.51218 1.92543C7.02138 2.02672 7.48911 2.27673 7.85622 2.64384C8.22333 3.01095 8.47334 3.47868 8.57463 3.98788C8.67591 4.49708 8.62393 5.02488 8.42525 5.50454C8.22657 5.98419 7.89012 6.39416 7.45844 6.6826C7.02676 6.97104 6.51924 7.12499 6.00007 7.12499C5.3041 7.12425 4.63685 6.84745 4.14473 6.35533C3.65261 5.8632 3.37581 5.19596 3.37507 4.49999Z"
                          fill={Colors[colorScheme].contentMetaText}
                        />
                      </Svg>
                      <Text
                        style={[
                          styles.authorNameCompact,
                          {
                            color: Colors[colorScheme].contentMetaText,
                            paddingRight: 10,
                            paddingLeft: 5,
                            fontFamily:
                              brandConfig?.theme.fonts.primarySemiBold,
                          },
                        ]}
                      >
                        {article.author_data.first_name}{" "}
                        {article.author_data.last_name}
                      </Text>
                      {article.author_data.bio && (
                        <Svg
                          width="12"
                          height="12"
                          viewBox="0 0 10 10"
                          fill="none"
                          style={{ marginLeft: 4 }}
                        >
                          <Path
                            d="M4.875 0C3.91082 0 2.96829 0.285914 2.1666 0.821586C1.36491 1.35726 0.740067 2.11863 0.371089 3.00942C0.00211226 3.90021 -0.094429 4.88041 0.093674 5.82607C0.281777 6.77172 0.746076 7.64036 1.42786 8.32215C2.10964 9.00393 2.97828 9.46823 3.92394 9.65633C4.86959 9.84443 5.84979 9.74789 6.74058 9.37891C7.63137 9.00994 8.39275 8.38509 8.92842 7.5834C9.46409 6.78171 9.75 5.83918 9.75 4.875C9.74864 3.58249 9.23458 2.34331 8.32064 1.42936C7.4067 0.515418 6.16751 0.00136492 4.875 0ZM4.875 9C4.05915 9 3.26163 8.75807 2.58327 8.30481C1.90492 7.85155 1.37621 7.20731 1.064 6.45357C0.751788 5.69982 0.670099 4.87042 0.829263 4.07025C0.988427 3.27008 1.3813 2.53508 1.95819 1.95818C2.53508 1.38129 3.27008 0.988425 4.07025 0.829261C4.87043 0.670097 5.69983 0.751785 6.45357 1.064C7.20732 1.37621 7.85155 1.90492 8.30481 2.58327C8.75807 3.26163 9 4.05915 9 4.875C8.99876 5.96864 8.56377 7.01713 7.79045 7.79045C7.01713 8.56376 5.96864 8.99876 4.875 9ZM5.625 7.125C5.625 7.22446 5.58549 7.31984 5.51517 7.39017C5.44484 7.46049 5.34946 7.5 5.25 7.5C5.05109 7.5 4.86032 7.42098 4.71967 7.28033C4.57902 7.13968 4.5 6.94891 4.5 6.75V4.875C4.40055 4.875 4.30516 4.83549 4.23484 4.76516C4.16451 4.69484 4.125 4.59946 4.125 4.5C4.125 4.40054 4.16451 4.30516 4.23484 4.23484C4.30516 4.16451 4.40055 4.125 4.5 4.125C4.69891 4.125 4.88968 4.20402 5.03033 4.34467C5.17098 4.48532 5.25 4.67609 5.25 4.875V6.75C5.34946 6.75 5.44484 6.78951 5.51517 6.85983C5.58549 6.93016 5.625 7.02554 5.625 7.125ZM4.125 2.8125C4.125 2.70125 4.15799 2.59249 4.2198 2.49999C4.28161 2.40749 4.36946 2.33539 4.47224 2.29282C4.57503 2.25024 4.68813 2.2391 4.79724 2.26081C4.90635 2.28251 5.00658 2.33609 5.08525 2.41475C5.16392 2.49342 5.21749 2.59365 5.23919 2.70276C5.2609 2.81188 5.24976 2.92498 5.20718 3.02776C5.16461 3.13054 5.09251 3.21839 5.00001 3.2802C4.90751 3.34201 4.79875 3.375 4.6875 3.375C4.53832 3.375 4.39524 3.31574 4.28975 3.21025C4.18427 3.10476 4.125 2.96168 4.125 2.8125Z"
                            fill={Colors[colorScheme].contentMetaText}
                          />
                        </Svg>
                      )}
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
                    <View
                      style={[
                        styles.authorBioContainer,
                        { backgroundColor: Colors[colorScheme].highlightBoxBg },
                      ]}
                    >
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
