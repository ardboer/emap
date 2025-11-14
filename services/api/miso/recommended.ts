/**
 * Miso Recommended Articles Endpoints
 *
 * Provides personalized article recommendations using the Miso API.
 * This module replaces duplicate code in services/api.ts for:
 * - fetchRecommendedArticles() (~165 lines)
 * - fetchRecommendedArticlesWithExclude() (~144 lines)
 *
 * Part of Phase 2 refactoring - reduces ~309 lines to ~100 lines by using shared client.
 */

import { Article } from "@/types";
import { fetchMisoRecommendations } from "./client";

/**
 * Fetches personalized recommended articles from Miso API
 *
 * Uses the user_to_products endpoint to get articles recommended for the user
 * based on their behavior, preferences, and engagement history.
 *
 * Features:
 * - Supports both authenticated and anonymous users
 * - Filters by brand
 * - Prefers articles from the last year (boost_fq)
 * - Caches results for performance
 * - Gracefully handles errors by returning empty array
 *
 * @param limit - Number of articles to fetch (default: 5)
 * @param userId - User ID for authenticated requests (optional)
 * @param isAuthenticated - Whether the user is authenticated (default: false)
 * @returns Promise resolving to an array of Article objects
 *
 * @example
 * // Anonymous user
 * const articles = await fetchRecommendedArticles(5);
 *
 * @example
 * // Authenticated user
 * const articles = await fetchRecommendedArticles(10, "user123", true);
 */
export async function fetchRecommendedArticles(
  limit: number = 5,
  userId?: string,
  isAuthenticated: boolean = false
): Promise<Article[]> {
  // Import getApiConfig to get hash for cache key
  const { brandManager } = await import("@/config/BrandManager");
  const config = brandManager.getApiConfig();
  const { hash } = config;

  return fetchMisoRecommendations(
    "recommendation/user_to_products",
    {
      limit,
      userId,
      isAuthenticated,
    },
    "recommended_articles",
    { limit, hash }
  );
}

/**
 * Fetches personalized recommended articles with exclusion list
 *
 * Similar to fetchRecommendedArticles, but allows excluding specific article IDs
 * from the results. Useful for avoiding duplicate recommendations when showing
 * multiple recommendation blocks on the same screen.
 *
 * Special handling:
 * - Removes 150x150 image size constraints for better quality
 * - Forces landscape rendering for better appearance with Miso thumbnails
 *
 * Features:
 * - Supports both authenticated and anonymous users
 * - Excludes specified article IDs from results
 * - Filters by brand
 * - Prefers articles from the last year (boost_fq)
 * - Caches results for performance (cache key includes excludeIds)
 * - Gracefully handles errors by returning empty array
 *
 * @param limit - Number of articles to fetch (default: 5)
 * @param excludeIds - Array of article IDs to exclude from results (default: [])
 * @param userId - User ID for authenticated requests (optional)
 * @param isAuthenticated - Whether the user is authenticated (default: false)
 * @returns Promise resolving to an array of Article objects with landscape rendering
 *
 * @example
 * // Exclude specific articles
 * const articles = await fetchRecommendedArticlesWithExclude(5, ["123", "456"]);
 *
 * @example
 * // Authenticated user with exclusions
 * const articles = await fetchRecommendedArticlesWithExclude(
 *   10,
 *   ["123", "456", "789"],
 *   "user123",
 *   true
 * );
 */
export async function fetchRecommendedArticlesWithExclude(
  limit: number = 5,
  excludeIds: string[] = [],
  userId?: string,
  isAuthenticated: boolean = false
): Promise<Article[]> {
  const { brandManager } = await import("@/config/BrandManager");
  const config = brandManager.getApiConfig();
  const { hash } = config;

  const cacheKey = "recommended_articles_exclude";
  const cacheParams = { limit, excludeIds: excludeIds.join(","), hash };

  try {
    // Get brand config to access Miso configuration
    const brandConfig = brandManager.getCurrentBrand();

    if (!brandConfig.misoConfig) {
      console.warn("Miso configuration not found for current brand");
      return [];
    }

    // Use the shared client with custom transformation for landscape images
    const articles = await fetchMisoRecommendations(
      "recommendation/user_to_products",
      {
        limit,
        userId,
        isAuthenticated,
        excludeIds,
      },
      cacheKey,
      cacheParams
    );

    // Transform articles to use landscape rendering
    // This matches the original behavior where images are marked as landscape
    return articles.map((article) => ({
      ...article,
      isLandscape: true,
    }));
  } catch (error) {
    console.error(
      "Error fetching recommended articles with exclusions from Miso:",
      error
    );
    // Return empty array instead of throwing to gracefully handle errors
    return [];
  }
}
