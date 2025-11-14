/**
 * WordPress Clinical Posts API
 *
 * Functions for fetching clinical articles with filtering and pagination.
 * Handles specialized clinical content with taxonomy filtering.
 */

import { Article, ClinicalArticlesResponse, ClinicalPost } from "@/types";
import { extractCategoryFromUrl } from "../utils/formatters";
import { decodeHtmlEntities, stripHtml } from "../utils/parsers";
import { ENDPOINTS, getApiConfig } from "./config";

/**
 * Transform clinical post to Article interface
 *
 * Converts raw clinical post data into a standardized Article object.
 * Handles image dimensions and category extraction.
 *
 * @param post - Raw clinical post data
 * @returns Transformed Article object
 */
function transformClinicalPostToArticle(post: ClinicalPost): Article {
  return {
    id: post.post_id.toString(),
    title: decodeHtmlEntities(stripHtml(post.post_title)),
    leadText: stripHtml(post.post_excerpt || ""),
    content: "",
    imageUrl: post.post_image || "https://picsum.photos/800/600?random=1",
    timestamp: post.post_publish_date,
    category: extractCategoryFromUrl(post.post_url),
    isLandscape: post.post_image_width > post.post_image_height,
  };
}

/**
 * Fetch clinical articles with pagination
 *
 * Retrieves clinical posts filtered by taxonomy (type: 2404).
 * Supports pagination with 40 items per page.
 *
 * @param page - Page number to fetch (1-based)
 * @returns Promise resolving to object with articles array and hasMore flag
 *
 * @example
 * const { articles, hasMore } = await fetchClinicalArticles(1);
 * // Returns: { articles: [...], hasMore: true }
 */
export async function fetchClinicalArticles(
  page: number = 1
): Promise<{ articles: Article[]; hasMore: boolean }> {
  const { hash, baseUrl } = getApiConfig();

  // Fixed parameters for clinical articles
  const params = new URLSearchParams({
    hash: hash,
    include_taxonomy: "type",
    include_term: "2404",
    per_page: "40",
    page: page.toString(),
  });

  const url = `${baseUrl}${ENDPOINTS.CLINICAL}/?${params.toString()}`;
  console.log("Fetching clinical articles:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch clinical articles: ${response.status}`);
  }

  const data: ClinicalArticlesResponse = await response.json();
  console.log(`Clinical articles response for page ${page}:`, {
    articlesCount: data.articles?.length,
    currentPage: data.page,
    totalPages: data.total_pages,
    total: data.total,
  });

  // Transform posts to articles
  const articles = (data.articles || []).map(transformClinicalPostToArticle);

  // Determine if there are more pages based on API response
  const hasMore = data.page < data.total_pages;

  return { articles, hasMore };
}
