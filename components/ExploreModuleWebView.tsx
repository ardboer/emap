import { useBrandConfig } from "@/hooks/useBrandConfig";
import {
  createWebViewLinkInterceptor,
  getLinkInterceptorConfig,
  handleLinkPress,
} from "@/utils/linkInterceptor";
import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { ThemedText } from "./ThemedText";

interface ExploreModuleWebViewProps {
  baseUrl: string;
  hash: string;
  articleId: string;
  userId?: string;
}

/**
 * ExploreModuleWebView Component
 *
 * Renders an embedded webview that loads the explore module from the configured URL.
 * The URL is constructed with dynamic parameters including article ID and optional user ID.
 * Uses flexible height that adapts to content on both iOS and Android.
 *
 * @param baseUrl - Base URL from brand config (apiConfig.baseUrl)
 * @param hash - Hash from brand config (apiConfig.hash)
 * @param articleId - Current article ID
 * @param userId - Optional authenticated user ID
 */
export const ExploreModuleWebView: React.FC<ExploreModuleWebViewProps> = ({
  baseUrl,
  hash,
  articleId,
  userId,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Dynamic height for both iOS and Android
  const [webViewHeight, setWebViewHeight] = useState(400);
  const previousHeight = useRef<number>(400);
  const hasInitiallyLoaded = useRef(false);
  const { brandConfig } = useBrandConfig();

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

  // Construct URL with parameters
  // Format: {baseUrl}/explore-module/?hash={hash}&post_id={articleId}&user_id={userId}
  const url = `${baseUrl}/explore-module/?hash=${hash}&post_id=${articleId}${
    userId ? `&user_id=${userId}` : ""
  }`;

  console.log("🔍 ExploreModuleWebView loading:", {
    url,
    articleId,
    userId: userId || "not authenticated",
    platform: Platform.OS,
  });

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Loading explore module...
          </ThemedText>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Unable to load explore module
          </ThemedText>
        </View>
      )}
      <WebView
        source={{ uri: url }}
        style={[styles.webview, { height: webViewHeight }]}
        onLoadStart={() => {
          console.log("🔄 ExploreModuleWebView: Loading started");
          setLoading(true);
          setError(false);
        }}
        onLoadEnd={() => {
          console.log("✅ ExploreModuleWebView: Loading completed");
          hasInitiallyLoaded.current = true;
          setLoading(false);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("❌ ExploreModuleWebView: Error loading", nativeEvent);
          setLoading(false);
          setError(true);
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Intercept navigation requests
          const requestUrl = request.url;
          console.log(
            "🔗 ExploreModuleWebView navigation request:",
            requestUrl
          );

          // Allow the initial load and any loads before the WebView has fully loaded
          if (!hasInitiallyLoaded.current) {
            console.log("🔗 Allowing initial load");
            return true;
          }

          // Allow navigation within the Explore module (same base path)
          if (requestUrl.startsWith(url.split("?")[0])) {
            console.log("🔗 Allowing navigation within Explore module");
            return true;
          }

          // Only intercept if it's one of our app domains
          try {
            const isAppDomain = linkInterceptorConfig.domains.some((domain) => {
              const normalizedDomain = domain.replace(
                /^(https?:\/\/)?(www\.)?/,
                ""
              );
              const urlHost = new URL(requestUrl).hostname.replace(
                /^www\./,
                ""
              );
              return urlHost === normalizedDomain;
            });

            if (isAppDomain) {
              console.log("🔗 App domain link detected, intercepting");
              // Prevent WebView navigation and handle in React Native
              handleLinkPress(requestUrl, linkInterceptorConfig);
              return false;
            }
          } catch (error) {
            // Invalid URL, allow it
            console.log("🔗 Invalid URL, allowing:", requestUrl);
          }

          // Allow all other URLs (third-party, ads, analytics, etc.)
          console.log("🔗 Allowing external URL:", requestUrl);
          return true;
        }}
        onMessage={(event) => {
          // Listen for content height changes and link presses
          try {
            const data = JSON.parse(event.nativeEvent.data);

            // Handle link press from WebView
            if (data.type === "linkPress" && data.url) {
              console.log(
                "🔗 ExploreModuleWebView: Link pressed in WebView:",
                data.url
              );
              handleLinkPress(data.url, linkInterceptorConfig);
              return;
            }

            // Handle content height changes
            if (data.type === "contentHeight" && data.height) {
              const minHeight = 400;
              // Use exact content height without extra padding
              const newHeight = Math.max(minHeight, data.height);

              // Only update if height changed significantly (avoid jitter)
              if (Math.abs(newHeight - previousHeight.current) > 5) {
                console.log(
                  `📏 ExploreModuleWebView height adjusted (${Platform.OS}):`,
                  newHeight
                );
                previousHeight.current = newHeight;
                setWebViewHeight(newHeight);
              }
            }
          } catch (error) {
            // Ignore parsing errors from other messages
          }
        }}
        injectedJavaScript={`
          // Remove any default padding/margin from body and html
          document.body.style.margin = '0';
          document.body.style.padding = '0';
          document.documentElement.style.margin = '0';
          document.documentElement.style.padding = '0';
          
          // Remove margin-bottom from .miso-explore-section
          const exploreSection = document.querySelector('.miso-explore-section');
          if (exploreSection) {
            exploreSection.style.marginBottom = '0';
          }
          
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
            debounceTimer = setTimeout(() => {
              // Ensure margin-bottom is 0 for dynamically loaded content
              const exploreSection = document.querySelector('.miso-explore-section');
              if (exploreSection) {
                exploreSection.style.marginBottom = '0';
              }
              sendContentHeight();
            }, 300);
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // Inject link interceptor
          ${linkInterceptorJS}
          
          true;
        `}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // Android-specific props
        mixedContentMode={
          Platform.OS === "android" ? "compatibility" : undefined
        }
        thirdPartyCookiesEnabled={Platform.OS === "android" ? true : undefined}
        sharedCookiesEnabled={Platform.OS === "android" ? true : undefined}
        nestedScrollEnabled={Platform.OS === "android" ? true : undefined}
        scalesPageToFit={Platform.OS === "android" ? false : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  webview: {
    width: "100%",
    backgroundColor: "transparent",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  errorContainer: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 100,
  },
  errorText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
});
