import GradientHeader from "@/components/GradientHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
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
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [webViewHeight, setWebViewHeight] = useState(600);
  const hasInitiallyLoaded = useRef(false);

  // Construct the dynamic URL based on brand configuration
  const webViewUrl = useMemo(() => {
    if (!brandConfig) return null;
    console.log(
      "Ask webviewUrl",
      `${brandConfig.apiConfig.baseUrl}/mobile-app-ai-search/?hash=${brandConfig.apiConfig.hash}`
    );
    return `${brandConfig.apiConfig.baseUrl}/mobile-app-ai-search/?hash=${brandConfig.apiConfig.hash}`;
  }, [brandConfig]);

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
      <GradientHeader onSearchPress={handleSearchPress} />
      {webViewLoading && (
        <ThemedView style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading Ask...</ThemedText>
        </ThemedView>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <WebView
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
          onMessage={(event) => {
            // Listen for content height changes from the WebView
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === "contentHeight" && data.height) {
                console.log("WebView content height:", data.height);
                setWebViewHeight(Math.max(600, data.height + 50)); // Add padding
              }
            } catch (error) {
              // Ignore parsing errors
            }
          }}
          injectedJavaScript={`
            // Function to send content height to React Native
            function sendContentHeight() {
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
            }
            
            // Send height on load
            sendContentHeight();
            
            // Monitor for DOM changes and resize
            const observer = new MutationObserver(() => {
              sendContentHeight();
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true
            });
            
            // Also check on window resize
            window.addEventListener('resize', sendContentHeight);
            
            // Check periodically for dynamic content
            setInterval(sendContentHeight, 1000);
            
            true; // Required for injectedJavaScript
          `}
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
          nestedScrollEnabled={Platform.OS === "android" ? true : undefined}
          // iOS-specific props
          allowsBackForwardNavigationGestures={
            Platform.OS === "ios" ? true : undefined
          }
          bounces={Platform.OS === "ios" ? true : undefined}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          accessibilityLabel={`Ask feature for ${brandConfig.displayName}`}
          accessibilityHint="Interactive web content for asking questions"
        />
      </ScrollView>
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
  webView: {
    width: "100%",
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
