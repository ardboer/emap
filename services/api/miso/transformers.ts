/**
 * Miso Product Transformation Utilities
 *
 * This file contains functions for transforming Miso API products into Article objects.
 * Extracted from services/api.ts as part of Phase 2 refactoring to eliminate duplication.
 */

import { Article } from "@/types";
import { formatDate } from "../utils/formatters";
import { decodeHtmlEntities, stripHtml } from "../utils/parsers";
import { MisoProduct } from "./types";

/**
 * Extracts the first category from a Miso product's nested category array
 *
 * Miso returns categories as an array of arrays: [[category1, category2], ...]
 * This function extracts the first category from the first array.
 *
 * @param product - The Miso product
 * @returns The extracted category name, or "News" as fallback
 *
 * @example
 * extractCategory({ categories: [["Sports", "Football"]] }) // Returns "Sports"
 * extractCategory({ categories: ["Sports"] }) // Returns "Sports" (handles flat array)
 * extractCategory({ categories: [] }) // Returns "News"
 */
export function extractCategory(product: MisoProduct): string {
  let category = "News";

  if (
    product.categories &&
    Array.isArray(product.categories) &&
    product.categories.length > 0
  ) {
    const firstCategoryArray = product.categories[0];
    if (Array.isArray(firstCategoryArray) && firstCategoryArray.length > 0) {
      category = firstCategoryArray[0];
    } else if (typeof firstCategoryArray === "string") {
      category = firstCategoryArray;
    }
  }

  return category;
}

/**
 * Extracts the numeric article ID from a Miso product_id
 *
 * Miso product IDs include a brand prefix (e.g., "NT-339716")
 * WordPress API expects just the numeric part ("339716")
 *
 * @param productId - The Miso product_id with brand prefix
 * @returns The numeric article ID, or the original string if no match
 *
 * @example
 * extractArticleId("NT-339716") // Returns "339716"
 * extractArticleId("JNL-12345") // Returns "12345"
 * extractArticleId("12345") // Returns "12345" (already numeric)
 */
export function extractArticleId(productId: string): string {
  const idMatch = productId.match(/\d+$/);
  return idMatch ? idMatch[0] : productId;
}

/**
 * Removes the 150x150 size constraint from Miso image URLs
 *
 * Miso often returns thumbnail URLs with "-150x150" in the filename.
 * Removing this constraint allows fetching larger images.
 *
 * @param imageUrl - The original image URL
 * @returns The URL with size constraint removed
 *
 * @example
 * removeImageSizeConstraint("https://example.com/image-150x150.jpg")
 * // Returns "https://example.com/image.jpg"
 */
export function removeImageSizeConstraint(imageUrl: string): string {
  if (imageUrl.includes("-150x150")) {
    return imageUrl.replace("-150x150", "");
  }
  return imageUrl;
}

/**
 * Transforms a Miso product into an Article object
 *
 * This is the core transformation function used by all Miso endpoints.
 * It handles:
 * - Category extraction from nested arrays
 * - Article ID extraction from product_id
 * - HTML entity decoding and tag stripping
 * - Image URL processing (removing size constraints)
 * - Date formatting
 * - Fallback values for missing data
 *
 * @param product - The Miso product to transform
 * @returns An Article object ready for use in the app
 *
 * @example
 * const article = transformMisoProductToArticle({
 *   product_id: "NT-339716",
 *   title: "Breaking News &amp; Updates",
 *   cover_image: "https://example.com/image-150x150.jpg",
 *   published_at: "2024-01-01T12:00:00Z",
 *   categories: [["Sports", "Football"]],
 *   html: "<p>Article content</p>"
 * });
 */
export function transformMisoProductToArticle(product: MisoProduct): Article {
  // Extract category
  const category = extractCategory(product);

  // Extract numeric ID from product_id (e.g., "NT-339716" -> "339716")
  const articleId = extractArticleId(product.product_id || "");

  // Process image URL - remove 150x150 constraint if present
  let imageUrl =
    product.cover_image || "https://picsum.photos/800/600?random=1";
  imageUrl = removeImageSizeConstraint(imageUrl);

  return {
    id: articleId,
    title: decodeHtmlEntities(stripHtml(product.title || "")),
    leadText: "", // Miso doesn't provide lead text
    content: product.html || "",
    imageUrl,
    timestamp: formatDate(product.published_at || new Date().toISOString()), // Pre-formatted for list views
    publishDate: product.published_at || new Date().toISOString(), // Raw ISO date for detail view
    category,
  };
}

/**
 * Transforms a Miso product with landscape image handling
 *
 * This variant is used for recommended articles with exclude functionality,
 * where we want to force landscape rendering for better appearance.
 * It removes the 150x150 size constraint and marks images as landscape.
 *
 * @param product - The Miso product to transform
 * @returns An Article object with isLandscape flag set to true
 */
export function transformMisoProductToArticleWithLandscape(
  product: MisoProduct
): Article {
  const article = transformMisoProductToArticle(product);

  // Force landscape rendering for better appearance with Miso thumbnails
  return {
    ...article,
    isLandscape: true,
  };
}
