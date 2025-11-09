/**
 * WordPress Search API
 *
 * Functions for searching WordPress content.
 * Provides full-text search across posts and pages.
 */

import { decodeHtmlEntities, stripHtml } from "../utils/parsers";
import { ENDPOINTS, getApiConfig } from "./config";

/**
 * Fetch search results from WordPress search API
 *
 * Performs a full-text search across WordPress content.
 * Results include posts, pages, and other searchable content types.
 *
 * @param query - Search query string
 * @returns Promise resolving to array of search result objects
 *
 * @example
 * const results = await fetchSearchResults("patient safety");
 * // Returns: [{ id: 123, title: "Patient Safety Article", ... }, ...]
 */
export async function fetchSearchResults(query: string): Promise<any[]> {
  const { cacheService } = await import("../../cache");
  const cacheKey = "search_results";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<any[]>(cacheKey, { query, hash });
  if (cached) {
    console.log(`Returning cached search results for "${query}"`);
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.SEARCH}?search=${encodedQuery}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }

    const searchResults: any[] = await response.json();
    console.log("Search results response:", searchResults);

    // Transform search results to include decoded titles
    const transformedResults = searchResults.map((result) => ({
      ...result,
      title: decodeHtmlEntities(stripHtml(result.title)),
    }));

    // Cache the result
    await cacheService.set(cacheKey, transformedResults, { query, hash });

    return transformedResults;
  } catch (error) {
    console.error("Error fetching search results:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<any[]>(cacheKey, { query });
    if (staleCache) {
      console.log(
        `Returning stale cached search results for "${query}" due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}
