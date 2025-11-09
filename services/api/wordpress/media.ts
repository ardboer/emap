/**
 * WordPress Media Utilities
 *
 * Functions for fetching and managing WordPress media assets.
 * Extracted from services/api.ts as part of the refactoring effort.
 */

import { LegacyCategoryResponse, MediaResponse } from "../types";
import { ENDPOINTS, getApiConfig } from "./config";

/**
 * Fetches the media URL for a given WordPress media ID
 *
 * Makes a request to the WordPress media endpoint to retrieve the source URL
 * for a featured image or other media asset. Falls back to a placeholder image
 * if the fetch fails.
 *
 * @param mediaId - WordPress media ID
 * @returns Promise resolving to the media URL
 *
 * @example
 * const imageUrl = await fetchMediaUrl(12345);
 * // Returns: "https://example.com/wp-content/uploads/2024/01/image.jpg"
 */
export async function fetchMediaUrl(mediaId: number): Promise<string> {
  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}${ENDPOINTS.MEDIA}/${mediaId}`);
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
 * Makes a request to the WordPress categories endpoint to retrieve the
 * human-readable category name. Falls back to "News" if the fetch fails.
 *
 * @param categoryId - WordPress category ID
 * @returns Promise resolving to the category name
 *
 * @example
 * const categoryName = await fetchCategoryName(42);
 * // Returns: "Patient Safety"
 */
export async function fetchCategoryName(categoryId: number): Promise<string> {
  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.CATEGORIES}/${categoryId}`
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
