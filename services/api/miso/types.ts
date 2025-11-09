/**
 * Miso API Type Definitions
 *
 * This file contains TypeScript interfaces and types specific to the Miso recommendation API.
 * Part of Phase 2 refactoring to eliminate code duplication in Miso API calls.
 */

/**
 * Parameters for making Miso API requests
 * Used by the shared client to construct API calls
 */
export interface MisoRequestParams {
  /** Number of results to return */
  limit: number;
  /** User ID for authenticated requests (will be prefixed with "sub:") */
  userId?: string;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Array of product IDs to exclude from results */
  excludeIds?: string[];
  /** Product ID for product-to-products recommendations (with brand prefix) */
  productId?: string;
  /** Custom filters to add to the request body */
  customFilters?: Record<string, any>;
}

/**
 * Miso product structure as returned by the API
 * Represents an article in Miso's recommendation system
 */
export interface MisoProduct {
  /** Product ID with brand prefix (e.g., "NT-339716") */
  product_id: string;
  /** Article title (may contain HTML entities) */
  title: string;
  /** Cover image URL (may be 150x150 thumbnail) */
  cover_image?: string;
  /** Publication date in ISO format */
  published_at?: string;
  /** Nested array of categories [[category1, category2], ...] */
  categories?: string[][];
  /** HTML content of the article */
  html?: string;
}

/**
 * Miso API response structure
 * The API returns products nested in data.data.products or data.products
 */
export interface MisoApiResponse {
  data?: {
    products?: MisoProduct[];
  };
  products?: MisoProduct[];
}
