/**
 * WordPress API Configuration
 *
 * Shared configuration and endpoint definitions for WordPress API modules.
 * Provides centralized access to API configuration and endpoint URLs.
 */

import { brandManager } from "@/config/BrandManager";

/**
 * Get API configuration from the active brand
 *
 * @returns API configuration object containing baseUrl, hash, and other settings
 *
 * @example
 * const { baseUrl, hash } = getApiConfig();
 * const url = `${baseUrl}/wp-json/wp/v2/posts?hash=${hash}`;
 */
export function getApiConfig() {
  const config = brandManager.getApiConfig();
  console.log("🔍 API Config:", {
    baseUrl: config.baseUrl,
    hash: config.hash,
  });
  return config;
}

/**
 * WordPress API endpoint definitions
 *
 * Centralized endpoint paths for all WordPress API calls.
 * Use these constants instead of hardcoding endpoint strings.
 */
export const ENDPOINTS = {
  /** Standard WordPress posts endpoint */
  POSTS: "/wp-json/wp/v2/posts",

  /** Custom highlights endpoint for featured articles */
  HIGHLIGHTS: "/wp-json/mbm-apps/v1/highlights",

  /** Individual post endpoint with structured content */
  INDIVIDUAL_POST: "/wp-json/mbm-apps/v1/posts",

  /** Menu items endpoint */
  MENU: "/wp-json/mbm-apps/v1/menu",

  /** Category content endpoint with blocks */
  CATEGORY: "/wp-json/mbm-apps/v1/categories",

  /** Clinical posts filter endpoint */
  CLINICAL: "/wp-json/mbm-apps/v1/get-post-by-filter",

  /** WordPress events endpoint (MEC plugin) */
  EVENTS: "/wp-json/wp/v2/mec-events",

  /** WordPress search endpoint */
  SEARCH: "/wp-json/wp/v2/search",

  /** WordPress media endpoint */
  MEDIA: "/wp-json/wp/v2/media",

  /** WordPress categories endpoint */
  CATEGORIES: "/wp-json/wp/v2/categories",

  /** Post by slug endpoint for deep linking */
  POST_BY_SLUG: "/wp-json/mbm-apps/v1/get-post-by-slug",
} as const;
