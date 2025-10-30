import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { brandManager } from "@/config/BrandManager";
import { getPostBySlug } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet } from "react-native";

/**
 * Catch-all route for deep linking
 * Handles URLs like: nt://community-nursing/article-title/
 * Or: https://www.nursingtimes.net/community-nursing/article-title/
 */
export default function DeepLinkHandler() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        // Get the slug from params
        // params.slug will be an array of path segments
        const slugArray = params.slug;

        if (
          !slugArray ||
          (Array.isArray(slugArray) && slugArray.length === 0)
        ) {
          console.log("🔗 No slug found, redirecting to home");
          router.replace("/");
          return;
        }

        // Join the slug segments
        const slug = Array.isArray(slugArray) ? slugArray.join("/") : slugArray;

        console.log("🔗 ========================================");
        console.log("🔗 Deep link catch-all route activated");
        console.log("🔗 Current slug from URL:", slug);
        console.log("🔗 ========================================");

        // Check if this is an authentication-related path
        const authPaths = [
          "auth",
          "login",
          "register",
          "account",
          "callback",
          "oauth",
          "signin",
          "signup",
          "mobile-app-login",
        ];
        const firstSegment = slug.split("/")[0].toLowerCase();

        if (authPaths.includes(firstSegment)) {
          console.log("🔗 Auth path detected, opening in browser:", slug);
          const brandConfig = brandManager.getCurrentBrand();
          await Linking.openURL(`https://${brandConfig.domain}/${slug}`);
          console.log(
            "🔗 Redirecting back to home after opening auth URL in browser"
          );
          router.replace("/");
          return;
        }

        // Check if this specific slug was recently processed (within last 3 seconds)
        const deepLinkKey = `deeplink_${slug}`;
        const lastProcessedTime = await AsyncStorage.getItem(deepLinkKey);

        console.log("🔗 Checking cache for key:", deepLinkKey);
        console.log("🔗 Last processed time:", lastProcessedTime);

        if (lastProcessedTime) {
          const timeSinceProcessed = Date.now() - parseInt(lastProcessedTime);
          console.log("🔗 Time since processed:", timeSinceProcessed, "ms");

          if (timeSinceProcessed < 3000) {
            console.log("🔗 Deep link recently processed, redirecting to home");
            router.replace("/");
            return;
          } else {
            console.log("🔗 Cache expired, processing deep link");
          }
        } else {
          console.log("🔗 No cache found, processing deep link");
        }

        // Mark as processed with current timestamp
        await AsyncStorage.setItem(deepLinkKey, Date.now().toString());
        console.log("🔗 Marked as processed in cache");

        // Resolve slug to article ID
        console.log("🔗 Calling API to resolve slug:", slug);
        const { id } = await getPostBySlug(slug);

        if (!id) {
          throw new Error("No article ID returned");
        }

        console.log(`🔗 ✅ Successfully resolved slug to article ID: ${id}`);
        console.log(`🔗 Navigating to: /article/${id}`);

        // Redirect to the article
        // Using replace ensures the deep link URL is removed from history
        router.replace(`/article/${id}`);
      } catch (error) {
        console.error("❌ Error resolving deep link:", error);
        setError("Unable to load article");

        // Redirect to home after showing error briefly
        setTimeout(() => {
          router.replace("/");
        }, 2000);
      }
    };

    handleDeepLink();
  }, [params.slug, router]);

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <ThemedText style={styles.subText}>Redirecting to home...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color="#00AECA" />
      <ThemedText style={styles.loadingText}>Loading article...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 18,
    color: "#ff0000",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
