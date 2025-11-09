/**
 * WordPress Articles API
 *
 * Functions for fetching and managing WordPress articles.
 * Includes highlights, featured articles, and single article retrieval.
 */

import { Article, StructuredContentNode } from "@/types";
import { Dimensions } from "react-native";
import { HighlightsApiItem, PostApiResponse } from "../types";
import { extractCategoryFromUrl, formatDate } from "../utils/formatters";
import { decodeHtmlEntities, stripHtml } from "../utils/parsers";
import { ENDPOINTS, getApiConfig } from "./config";
import { fetchMediaUrl } from "./media";
/**
 * Fetch post ID by slug for deep linking
 * Used to resolve article slugs to IDs for navigation
 */
export async function getPostBySlug(slug: string): Promise<{ id: number }> {
  try {
    const { baseUrl, hash } = getApiConfig();
    const endpoint = `/wp-json/mbm-apps/v1/get-post-by-slug/?slug=${encodeURIComponent(
      slug
    )}&hash=${hash}&_fields=id`;

    console.log(`🔗 Resolving slug to ID: ${slug}`);
    console.log(`🔗 API call: ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch post by slug: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data || !data.id) {
      throw new Error("Invalid response: missing id field");
    }

    console.log(`✅ Resolved slug "${slug}" to ID: ${data.id}`);
    return { id: data.id };
  } catch (error) {
    console.error("❌ Error fetching post by slug:", error);
    throw error;
  }
}

/**
 * Transform highlights API item to Article interface
 *
 * Handles device orientation detection and image selection logic.
 * Selects appropriate image (landscape vs portrait) based on device type and orientation.
 *
 * @param item - Raw highlights API item
 * @returns Promise resolving to transformed Article
 */
async function transformHighlightsItemToArticle(
  item: HighlightsApiItem
): Promise<Article> {
  // Detect device orientation
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isDeviceLandscape = screenWidth > screenHeight;
  const isTablet = Math.min(screenWidth, screenHeight) >= 600; // Tablets typically have min dimension >= 600

  // Check if debug setting is enabled to force landscape images
  const AsyncStorage = (
    await import("@react-native-async-storage/async-storage")
  ).default;
  const forceLandscape = await AsyncStorage.getItem(
    "debug_force_landscape_images"
  );
  const useLandscape = forceLandscape === "true";

  // Select image and dimensions based on device orientation and debug setting
  let imageUrl: string;
  let imageWidth: number;
  let imageHeight: number;

  // On tablets in landscape mode, prioritize landscape images (post_image)
  // Otherwise, use portrait images (post_highlights_image) for better vertical fill
  const shouldUseLandscapeImage =
    useLandscape || (isTablet && isDeviceLandscape);

  console.log("🖼️ Image selection for article:", {
    articleId: item.post_id,
    title: item.post_title.substring(0, 40),
    screenWidth,
    screenHeight,
    isDeviceLandscape,
    isTablet,
    shouldUseLandscapeImage,
    post_image_url: item.post_image?.substring(
      item.post_image.lastIndexOf("/") + 1,
      item.post_image.lastIndexOf("/") + 30
    ),
    post_image_dims: `${item.post_image_width}x${item.post_image_height}`,
    post_highlights_image_url: item.post_highlights_image?.substring(
      item.post_highlights_image.lastIndexOf("/") + 1,
      item.post_highlights_image.lastIndexOf("/") + 30
    ),
    post_highlights_image_dims: `${item.post_highlights_image_width}x${item.post_highlights_image_height}`,
  });

  if (shouldUseLandscapeImage) {
    imageUrl =
      item.post_image ||
      item.post_highlights_image ||
      "https://picsum.photos/800/600?random=1";
    imageWidth =
      item.post_image_width || item.post_highlights_image_width || 800;
    imageHeight =
      item.post_image_height || item.post_highlights_image_height || 600;
    console.log(
      "✅ Using landscape image (post_image):",
      imageUrl.substring(0, 50)
    );
  } else {
    imageUrl =
      item.post_highlights_image ||
      item.post_image ||
      "https://picsum.photos/800/600?random=1";
    imageWidth =
      item.post_highlights_image_width || item.post_image_width || 800;
    imageHeight =
      item.post_highlights_image_height || item.post_image_height || 600;
    console.log(
      "✅ Using portrait image (post_highlights_image):",
      imageUrl.substring(0, 50)
    );
  }

  // Determine if image is landscape (width > height)
  const isLandscape = imageWidth > imageHeight;
  console.log("📐 Final image dimensions:", {
    imageWidth,
    imageHeight,
    isLandscape,
  });

  const category = extractCategoryFromUrl(item.post_url);

  return {
    id: item.post_id.toString(),
    title: decodeHtmlEntities(stripHtml(item.post_title)),
    leadText: stripHtml(item.post_excerpt),
    content: stripHtml(item.post_excerpt), // Will be replaced with full content when viewing article
    imageUrl,
    timestamp: formatDate(item.post_publish_date),
    category,
    isLandscape,
  };
}

/**
 * Fetch articles from highlights API
 *
 * Retrieves the main article feed for the home screen.
 * Results are cached based on device orientation.
 *
 * @returns Promise resolving to array of Article objects
 *
 * @example
 * const articles = await fetchArticles();
 * // Returns: [{ id: "123", title: "Article Title", ... }, ...]
 */
export async function fetchArticles(): Promise<Article[]> {
  const { cacheService } = await import("../../cache");
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isDeviceLandscape = screenWidth > screenHeight;
  const orientation = isDeviceLandscape ? "landscape" : "portrait";
  const cacheKey = `highlights_${orientation}`;
  const { hash } = getApiConfig();

  console.log(
    `📦 Cache key: ${cacheKey} (device: ${screenWidth}x${screenHeight})`
  );

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, { hash });
  if (cached) {
    console.log(`✅ Returning cached articles for ${orientation} mode`);
    return cached;
  }
  try {
    const { baseUrl } = getApiConfig();
    console.log("api call", `${baseUrl}${ENDPOINTS.HIGHLIGHTS}?hash=${hash}`);
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.HIGHLIGHTS}?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }

    const highlightsItems: HighlightsApiItem[] = await response.json();
    const articles = await Promise.all(
      highlightsItems.map(transformHighlightsItemToArticle)
    );

    // Cache the result
    await cacheService.set(cacheKey, articles, { hash });

    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey);
    if (staleCache) {
      console.log("Returning stale cached articles due to API error");
      return staleCache;
    }

    throw error;
  }
}

/**
 * Get featured articles (limited by maxNbOfItems with valid highlight images)
 *
 * Fetches articles that have valid highlight images, filtered and limited
 * by the brand's maxNbOfItems configuration.
 *
 * @returns Promise resolving to array of featured Article objects
 *
 * @example
 * const featured = await fetchFeaturedArticles();
 * // Returns: [{ id: "123", title: "Featured Article", ... }, ...]
 */
export async function fetchFeaturedArticles(): Promise<Article[]> {
  const { cacheService } = await import("../../cache");
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isDeviceLandscape = screenWidth > screenHeight;
  const orientation = isDeviceLandscape ? "landscape" : "portrait";
  const cacheKey = `featured_articles_${orientation}`;
  const { hash, maxNbOfItems = 10 } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, { hash });
  if (cached) {
    // return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    console.log("api call", `${baseUrl}${ENDPOINTS.HIGHLIGHTS}?hash=${hash}`);
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.HIGHLIGHTS}?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch featured articles");
    }

    const highlightsItems: HighlightsApiItem[] = await response.json();

    // Filter to only include items with valid post_highlights_image
    const itemsWithHighlightImages = highlightsItems.filter(
      (item) =>
        item.post_highlights_image && item.post_highlights_image.trim() !== ""
    );

    // Transform and return limited by maxNbOfItems
    console.log("itemsWithHighlightImages", itemsWithHighlightImages.length);
    console.log("maxNbOfItems", maxNbOfItems);
    const featuredArticles = await Promise.all(
      itemsWithHighlightImages
        .slice(0, maxNbOfItems)
        .map(transformHighlightsItemToArticle)
    );

    // Cache the result
    await cacheService.set(cacheKey, featuredArticles, { hash });

    return featuredArticles;
  } catch (error) {
    console.error("Error fetching featured articles:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey);
    if (staleCache) {
      console.log("Returning stale cached featured articles due to API error");
      return staleCache;
    }

    throw error;
  }
}

/**
 * Fetch a single article by ID
 *
 * Retrieves complete article data including structured content.
 * Used when viewing article details.
 *
 * @param articleId - The WordPress post ID
 * @returns Promise resolving to Article object
 *
 * @example
 * const article = await fetchSingleArticle("12345");
 * // Returns: { id: "12345", title: "Article Title", content: [...], ... }
 */
export async function fetchSingleArticle(articleId: string): Promise<Article> {
  const { cacheService } = await import("../../cache");
  const cacheKey = "single_article";
  const { hash } = getApiConfig();
  const { baseUrl } = getApiConfig();
  console.log(
    "fetching article",
    `${baseUrl}${ENDPOINTS.INDIVIDUAL_POST}/${articleId}/?hash=${hash}`
  );
  // Try to get from cache first
  const cached = await cacheService.get<Article>(cacheKey, { articleId, hash });
  if (cached) {
    console.log(`Returning cached single article for ${articleId}`);
    return cached;
  }

  try {
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.INDIVIDUAL_POST}/${articleId}/?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch article");
    }

    const postData: PostApiResponse = await response.json();
    // console.log("Single article response:", postData);

    // Extract image URL from featured_media if available
    let imageUrl = "https://picsum.photos/800/600?random=1";
    if (postData.featured_media) {
      try {
        imageUrl = await fetchMediaUrl(postData.featured_media);
      } catch {
        console.warn("Failed to fetch featured media, using fallback");
      }
    }

    // Extract category from URL
    const category = extractCategoryFromUrl(postData.link);

    // Return structured content instead of parsed text
    let content: string | StructuredContentNode[] = "";
    if (
      postData.content &&
      postData.content.rendered &&
      Array.isArray(postData.content.rendered)
    ) {
      content = postData.content.rendered;
    }

    // Transform to Article interface
    const article: Article = {
      id: postData.id.toString(),
      title: decodeHtmlEntities(stripHtml(postData.title.rendered)),
      leadText: stripHtml(postData.excerpt.rendered),
      content,
      imageUrl,
      timestamp: formatDate(postData.date),
      category,
      link: postData.link, // Include the shareable link from API
    };

    // Cache the result
    await cacheService.set(cacheKey, article, { articleId, hash });

    return article;
  } catch (error) {
    console.error("Error fetching single article:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article>(cacheKey, { articleId });
    if (staleCache) {
      console.log(
        `Returning stale cached single article for ${articleId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}

/**
 * Get all news articles (alias for fetchArticles)
 *
 * @returns Promise resolving to array of Article objects
 */
export async function fetchNewsArticles(): Promise<Article[]> {
  return await fetchArticles();
}
