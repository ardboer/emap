import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { brandManager } from "@/config/BrandManager";
import { completeAuthentication, parseTokensFromUrl } from "@/services/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, StyleSheet } from "react-native";

/**
 * Catch-all route for deep linking
 * Handles URLs like: nt://community-nursing/article-title/
 * Or: https://www.nursingtimes.net/community-nursing/article-title/
 */
export default function DeepLinkHandler() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Prevent re-running if we've already navigated
    if (hasNavigated) {
      return;
    }

    const handleDeepLink = async () => {
      // Get the slug from params - declare outside try block so it's accessible in catch
      const slugArray = params.slug;

      if (!slugArray || (Array.isArray(slugArray) && slugArray.length === 0)) {
        console.log("🔗 No slug found, redirecting to home");
        setHasNavigated(true);
        router.replace("/");
        return;
      }

      // Join the slug segments
      const slug = Array.isArray(slugArray) ? slugArray.join("/") : slugArray;

      console.log("🔗 ========================================");
      console.log("🔗 Deep link catch-all route activated");
      console.log("🔗 Current slug from URL:", slug);
      console.log("🔗 ========================================");

      const firstSegment = slug.split("/")[0].toLowerCase();

      try {
        // Handle AI search URLs (e.g., ai-search/?q=...&qs=...)
        if (firstSegment === "ai-search") {
          console.log("🔍 AI search URL detected in deep link");

          try {
            // Extract query parameters from the full URL
            const brandConfig = brandManager.getCurrentBrand();
            const fullUrl = `https://${brandConfig.domain}/${slug}`;
            const urlObj = new URL(fullUrl);

            const q = urlObj.searchParams.get("q");
            const qs = urlObj.searchParams.get("qs");

            if (q || qs) {
              console.log("🔍 AI search params found:", { q, qs });
              console.log("🔍 Navigating to Ask tab with search params");
              setHasNavigated(true);
              router.replace({
                pathname: "/(tabs)/ask",
                params: {
                  q: q || undefined,
                  qs: qs || undefined,
                },
              });
              return;
            }

            // No params, just go to Ask tab
            console.log("🔍 No search params, navigating to Ask tab");
            setHasNavigated(true);
            router.replace("/(tabs)/ask");
            return;
          } catch (error) {
            console.error("❌ Error processing AI search URL:", error);
            // Fallback to Ask tab without params
            setHasNavigated(true);
            router.replace("/(tabs)/ask");
            return;
          }
        }

        // Handle authentication callback with tokens (e.g., auth/callback?access_token=...)
        // These should NEVER open in browser - they contain tokens to process in-app
        if (firstSegment === "auth") {
          console.log("🔗 Auth callback detected with tokens");
          console.log("🔗 Full slug:", slug);

          try {
            // Reconstruct the full URL with scheme to parse tokens
            // The URL might be: auth/callback?access_token=...&refresh_token=...
            const brandConfig = brandManager.getCurrentBrand();
            const fullUrl = `${brandConfig.shortcode}://${slug}`;
            console.log("🔗 Reconstructed URL for token parsing:", fullUrl);

            // Parse tokens from the URL
            const tokens = parseTokensFromUrl(fullUrl);

            if (tokens) {
              console.log("🔑 Tokens parsed successfully from deep link");

              // Complete authentication with the tokens
              const success = await completeAuthentication(tokens);

              console.log(
                success
                  ? "✅ Authentication completed from deep link"
                  : "⚠️ Authentication validation failed, but tokens are stored"
              );

              setError(null);

              // Auth tokens processed successfully
              // Just dismiss this auth callback screen - user stays on article
              // The paywall will automatically disappear when AuthContext detects the tokens
              console.log(
                "🔗 Auth tokens processed - dismissing auth callback screen"
              );
              setHasNavigated(true);
              router.dismiss();
              return;
            } else {
              console.warn("⚠️ No tokens found in auth callback URL");
              // No tokens - dismiss to go back
              console.log(
                "🔗 No tokens found - dismissing auth callback screen"
              );
              setHasNavigated(true);
              router.dismiss();
              return;
            }
          } catch (authError) {
            console.error("❌ Error processing auth callback:", authError);
            // On error, dismiss to go back
            console.log("🔗 Auth error - dismissing auth callback screen");
            setHasNavigated(true);
            router.dismiss();
            return;
          }
        }

        // Check if this is other auth-related paths that should open in browser
        // (login, register, etc. - NOT auth/callback which is handled above)
        const browserAuthPaths = [
          "login",
          "register",
          "account",
          "oauth",
          "signin",
          "signup",
          "mobile-app-login",
        ];

        if (browserAuthPaths.includes(firstSegment)) {
          console.log("🔗 Auth page detected, opening in browser:", slug);
          const brandConfig = brandManager.getCurrentBrand();
          await Linking.openURL(`https://${brandConfig.domain}/${slug}`);
          console.log(
            "🔗 Redirecting back to home after opening auth URL in browser"
          );
          setHasNavigated(true);
          router.replace("/");
          return;
        }

        // Check if this is a tab route that should not be treated as deep link
        const tabRoutes = [
          "(tabs)",
          "index",
          "news",
          "clinical",
          "events",
          "ask",
          "magazine",
          "podcasts",
          "search",
          "settings",
        ];

        if (tabRoutes.includes(firstSegment)) {
          // For tab routes, just redirect to home without trying to resolve
          console.log("🔗 Tab route detected, redirecting to home:", slug);
          setHasNavigated(true);
          router.replace("/");
          return;
        }

        // For all other URLs, treat them as potential articles
        // Navigate directly to article screen with the slug
        // The article screen will handle slug resolution and fallback to webview
        console.log(
          "🔗 Treating as article URL, navigating directly to article screen"
        );

        // Pass the full URL as a fallback parameter for webview
        const brandConfig = brandManager.getCurrentBrand();
        const fullUrl = `https://${brandConfig.domain}/${slug}`;

        console.log(`🔗 Navigating to article screen with slug: ${slug}`);
        console.log(`🔗 Fallback URL: ${fullUrl}`);

        // Navigate immediately to article screen with slug and fallback URL
        // Use replace to remove the [...slug] screen from the stack
        setHasNavigated(true);
        router.replace({
          pathname: `/article/[id]` as any,
          params: {
            id: slug,
            fallbackUrl: fullUrl,
            isSlug: "true",
          },
        });
      } catch (error) {
        console.error("❌ Error in deep link handler:", error);
        // If there's an error in the handler itself, redirect to home
        setHasNavigated(true);
        router.replace("/");
      }
    };

    handleDeepLink();
  }, [params.slug, router, hasNavigated]);

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <ThemedText style={styles.subText}>Redirecting to home...</ThemedText>
      </ThemedView>
    );
  }

  // Don't render anything - navigation happens immediately
  return null;
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
