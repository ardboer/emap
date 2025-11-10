/**
 * Miso Highlights with Recommendations
 *
 * Combines WordPress highlights with Miso recommendations for the main article feed.
 * This module extracts the fetchHighlightsWithRecommendations function and its helpers.
 *
 * Part of Phase 2 refactoring - this is a complex function that combines WordPress + Miso.
 * While it doesn't have as much duplication as other Miso functions, extracting it
 * provides better organization and separation of concerns.
 */

import { brandManager } from "@/config/BrandManager";
import { Article } from "@/types";
import { fetchRecommendedArticlesWithExclude } from "./recommended";

/**
 * Mix WordPress and Miso articles in alternating 1:1 pattern
 * Pattern: WP, Miso, WP, Miso, ... until WP runs out, then continue with Miso only
 *
 * @param wordpressArticles - Array of WordPress articles
 * @param misoArticles - Array of Miso recommendation articles
 * @returns Mixed array following the alternating pattern
 */
function mixArticles(
  wordpressArticles: Article[],
  misoArticles: Article[]
): Article[] {
  const result: Article[] = [];
  const maxLength = Math.max(wordpressArticles.length, misoArticles.length);

  for (let i = 0; i < maxLength; i++) {
    // Add WordPress article if available
    if (i < wordpressArticles.length) {
      result.push(wordpressArticles[i]);
    }

    // Add Miso article if available
    if (i < misoArticles.length) {
      result.push(misoArticles[i]);
    }
  }

  console.log(
    `📊 Mixed articles: ${result.length} total (${wordpressArticles.length} WP + ${misoArticles.length} Miso)`
  );
  console.log(
    `📋 Pattern: ${result
      .map((a) => (a.source === "wordpress" ? "WP" : "M"))
      .join(", ")}`
  );

  return result;
}

/**
 * Helper function to inject native ads into article array
 *
 * Inserts native ad placeholders at configured positions within the article feed.
 * Supports both new carousel structure and legacy configuration format.
 *
 * @param articles - Array of articles to inject ads into
 * @param brandConfig - Brand configuration containing native ad settings
 * @returns Array of articles with native ads injected at configured positions
 */
function injectNativeAds(articles: Article[], brandConfig: any): Article[] {
  // Check if native ads are enabled
  if (!brandConfig.nativeAds?.enabled) {
    console.log("Native ads disabled, returning articles without ads");
    return articles;
  }

  // Get carousel configuration (new structure) or fall back to legacy structure
  const carouselConfig =
    brandConfig.nativeAds.carousel || brandConfig.nativeAds;

  // Check if carousel ads are enabled
  if (carouselConfig.enabled === false) {
    console.log("Carousel native ads disabled, returning articles without ads");
    return articles;
  }

  // Support both new structure (carousel.firstAdPosition) and legacy structure
  const firstAdPosition =
    carouselConfig.firstAdPosition ||
    brandConfig.nativeAds.firstAdPosition ||
    2;
  const adInterval =
    carouselConfig.adInterval || brandConfig.nativeAds.adInterval;
  const adFrequency =
    carouselConfig.adFrequency || brandConfig.nativeAds.adFrequency;
  const interval = adInterval || adFrequency || 5;
  const maxAdsPerSession = carouselConfig.maxAdsPerSession;

  if (adFrequency && !adInterval) {
    console.warn(
      "⚠️ Using deprecated 'adFrequency'. Please update to 'adInterval'"
    );
  }

  const result: Article[] = [];
  let adCounter = 0;

  console.log(
    `📢 Injecting native ads: firstAdPosition=${firstAdPosition}, interval=${interval}, maxAdsPerSession=${maxAdsPerSession}`
  );

  for (let i = 0; i < articles.length; i++) {
    // Check if we should insert an ad at this position
    const shouldInsertAd =
      i === firstAdPosition ||
      (i > firstAdPosition && (i - firstAdPosition) % interval === 0);

    // Only insert ad if we haven't reached the session limit
    if (
      shouldInsertAd &&
      (maxAdsPerSession === null ||
        maxAdsPerSession === undefined ||
        adCounter < maxAdsPerSession)
    ) {
      // Create a mock native ad article
      const nativeAd: Article = {
        id: `native-ad-${adCounter}`,
        title: "Discover Amazing Products",
        leadText: "Find what you're looking for with our curated selection",
        content: "https://www.example.com/ad-destination", // Store URL in content field
        imageUrl: "https://picsum.photos/800/1200?random=" + adCounter,
        timestamp: "Sponsored",
        category: "Advertisement",
        source: "native-ad",
        isNativeAd: true,
        nativeAdData: {
          headline: "Discover Amazing Products",
          body: "Find what you're looking for with our curated selection",
          advertiser: "Sponsored Content",
          callToAction: "Learn More",
          images: ["https://picsum.photos/800/1200?random=" + adCounter],
        },
      };

      result.push(nativeAd);
      adCounter++;

      console.log(
        `✅ Injected native ad placeholder at position ${
          result.length - 1
        } (id: ${nativeAd.id})`
      );
    }

    // Add the regular article
    result.push(articles[i]);
  }

  console.log(
    `Final article count: ${result.length} (${articles.length} articles + ${adCounter} native ads)`
  );

  return result;
}

/**
 * Fetches highlights with Miso recommendations appended
 *
 * This is the main function for the home screen article feed. It combines:
 * 1. WordPress highlights (featured articles)
 * 2. Miso personalized recommendations (with exclusions to avoid duplicates)
 * 3. Native ad injection at configured positions
 *
 * The function supports two modes:
 * - Sequential: WordPress articles first, then Miso recommendations
 * - Mix-and-match: Alternating WordPress and Miso articles (1:1 pattern)
 *
 * Features:
 * - Graceful fallback to WordPress-only if Miso fails
 * - Configurable via brand config (enabled, mixAndMatch, misoItemCount)
 * - Excludes WordPress article IDs from Miso recommendations
 * - Marks articles with source ("wordpress" or "miso") and isRecommended flag
 * - Injects native ads at configured positions
 *
 * @param userId - User ID for authenticated requests (optional)
 * @param isAuthenticated - Whether the user is authenticated (default: false)
 * @returns Promise resolving to an array of Article objects with native ads
 *
 * @example
 * // Anonymous user
 * const articles = await fetchHighlightsWithRecommendations();
 *
 * @example
 * // Authenticated user
 * const articles = await fetchHighlightsWithRecommendations("user123", true);
 */
export async function fetchHighlightsWithRecommendations(
  userId?: string,
  isAuthenticated: boolean = false
): Promise<Article[]> {
  try {
    // Import fetchFeaturedArticles from parent api.ts
    // This is a WordPress function that will be moved to wordpress module in Phase 3
    const { fetchFeaturedArticles } = await import("../../api");

    // 1. Fetch WordPress highlights (existing function)
    const wordpressArticles = await fetchFeaturedArticles();

    // Mark as WordPress source
    const markedWordpressArticles = wordpressArticles.map(
      (article: Article) => ({
        ...article,
        source: "wordpress" as const,
        isRecommended: false,
      })
    );

    // 2. Check if Miso recommendations are enabled
    const brandConfig = brandManager.getCurrentBrand();
    if (!brandConfig.highlightsRecommendations?.enabled) {
      console.log(
        "Miso recommendations disabled for highlights, returning WordPress only"
      );
      return injectNativeAds(markedWordpressArticles, brandConfig);
    }

    // 3. Check if Miso is configured
    if (!brandConfig.misoConfig) {
      console.warn("Miso not configured, returning WordPress highlights only");
      return injectNativeAds(markedWordpressArticles, brandConfig);
    }

    try {
      // 4. Build exclude list from WordPress article IDs
      const brandPrefix = brandConfig.shortcode.toUpperCase();
      const excludeIds = wordpressArticles.map(
        (article: Article) => `${brandPrefix}-${article.id}`
      );

      console.log(
        "Excluding WordPress articles from Miso recommendations:",
        excludeIds
      );

      // 5. Fetch Miso recommendations with exclude parameter
      const misoCount =
        brandConfig.highlightsRecommendations.misoItemCount || 10;
      const misoArticles = await fetchRecommendedArticlesWithExclude(
        misoCount,
        excludeIds,
        userId,
        isAuthenticated
      );

      // Mark as Miso source
      const markedMisoArticles = misoArticles.map((article) => ({
        ...article,
        source: "miso" as const,
        isRecommended: true,
      }));

      console.log(
        `Combined highlights: ${markedWordpressArticles.length} WordPress + ${markedMisoArticles.length} Miso`
      );

      // 6. Combine articles based on mixAndMatch setting
      let combinedArticles: Article[];
      if (brandConfig.highlightsRecommendations?.mixAndMatch) {
        console.log(
          "🔀 Mix-and-match enabled: alternating WP and Miso articles"
        );
        combinedArticles = mixArticles(
          markedWordpressArticles,
          markedMisoArticles
        );
      } else {
        console.log("📚 Sequential mode: WordPress first, then Miso");
        combinedArticles = [...markedWordpressArticles, ...markedMisoArticles];
      }

      // 7. Inject native ads at configured positions
      return injectNativeAds(combinedArticles, brandConfig);
    } catch (misoError) {
      console.error(
        "Error fetching Miso recommendations, falling back to WordPress only:",
        misoError
      );
      return injectNativeAds(markedWordpressArticles, brandConfig);
    }
  } catch (error) {
    console.error("Error in fetchHighlightsWithRecommendations:", error);
    throw error;
  }
}
