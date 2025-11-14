import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import { getUserInfo } from "@/services/auth";
import {
  createWebViewLinkInterceptor,
  getLinkInterceptorConfig,
  handleLinkPress,
} from "@/utils/linkInterceptor";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

export default function HybridSearchWebView() {
  const [userId, setUserId] = useState<string | null>(null);
  const { brandConfig } = useBrandConfig();
  const contentBackground = useThemeColor({}, "contentBackground");
  const textColor = useThemeColor({}, "text");
  const primaryColor = useThemeColor({}, "tint");

  // Get brand fonts
  const primaryFont = brandConfig?.theme.fonts.primary || "System";

  // Check if hybrid search is actually enabled
  const isHybridSearchEnabled =
    brandConfig?.misoConfig?.hybridSearch?.enabled ?? false;

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await getUserInfo();
        if (userInfo?.user_id) {
          setUserId(userInfo.user_id);
          console.log(
            "✅ User ID loaded for Hybrid Search webview:",
            userInfo.user_id
          );
        } else {
          console.log("ℹ️ No user ID available (user not logged in)");
        }
      } catch (error) {
        console.error("❌ Error fetching user info:", error);
      }
    };
    fetchUserInfo();
  }, []);

  // Construct the webview URL with hash and user_id parameters
  const webViewUrl = useMemo(() => {
    if (!brandConfig) return null;

    let url = `${brandConfig.apiConfig.baseUrl}/mobile-app-search/?hash=${brandConfig.apiConfig.hash}`;

    // Add user_id if available
    if (userId) {
      url += `&user_id=${userId}`;
    }

    console.log("Hybrid Search webviewUrl", url);
    return url;
  }, [brandConfig, userId]);

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

  // Track screen view when screen is focused
  useFocusEffect(
    useCallback(() => {
      analyticsService.logScreenView("Hybrid Search", "HybridSearchWebView");
    }, [])
  );

  if (!isHybridSearchEnabled || !webViewUrl) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: contentBackground }]}
        edges={["top"]}
      >
        <ThemedView
          style={[styles.content, { backgroundColor: contentBackground }]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText
              style={[styles.headerTitle, { fontFamily: primaryFont }]}
            >
              Search
            </ThemedText>
          </View>
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>
              Hybrid search is not configured for this brand.
            </ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: contentBackground }]}
      edges={["top"]}
    >
      <ThemedView
        style={[styles.content, { backgroundColor: contentBackground }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { fontFamily: primaryFont }]}>
            Search
          </ThemedText>
        </View>

        {/* WebView */}
        <WebView
          source={{ uri: webViewUrl }}
          style={styles.webView}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("Hybrid Search WebView error:", nativeEvent);
          }}
          onShouldStartLoadWithRequest={(request) => {
            // Intercept navigation requests
            const url = request.url;
            console.log("🔗 Hybrid Search WebView navigation request:", url);

            // Allow the initial load
            if (url === webViewUrl) {
              return true;
            }

            // Check if it's a domain link (check the actual hostname, not just if URL contains the domain)
            try {
              const urlObj = new URL(url);
              const urlHostname = urlObj.hostname.replace(/^www\./, "");

              if (
                linkInterceptorConfig.domains.some((domain) => {
                  const normalizedDomain = domain
                    .replace(/^(https?:\/\/)?(www\.)?/, "")
                    .split("/")[0]; // Get just the domain part
                  return (
                    urlHostname === normalizedDomain ||
                    urlHostname.endsWith("." + normalizedDomain)
                  );
                })
              ) {
                console.log(
                  "🔗 Domain link detected in navigation, intercepting and closing search"
                );
                // Close the search modal
                router.back();
                // Prevent WebView navigation and handle in React Native
                handleLinkPress(url, linkInterceptorConfig);
                return false;
              }
            } catch (e) {
              console.log("🔗 Could not parse URL:", url);
            }

            // Allow other navigations
            return true;
          }}
          onMessage={async (event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);

              // Handle link press from WebView
              if (data.type === "linkPress" && data.url) {
                console.log(
                  "🔗 Hybrid Search WebView: Link pressed in WebView:",
                  data.url
                );

                // Handle the link first (this will navigate if it's a domain link)
                await handleLinkPress(data.url, linkInterceptorConfig);

                // Then close the modal if it was a domain link
                try {
                  const urlObj = new URL(data.url);
                  const urlHostname = urlObj.hostname.replace(/^www\./, "");

                  const isDomainLink = linkInterceptorConfig.domains.some(
                    (domain) => {
                      const normalizedDomain = domain
                        .replace(/^(https?:\/\/)?(www\.)?/, "")
                        .split("/")[0];
                      return (
                        urlHostname === normalizedDomain ||
                        urlHostname.endsWith("." + normalizedDomain)
                      );
                    }
                  );

                  if (isDomainLink) {
                    console.log(
                      "🔗 Domain link detected, closing search modal"
                    );
                    router.back();
                  }
                } catch (e) {
                  console.log("🔗 Could not parse URL:", data.url);
                }

                return;
              }
            } catch (error) {
              console.error("Error parsing WebView message:", error);
            }
          }}
          injectedJavaScript={linkInterceptorJS}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={true}
          setSupportMultipleWindows={false}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: isTablet ? 700 : undefined,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  webView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.6,
  },
});
