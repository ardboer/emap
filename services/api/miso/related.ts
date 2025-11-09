/**
 * Miso Related Articles Endpoint
 *
 * Provides related article recommendations using the Miso API.
 * This module replaces the duplicate code in services/api.ts fetchRelatedArticles().
 *
 * Part of Phase 2 refactoring - reduces ~185 lines to ~80 lines by using shared client.
 */

import { brandManager } from "@/config/BrandManager";
import { Article } from "@/types";
import { fetchMisoRecommendations } from "./client";

/**
 * Fetches articles related to a specific article from Miso API
 *
 * Uses the product_to_products endpoint to get articles similar to the given article.
 * This is typically used on article detail pages to show "You might also like" sections.
 *
 * The function constructs a product_id with the brand prefix (e.g., "NT-339716")
 * as required by the Miso API.
 *
 * Features:
 * - Supports both authenticated and anonymous users
 * - Filters by brand
 * - Prefers articles from the last year (boost_fq)
 * - Caches results for performance (cache key includes articleId)
 * - Gracefully handles errors by returning empty array
 *
 * @param articleId - The numeric article ID to find related articles for
 * @param limit - Number of articles to fetch (default: 5)
 * @param userId - User ID for authenticated requests (optional)
 * @param isAuthenticated - Whether the user is authenticated (default: false)
 * @returns Promise resolving to an array of Article objects
 *
 * @example
 * // Anonymous user
 * const articles = await fetchRelatedArticles("339716", 5);
 *
 * @example
 * // Authenticated user
 * const articles = await fetchRelatedArticles("339716", 10, "user123", true);
 */
export async function fetchRelatedArticles(
  articleId: string,
  limit: number = 5,
  userId?: string,
  isAuthenticated: boolean = false
): Promise<Article[]> {
  // Get brand config to construct product_id and cache key
  const brandConfig = brandManager.getCurrentBrand();
  const config = brandManager.getApiConfig();
  const { hash } = config;

  // Construct product_id with brand shortcode prefix (e.g., "NT-339716")
  // Use uppercase shortcode for consistency with Miso data
  const brandPrefix = brandConfig.shortcode.toUpperCase();
  const productId = `${brandPrefix}-${articleId}`;

  return fetchMisoRecommendations(
    "recommendation/product_to_products",
    {
      limit,
      userId,
      isAuthenticated,
      productId,
    },
    "related_articles",
    {
      articleId,
      limit,
      hash,
    }
  );
}
