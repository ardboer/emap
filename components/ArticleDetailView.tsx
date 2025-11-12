import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useArticleAccess } from "@/hooks/useArticleAccess";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { analyticsService } from "@/services/analytics";
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
import { PaywallBottomSheet } from "./PaywallBottomSheet";
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
  const { login } = useAuth();
  const { isAllowed, shouldShowPaywall, recheckAccess } =
    useArticleAccess(articleId);
  const [paywallVisible, setPaywallVisible] = useState(false);

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

  // Show paywall when access is denied
  useEffect(() => {
    if (shouldShowPaywall && !paywallVisible) {
      console.log("🚫 Access denied, showing paywall for article:", articleId);
      setPaywallVisible(true);

      // Track paywall shown event
      analyticsService.logEvent("article_paywall_shown", {
        article_id: articleId,
        edition_id: editionId,
        source: "article_detail",
      });
    }
  }, [shouldShowPaywall, paywallVisible, articleId, editionId]);

  // Hide paywall when access is granted
  useEffect(() => {
    console.log("📊 Access state for paywall visibility:", {
      isAllowed,
      paywallVisible,
      shouldShowPaywall,
      articleId,
    });

    if (isAllowed && paywallVisible) {
      console.log("✅ Access granted, hiding paywall for article:", articleId);
      setPaywallVisible(false);

      // Track paywall dismissed due to access granted
      analyticsService.logEvent("article_paywall_access_granted", {
        article_id: articleId,
        edition_id: editionId,
      });
    }
  }, [isAllowed, paywallVisible, articleId, editionId]);

  /**
   * Handle paywall close
   */
  const handlePaywallClose = useCallback(() => {
    console.log("ℹ️ User closed paywall");
    setPaywallVisible(false);

    analyticsService.logEvent("article_paywall_dismissed", {
      article_id: articleId,
      edition_id: editionId,
    });
  }, [articleId, editionId]);

  /**
   * Handle subscribe button press
   */
  const handleSubscribe = useCallback(() => {
    console.log("💳 User clicked subscribe from paywall");

    analyticsService.logEvent("article_paywall_subscribe_clicked", {
      article_id: articleId,
      edition_id: editionId,
    });

    // PaywallBottomSheet handles opening the subscription URL
  }, [articleId, editionId]);

  /**
   * Handle sign in button press
   */
  const handleSignIn = useCallback(async () => {
    console.log("🔐 User clicked sign in from paywall");

    analyticsService.logEvent("article_paywall_signin_clicked", {
      article_id: articleId,
      edition_id: editionId,
    });

    // Start login flow (don't close paywall yet - let auth success handle it)
    await login();
  }, [login, articleId, editionId]);

  /**
   * Handle authentication success
   * This is called by PaywallBottomSheet when user successfully authenticates
   */
  const handleAuthSuccess = useCallback(async () => {
    console.log("🔐 Authentication successful, rechecking access");

    analyticsService.logEvent("article_paywall_auth_success", {
      article_id: articleId,
      edition_id: editionId,
    });

    // Manually trigger access recheck with a small delay to ensure token is available
    setTimeout(async () => {
      console.log("🔄 Triggering manual access recheck after auth");
      await recheckAccess();
    }, 200);
  }, [recheckAccess, articleId, editionId]);

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
        contentContainerStyle={[styles.content, getCenteredContentStyle()]}
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

      {/* Paywall Bottom Sheet */}
      <PaywallBottomSheet
        visible={paywallVisible}
        onClose={handlePaywallClose}
        onSubscribe={handleSubscribe}
        onSignIn={handleSignIn}
        onAuthSuccess={handleAuthSuccess}
      />
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
