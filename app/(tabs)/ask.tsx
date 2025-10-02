import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function AskScreen() {
  const {
    brandConfig,
    loading: brandLoading,
    error: brandError,
  } = useBrandConfig();
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);

  // Construct the dynamic URL based on brand configuration
  const webViewUrl = useMemo(() => {
    if (!brandConfig) return null;

    // Ensure domain has proper protocol and trailing slash handling
    let domain = brandConfig.domain;
    if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
      domain = `https://${domain}`;
    }
    if (!domain.endsWith("/")) {
      domain += "/";
    }

    return `${domain}mobile-app-ai-search/?hash=${brandConfig.apiConfig.hash}`;
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

  return (
    <ThemedView style={styles.container}>
      {webViewLoading && (
        <ThemedView style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Loading Ask feature...
          </ThemedText>
        </ThemedView>
      )}

      <WebView
        source={{ uri: webViewUrl }}
        style={styles.webView}
        onLoadStart={() => {
          setWebViewLoading(true);
          setWebViewError(null);
        }}
        onLoadEnd={() => {
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
        startInLoadingState={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
        decelerationRate="normal"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        accessibilityLabel={`Ask feature for ${brandConfig.displayName}`}
        accessibilityHint="Interactive web content for asking questions"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
