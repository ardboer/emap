/**
 * Miso Trending Articles Endpoint
 *
 * Provides trending article recommendations using the Miso API.
 * This module replaces the duplicate code in services/api.ts fetchTrendingArticles().
 *
 * Part of Phase 2 refactoring - reduces ~163 lines to ~60 lines by using shared client.
 */

import { Article } from "@/types";
import { fetchMisoRecommendations } from "./client";

/**
 * Fetches trending articles from Miso API
 *
 * Uses the user_to_trending endpoint to get articles that are currently trending
 * based on user behavior and engagement metrics.
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
 * const articles = await fetchTrendingArticles(5);
 *
 * @example
 * // Authenticated user
 * const articles = await fetchTrendingArticles(10, "user123", true);
 */
export async function fetchTrendingArticles(
  limit: number = 5,
  userId?: string,
  isAuthenticated: boolean = false
): Promise<Article[]> {
  // Import getApiConfig to get hash for cache key
  const { brandManager } = await import("@/config/BrandManager");
  const config = brandManager.getApiConfig();
  const { hash } = config;

  return fetchMisoRecommendations(
    "recommendation/user_to_trending",
    {
      limit,
      userId,
      isAuthenticated,
    },
    "trending_articles",
    { limit, hash }
  );
}
