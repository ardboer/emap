import GradientHeader from "@/components/GradientHeader";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { analyticsService } from "@/services/analytics";
import { getUserInfo } from "@/services/auth";
import {
  createWebViewLinkInterceptor,
  getLinkInterceptorConfig,
  handleLinkPress,
} from "@/utils/linkInterceptor";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";

export default function AskScreen() {
  const {
    brandConfig,
    loading: brandLoading,
    error: brandError,
  } = useBrandConfig();
  // Get search params from route (for AI search links)
  const routeParams = useLocalSearchParams<{ q?: string; qs?: string }>();
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const hasInitiallyLoaded = useRef(false);
  // Android needs dynamic height, iOS works with flex
  const [webViewHeight, setWebViewHeight] = useState(600);
  const previousHeight = useRef<number>(600);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await getUserInfo();
        if (userInfo?.user_id) {
          setUserId(userInfo.user_id);
          console.log("✅ User ID loaded for Ask webview:", userInfo.user_id);
        } else {
          console.log("ℹ️ No user ID available (user not logged in)");
        }
      } catch (error) {
        console.error("❌ Error fetching user info:", error);
      }
    };
    fetchUserInfo();
  }, []);

  // Construct the dynamic URL based on brand configuration, user ID, and search params
  const webViewUrl = useMemo(() => {
    if (!brandConfig) return null;

    let url = `${brandConfig.apiConfig.baseUrl}/mobile-app-ai-search/?hash=${brandConfig.apiConfig.hash}`;

    // Add user_id if available
    if (userId) {
      url += `&user_id=${userId}`;
    }

    // Add search params if provided via route (from AI search links)
    if (routeParams.q) {
      url += `&q=${encodeURIComponent(routeParams.q)}`;
      console.log("🔍 Adding search query to Ask URL:", routeParams.q);
    }
    if (routeParams.qs) {
      url += `&qs=${encodeURIComponent(routeParams.qs)}`;
      console.log("🔍 Adding search source to Ask URL:", routeParams.qs);
    }

    console.log("Ask webviewUrl", url);
    return url;
  }, [brandConfig, userId, routeParams.q, routeParams.qs]);

  // Create a unique key for WebView to force reload when URL changes
  const webViewKey = useMemo(() => webViewUrl, [webViewUrl]);

  // Get link interceptor configuration
  const linkInterceptorConfig = useMemo(
    () => getLinkInterceptorConfig(brandConfig),
    [brandConfig]
  );

  // Generate link interceptor JavaScript
  const linkInterceptorJS = useMemo(
    () => createWebViewLinkInterceptor(linkInterceptorConfig.domains),
    [linkInterceptorConfig.domains]
  );

  // Track screen view when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!brandLoading && brandConfig) {
        analyticsService.logScreenView("Ask", "AskScreen");
      }
    }, [brandLoading, brandConfig])
  );

  // Show loading state while brand config is loading
  if (brandLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Show error state if brand config failed to load
  if (brandError || !brandConfig) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText style={styles.errorTitle}>
            Unable to load Ask feature
          </ThemedText>
          <ThemedText style={styles.errorMessage}>
            {brandError || "Brand configuration not available"}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Show error state if webview URL construction failed
  if (!webViewUrl) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText style={styles.errorTitle}>Configuration Error</ThemedText>
          <ThemedText style={styles.errorMessage}>
            Unable to construct Ask URL for {brandConfig.displayName}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Show webview error state
  if (webViewError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText style={styles.errorTitle}>
            Failed to load Ask feature
          </ThemedText>
          <ThemedText style={styles.errorMessage}>{webViewError}</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const handleSearchPress = () => {
    router.push("/search");
  };

  return (
    <ThemedView style={styles.container}>
      <GradientHeader
        onSearchPress={handleSearchPress}
        showUserIcon={true}
        onUserPress={() => setSettingsDrawerVisible(true)}
      />
      {webViewLoading && (
        <ThemedView style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading Ask...</ThemedText>
        </ThemedView>
      )}

      {Platform.OS === "android" ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <WebView
            key={webViewKey}
            source={{ uri: webViewUrl }}
            style={[styles.webView, { height: webViewHeight }]}
            onLoadStart={() => {
              // Only show loading overlay on initial load
              if (!hasInitiallyLoaded.current) {
                console.log("WebView: Initial load started");
                setWebViewLoading(true);
                setWebViewError(null);
              }
            }}
            onLoadEnd={() => {
              // Mark as initially loaded and hide overlay
              if (!hasInitiallyLoaded.current) {
                console.log("WebView: Initial load completed");
                hasInitiallyLoaded.current = true;
              }
              setWebViewLoading(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView error:", nativeEvent);
              setWebViewLoading(false);
              setWebViewError(
                `Failed to load: ${nativeEvent.description || "Unknown error"}`
              );
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView HTTP error:", nativeEvent);
              setWebViewLoading(false);
              setWebViewError(
                `HTTP Error ${nativeEvent.statusCode}: ${
                  nativeEvent.description || "Server error"
                }`
              );
            }}
            onShouldStartLoadWithRequest={(request) => {
              // Intercept navigation requests
              const url = request.url;
              console.log("🔗 Ask WebView navigation request:", url);

              // Allow the initial load
              if (url === webViewUrl) {
                return true;
              }

              // Check if it's a domain link
              if (
                linkInterceptorConfig.domains.some((domain) => {
                  const normalizedDomain = domain.replace(
                    /^(https?:\/\/)?(www\.)?/,
                    ""
                  );
                  return url.includes(normalizedDomain);
                })
              ) {
                console.log(
                  "🔗 Domain link detected in navigation, intercepting"
                );
                // Prevent WebView navigation and handle in React Native
                handleLinkPress(url, linkInterceptorConfig);
                return false;
              }

              // Allow other navigations (external links will open in browser via handleLinkPress)
              handleLinkPress(url, linkInterceptorConfig);
              return false;
            }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);

                // Handle link press from WebView
                if (data.type === "linkPress" && data.url) {
                  console.log(
                    "🔗 Ask WebView: Link pressed in WebView:",
                    data.url
                  );
                  handleLinkPress(data.url, linkInterceptorConfig);
                  return;
                }

                // Android only: Listen for content height changes
                if (Platform.OS === "android") {
                  if (data.type === "contentHeight" && data.height) {
                    const minHeight = 600;
                    const newHeight = Math.max(minHeight, data.height + 50);

                    if (Math.abs(newHeight - previousHeight.current) > 5) {
                      console.log(
                        "Android WebView height adjusted:",
                        newHeight
                      );
                      previousHeight.current = newHeight;
                      setWebViewHeight(newHeight);
                    }
                  }
                }
              } catch (error) {
                // Ignore parsing errors
              }
            }}
            injectedJavaScript={
              Platform.OS === "android"
                ? `
          function sendContentHeight() {
            setTimeout(() => {
              const height = Math.max(
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight,
                document.body.scrollHeight,
                document.body.offsetHeight
              );
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'contentHeight',
                height: height
              }));
            }, 100);
          }
          
          if (document.readyState === 'complete') {
            sendContentHeight();
          } else {
            window.addEventListener('load', sendContentHeight);
          }
          
          let debounceTimer;
          const observer = new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(sendContentHeight, 300);
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // Inject link interceptor
          ${linkInterceptorJS}
          
          true;
        `
                : `
          // iOS: Inject link interceptor only
          ${linkInterceptorJS}
          true;
        `
            }
            startInLoadingState={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            // Fixed: Use numeric value for Android compatibility
            decelerationRate={Platform.OS === "android" ? 0.998 : "normal"}
            // Android-specific props
            mixedContentMode={
              Platform.OS === "android" ? "compatibility" : undefined
            }
            thirdPartyCookiesEnabled={
              Platform.OS === "android" ? true : undefined
            }
            sharedCookiesEnabled={Platform.OS === "android" ? true : undefined}
            nestedScrollEnabled={true}
            // Android-specific: Enable proper content sizing
            scalesPageToFit={Platform.OS === "android" ? false : undefined}
            setSupportMultipleWindows={
              Platform.OS === "android" ? false : undefined
            }
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            accessibilityLabel={`Ask feature for ${brandConfig.displayName}`}
            accessibilityHint="Interactive web content for asking questions"
          />
        </ScrollView>
      ) : (
        <WebView
          key={webViewKey}
          source={{ uri: webViewUrl }}
          style={styles.webView}
          onLoadStart={() => {
            if (!hasInitiallyLoaded.current) {
              console.log("WebView: Initial load started");
              setWebViewLoading(true);
              setWebViewError(null);
            }
          }}
          onLoadEnd={() => {
            if (!hasInitiallyLoaded.current) {
              console.log("WebView: Initial load completed");
              hasInitiallyLoaded.current = true;
            }
            setWebViewLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error:", nativeEvent);
            setWebViewLoading(false);
            setWebViewError(
              `Failed to load: ${nativeEvent.description || "Unknown error"}`
            );
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView HTTP error:", nativeEvent);
            setWebViewLoading(false);
            setWebViewError(
              `HTTP Error ${nativeEvent.statusCode}: ${
                nativeEvent.description || "Server error"
              }`
            );
          }}
          onShouldStartLoadWithRequest={(request) => {
            // Intercept navigation requests
            const url = request.url;
            console.log("🔗 Ask WebView (iOS) navigation request:", url);

            // Allow the initial load and any loads before the WebView has fully loaded
            if (!hasInitiallyLoaded.current) {
              console.log("🔗 Allowing initial load");
              return true;
            }

            // Allow navigation within the Ask feature (same base path)
            if (webViewUrl && url.startsWith(webViewUrl.split("?")[0])) {
              console.log("🔗 Allowing navigation within Ask feature");
              return true;
            }

            // Only intercept if it's one of our app domains
            try {
              const isAppDomain = linkInterceptorConfig.domains.some(
                (domain) => {
                  const normalizedDomain = domain.replace(
                    /^(https?:\/\/)?(www\.)?/,
                    ""
                  );
                  const urlHost = new URL(url).hostname.replace(/^www\./, "");
                  return urlHost === normalizedDomain;
                }
              );

              if (isAppDomain) {
                console.log("🔗 App domain link detected, intercepting");
                // Prevent WebView navigation and handle in React Native
                handleLinkPress(url, linkInterceptorConfig);
                return false;
              }
            } catch (error) {
              // Invalid URL, allow it
              console.log("🔗 Invalid URL, allowing:", url);
            }

            // Allow all other URLs (third-party, ads, analytics, etc.)
            console.log("🔗 Allowing external URL:", url);
            return true;
          }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);

              // Handle link press from WebView
              if (data.type === "linkPress" && data.url) {
                console.log(
                  "🔗 Ask WebView (iOS): Link pressed in WebView:",
                  data.url
                );
                handleLinkPress(data.url, linkInterceptorConfig);
              }
            } catch (error) {
              // Ignore parsing errors
            }
          }}
          injectedJavaScript={`
            // iOS: Inject link interceptor
            ${linkInterceptorJS}
            true;
          `}
          startInLoadingState={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          decelerationRate="normal"
          allowsBackForwardNavigationGestures={true}
          bounces={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          accessibilityLabel={`Ask feature for ${brandConfig.displayName}`}
          accessibilityHint="Interactive web content for asking questions"
        />
      )}
      <SettingsDrawer
        visible={settingsDrawerVisible}
        onClose={() => setSettingsDrawerVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  webView:
    Platform.OS === "android"
      ? {
          width: "100%",
        }
      : {
          flex: 1,
        },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent", // "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
  },
});
