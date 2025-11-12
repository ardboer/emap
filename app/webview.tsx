import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";

/**
 * WebView Fallback Route
 *
 * This route is used when a deep link cannot be resolved to a native route.
 * It displays the original URL in a WebView, allowing users to view the content
 * even if it's not available as a native article in the app.
 */
export default function WebViewFallback() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { brandConfig } = useBrandConfig();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the URL from params and decode it
  const encodedUrl = params.url as string;
  const url = encodedUrl ? decodeURIComponent(encodedUrl) : null;

  console.log("🌐 WebView Fallback - URL:", url);

  if (!url) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>No URL provided</ThemedText>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/")}
          >
            <ThemedText style={styles.buttonText}>Go Home</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {brandConfig?.displayName || "Web Content"}
        </ThemedText>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/")}
        >
          <Ionicons name="home" size={24} color="#007AFF" />
        </TouchableOpacity>
      </ThemedView>

      {/* Loading indicator */}
      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </ThemedView>
      )}

      {/* Error state */}
      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/")}
          >
            <ThemedText style={styles.buttonText}>Go Home</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* WebView */}
      {!error && (
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={() => {
            console.log("🌐 WebView loading started");
            setLoading(true);
            setError(null);
          }}
          onLoadEnd={() => {
            console.log("🌐 WebView loading completed");
            setLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("🌐 WebView error:", nativeEvent);
            setLoading(false);
            setError(
              `Failed to load: ${nativeEvent.description || "Unknown error"}`
            );
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("🌐 WebView HTTP error:", nativeEvent);
            setLoading(false);
            setError(
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
          decelerationRate="normal"
          allowsBackForwardNavigationGestures={true}
          bounces={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          // Android-specific props
          mixedContentMode={
            Platform.OS === "android" ? "compatibility" : undefined
          }
          thirdPartyCookiesEnabled={
            Platform.OS === "android" ? true : undefined
          }
          sharedCookiesEnabled={Platform.OS === "android" ? true : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  homeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 16,
  },
  webview: {
    flex: 1,
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
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.7,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
