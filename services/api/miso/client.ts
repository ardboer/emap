/**
 * Miso API Client
 *
 * Shared client for making requests to the Miso recommendation API.
 * This eliminates ~70-80% of code duplication across Miso endpoint functions.
 *
 * Part of Phase 2 refactoring - this single client replaces duplicate logic
 * in fetchTrendingArticles, fetchRecommendedArticles, fetchRelatedArticles, etc.
 */

import { brandManager } from "@/config/BrandManager";
import { Article } from "@/types";
import { getAnonymousId } from "../../anonymousId";
import { transformMisoProductToArticle } from "./transformers";
import { MisoApiResponse, MisoRequestParams } from "./types";

/**
 * Calculates the date one year ago in ISO format
 * Used for boost_fq parameter to prefer recent articles
 *
 * @returns ISO date string for one year ago (e.g., "2023-01-01T00:00:00Z")
 */
function getOneYearAgoDate(): string {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return oneYearAgo.toISOString().split("T")[0] + "T00:00:00Z";
}

/**
 * Fetches recommendations from the Miso API
 *
 * This is the core shared function that handles all common Miso API logic:
 * - Brand configuration access
 * - User ID vs Anonymous ID logic (authenticated vs anonymous)
 * - Request body construction with common parameters
 * - Fetch execution with proper headers
 * - Error handling and response parsing
 * - Cache integration
 * - Debug logging (curl commands)
 *
 * @param endpoint - The Miso API endpoint path (e.g., "recommendation/user_to_trending")
 * @param params - Request parameters including limit, userId, authentication status, etc.
 * @param cacheKey - Cache key for storing/retrieving results
 * @param cacheParams - Additional parameters to include in cache key (optional)
 * @returns Promise resolving to an array of Article objects
 *
 * @example
 * // Fetch trending articles
 * const articles = await fetchMisoRecommendations(
 *   "recommendation/user_to_trending",
 *   { limit: 5, isAuthenticated: false },
 *   "trending_articles",
 *   { limit: 5, hash: "abc123" }
 * );
 *
 * @example
 * // Fetch related articles
 * const articles = await fetchMisoRecommendations(
 *   "recommendation/product_to_products",
 *   { limit: 5, productId: "NT-339716", isAuthenticated: true, userId: "user123" },
 *   "related_articles",
 *   { articleId: "339716", limit: 5, hash: "abc123" }
 * );
 */
export async function fetchMisoRecommendations(
  endpoint: string,
  params: MisoRequestParams,
  cacheKey: string,
  cacheParams?: Record<string, any>
): Promise<Article[]> {
  const { cacheService } = await import("../../cache");

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, cacheParams);
  // Cache is currently disabled in original code (commented out)
  // if (cached) {
  //   console.log(`Returning cached ${cacheKey}`);
  //   return cached;
  // }

  try {
    // Get brand config to access Miso configuration
    const brandConfig = brandManager.getCurrentBrand();

    if (!brandConfig.misoConfig) {
      console.warn("Miso configuration not found for current brand");
      return [];
    }

    const { apiKey, brandFilter, baseUrl } = brandConfig.misoConfig;
    const fullEndpoint = `${baseUrl}/${endpoint}`;

    // Determine which ID to use based on authentication status
    let misoUserId: string | undefined;
    let misoAnonymousId: string | undefined;

    if (params.isAuthenticated && params.userId) {
      // Authenticated user: use "sub:" prefix for subscriber
      misoUserId = `sub:${params.userId}`;
      misoAnonymousId = undefined;
    } else {
      // Anonymous user: use anonymous_id only
      misoUserId = undefined;
      misoAnonymousId = await getAnonymousId();
    }

    // Calculate date one year ago for boost_fq
    const oneYearAgoISO = getOneYearAgoDate();

    // Prepare base request body with common parameters
    const requestBody: any = {
      fl: ["*"],
      rows: params.limit,
      // Date filter to get articles from the last year
      boost_fq: `published_at:[${oneYearAgoISO} TO *]`,
      // Brand filter with quotes for proper matching
      fq: `brand:"${brandFilter}"`,
    };

    // Add product_id if provided (for product_to_products endpoint)
    if (params.productId) {
      requestBody.product_id = params.productId;
    }

    // Add exclude parameter if provided
    if (params.excludeIds && params.excludeIds.length > 0) {
      requestBody.exclude = params.excludeIds;
    }

    // Add custom filters if provided
    if (params.customFilters) {
      Object.assign(requestBody, params.customFilters);
    }

    // Add only the appropriate ID
    if (misoUserId) {
      requestBody.user_id = misoUserId;
    } else if (misoAnonymousId) {
      requestBody.anonymous_id = misoAnonymousId;
    }

    // Log request details
    console.log(`Fetching from Miso (${endpoint}):`, {
      endpoint: fullEndpoint,
      brand: brandConfig.name,
      limit: params.limit,
      mode: params.isAuthenticated ? "AUTHENTICATED" : "ANONYMOUS",
      userId: misoUserId || "N/A",
      anonymousId: misoAnonymousId || "N/A",
      productId: params.productId || "N/A",
      excludeCount: params.excludeIds?.length || 0,
      requestBody,
    });

    // Generate curl command for debugging
    const curlCommand = `curl -X POST '${fullEndpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${apiKey}' \\
  -d '${JSON.stringify(requestBody)}'`;

    console.log("\n=== DEBUG: Copy this curl command to test the API ===");
    console.log(curlCommand);
    console.log("===================================================\n");

    // Make the API request
    const response = await fetch(fullEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Miso API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Miso API error response:", errorText);
      throw new Error(
        `Miso API request failed: ${response.status} - ${errorText}`
      );
    }

    const data: MisoApiResponse = await response.json();
    console.log(`Miso API response for ${cacheKey}:`, data);

    // Transform Miso response to Article interface
    // Miso API returns products in data.data.products or data.products
    const products = (data.data && data.data.products) || data.products || [];
    const articles: Article[] = products.map(transformMisoProductToArticle);

    // Cache the result
    await cacheService.set(cacheKey, articles, cacheParams);

    return articles;
  } catch (error) {
    console.error(`Error fetching from Miso (${endpoint}):`, error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey, cacheParams);
    if (staleCache) {
      console.log(`Returning stale cached ${cacheKey} due to API error`);
      return staleCache;
    }

    // Return empty array instead of throwing to gracefully handle errors
    return [];
  }
}
