/**
 * WordPress API Configuration
 *
 * Shared configuration and endpoint definitions for WordPress API modules.
 * Provides centralized access to API configuration and endpoint URLs.
 */

import { brandManager } from "@/config/BrandManager";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cache for staging mode setting to avoid async calls in sync contexts
let cachedUseStagingMode: boolean | null = null;
let cachedDebugModeEnabled: boolean | null = null;
let cacheInitialized = false;

// Initialize cache on module load
AsyncStorage.getItem("debug_use_staging").then((value) => {
  cachedUseStagingMode = value === "true";
  cacheInitialized = true;
  console.log("🔧 Staging mode cache initialized:", cachedUseStagingMode);
});

// Also cache debug mode status for production
AsyncStorage.getItem("debug_mode_enabled").then((value) => {
  cachedDebugModeEnabled = value === "true";
  console.log("🔧 Debug mode cache initialized:", cachedDebugModeEnabled);
});

/**
 * Update the staging mode cache
 * Call this when the debug setting changes
 */
export function updateStagingModeCache(enabled: boolean) {
  cachedUseStagingMode = enabled;
  console.log("🔧 Staging mode cache updated:", enabled);
}

/**
 * Get API configuration from the active brand
 * Checks for staging mode and returns staging config if enabled (DEV only)
 *
 * @returns API configuration object containing baseUrl, hash, and other settings
 *
 * @example
 * const { baseUrl, hash } = getApiConfig();
 * const url = `${baseUrl}/wp-json/wp/v2/posts?hash=${hash}`;
 */
export function getApiConfig() {
  const config = brandManager.getApiConfig();

  // Check if staging mode is enabled (when __DEV__ OR debug mode is enabled in production)
  const isDebugEnabled = __DEV__ || cachedDebugModeEnabled;
  if (
    isDebugEnabled &&
    cachedUseStagingMode &&
    config.stagingBaseUrl &&
    config.stagingHash
  ) {
    console.log("🔧 Using STAGING environment:", {
      baseUrl: config.stagingBaseUrl,
      hash: config.stagingHash,
    });
    return {
      ...config,
      baseUrl: config.stagingBaseUrl,
      hash: config.stagingHash,
    };
  }

  console.log("🔍 Using PRODUCTION environment:", {
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
