/**
 * Data Transformation Utilities
 *
 * This file contains functions for transforming API responses into application data structures.
 * Extracted from services/api.ts as part of the refactoring effort.
 */

import { Article } from "@/types";
import { Dimensions } from "react-native";
import {
  HighlightsApiItem,
  LegacyCategoryResponse,
  MediaResponse,
  WordPressPost,
} from "../types";
import { extractCategoryFromUrl, formatDate } from "./formatters";
import { decodeHtmlEntities, stripHtml } from "./parsers";

// TODO: These functions depend on fetchMediaUrl and fetchCategoryName from api.ts
// They will be moved to a separate media.ts utility file in Phase 2
// For now, we inline the implementations to avoid circular dependencies

/**
 * Fetches the media URL for a given WordPress media ID
 *
 * @param mediaId - WordPress media ID
 * @returns Promise resolving to the media URL
 *
 * NOTE: This is a temporary inline implementation. Will be moved to
 * services/api/utils/media.ts in Phase 2 of the refactoring.
 */
async function fetchMediaUrl(mediaId: number): Promise<string> {
  try {
    // TODO: Import getApiConfig from config.ts once created in Phase 2
    const { brandManager } = await import("@/config/BrandManager");
    const config = brandManager.getApiConfig();
    const baseUrl = config.baseUrl;

    const response = await fetch(`${baseUrl}/wp-json/wp/v2/media/${mediaId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch media");
    }
    const media: MediaResponse = await response.json();
    return media.source_url;
  } catch (error) {
    console.error("Error fetching media:", error);
    return "https://picsum.photos/800/600?random=1"; // Fallback image
  }
}

/**
 * Fetches the category name for a given WordPress category ID
 *
 * @param categoryId - WordPress category ID
 * @returns Promise resolving to the category name
 *
 * NOTE: This is a temporary inline implementation. Will be moved to
 * services/api/utils/media.ts in Phase 2 of the refactoring.
 */
async function fetchCategoryName(categoryId: number): Promise<string> {
  try {
    // TODO: Import getApiConfig from config.ts once created in Phase 2
    const { brandManager } = await import("@/config/BrandManager");
    const config = brandManager.getApiConfig();
    const baseUrl = config.baseUrl;

    const response = await fetch(
      `${baseUrl}/wp-json/wp/v2/categories/${categoryId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch category");
    }
    const category: LegacyCategoryResponse = await response.json();
    return category.name;
  } catch (error) {
    console.error("Error fetching category:", error);
    return "News"; // Fallback category
  }
}

/**
 * Transforms a WordPress Highlights API item into an Article object
 *
 * This function handles:
 * - Device orientation detection (landscape vs portrait)
 * - Tablet detection
 * - Image selection based on device characteristics
 * - Debug mode for forcing landscape images
 * - HTML entity decoding and tag stripping
 * - Category extraction from URL
 *
 * Image Selection Logic:
 * - Tablets in landscape mode: Use post_image (landscape)
 * - Other devices: Use post_highlights_image (portrait) for better vertical fill
 * - Debug mode: Force landscape images when enabled
 *
 * @param item - The highlights API item to transform
 * @returns Promise resolving to an Article object
 *
 * @example
 * const article = await transformHighlightsItemToArticle({
 *   post_id: 123,
 *   post_title: 'Breaking News',
 *   post_excerpt: 'Article summary...',
 *   post_image: 'https://example.com/image.jpg',
 *   // ... other fields
 * });
 */
export async function transformHighlightsItemToArticle(
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

  // Track if we're using a fallback to landscape image
  let usingLandscapeFallback = false;

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
    // Check if portrait image is available
    if (item.post_highlights_image) {
      // Portrait image is available, use it
      imageUrl = item.post_highlights_image;
      imageWidth = item.post_highlights_image_width || 800;
      imageHeight = item.post_highlights_image_height || 1200;
      console.log(
        "✅ Using portrait image (post_highlights_image):",
        imageUrl.substring(0, 50)
      );
    } else {
      // No portrait image available, fall back to landscape
      imageUrl = item.post_image || "https://picsum.photos/800/600?random=1";
      imageWidth = item.post_image_width || 800;
      imageHeight = item.post_image_height || 600;
      usingLandscapeFallback = true;
      console.log(
        "⚠️ No portrait image available, using landscape fallback:",
        imageUrl.substring(0, 50)
      );
    }
  }

  // Determine if image is landscape (width > height) OR if we're using landscape as fallback
  const isLandscape = imageWidth > imageHeight || usingLandscapeFallback;
  console.log("📐 Final image dimensions:", {
    imageWidth,
    imageHeight,
    isLandscape,
    usingLandscapeFallback,
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
 * Transforms a legacy WordPress post into an Article object
 *
 * This function is used for backward compatibility with older WordPress API endpoints.
 * It fetches the featured media and category information separately.
 *
 * @param post - The WordPress post to transform
 * @returns Promise resolving to an Article object
 *
 * @example
 * const article = await transformPostToArticle({
 *   id: 123,
 *   title: { rendered: 'Article Title' },
 *   excerpt: { rendered: 'Article excerpt...' },
 *   featured_media: 456,
 *   categories: [789],
 *   date: '2024-01-01T12:00:00Z'
 * });
 */
export async function transformPostToArticle(
  post: WordPressPost
): Promise<Article> {
  const imageUrl = post.featured_media
    ? await fetchMediaUrl(post.featured_media)
    : "https://picsum.photos/800/600?random=1";
  const category =
    post.categories.length > 0
      ? await fetchCategoryName(post.categories[0])
      : "News";

  return {
    id: post.id.toString(),
    title: stripHtml(post.title.rendered),
    leadText: stripHtml(post.excerpt.rendered),
    content: stripHtml(post.excerpt.rendered), // Will be replaced with structured content when viewing full article
    imageUrl,
    timestamp: formatDate(post.date),
    category,
  };
}
