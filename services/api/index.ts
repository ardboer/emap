/**
 * Main API Barrel Export File
 *
 * This file provides backward-compatible exports for all API functions,
 * maintaining the exact same public API as the original services/api.ts
 * while internally using the new modular structure.
 *
 * Phase 6 - Integration: Critical Migration Phase
 *
 * This barrel export ensures 100% backward compatibility during the migration
 * from the monolithic api.ts to the new modular structure. All existing imports
 * will continue to work without modification.
 *
 * @example
 * // These imports continue to work exactly as before:
 * import { fetchArticles, fetchTrendingArticles } from '@/services/api';
 * import { brandManager } from '@/services/api';
 */

// ============================================================================
// Brand Manager
// ============================================================================
export { brandManager } from "@/config/BrandManager";

// ============================================================================
// WordPress API - Articles & Content
// ============================================================================
export {
  fetchArticles,
  fetchFeaturedArticles,
  fetchNewsArticles,
  fetchSingleArticle,
  getPostBySlug,
} from "./wordpress/articles";

export {
  fetchArticleContent,
  parseStructuredContent,
} from "./wordpress/content";

// ============================================================================
// WordPress API - Navigation & Structure
// ============================================================================
export { fetchMenuItems } from "./wordpress/menu";

export { fetchCategoryContent } from "./wordpress/category";

// ============================================================================
// WordPress API - Events
// ============================================================================
export { fetchEvents, fetchSingleEvent } from "./wordpress/events";

// ============================================================================
// WordPress API - Clinical Content
// ============================================================================
export { fetchClinicalArticles } from "./wordpress/clinical";

// ============================================================================
// WordPress API - Search
// ============================================================================
export { fetchSearchResults } from "./wordpress/search";

// ============================================================================
// WordPress API - Media & Metadata
// ============================================================================
export { fetchCategoryName, fetchMediaUrl } from "./wordpress/media";

// ============================================================================
// WordPress API - Configuration
// ============================================================================
export { ENDPOINTS, getApiConfig } from "./wordpress/config";

// ============================================================================
// Miso API - Recommendations & Personalization
// ============================================================================
export { fetchTrendingArticles } from "./miso/trending";

export {
  fetchRecommendedArticles,
  fetchRecommendedArticlesWithExclude,
} from "./miso/recommended";

export { fetchRelatedArticles } from "./miso/related";

export { fetchHighlightsWithRecommendations } from "./miso/highlights";

// ============================================================================
// Miso API - Advanced Exports
// ============================================================================
export { fetchMisoRecommendations } from "./miso/client";

export {
  extractArticleId,
  extractCategory,
  removeImageSizeConstraint,
  transformMisoProductToArticle,
  transformMisoProductToArticleWithLandscape,
} from "./miso/transformers";

// ============================================================================
// Magazine API - Editions & Content
// ============================================================================
export {
  fetchMagazineCover,
  fetchMagazineEditionData,
  fetchMagazineEditions,
  fetchMagazinePDF,
} from "./magazine/editions";

export {
  fetchMagazineArticle,
  fetchPDFArticleDetail,
} from "./magazine/articles";

// ============================================================================
// Magazine API - Configuration
// ============================================================================
export {
  CACHE_DURATIONS,
  CACHE_KEYS,
  EPAPER_BASE_URL,
  MAGAZINE_API_BASE_URL,
} from "./magazine/config";

// ============================================================================
// Utility Functions - Parsing
// ============================================================================
export {
  decodeHtmlEntities,
  parseStructuredContent as parseStructuredContentUtil,
  stripHtml,
} from "./utils/parsers";

// ============================================================================
// Utility Functions - Formatting
// ============================================================================
export { extractCategoryFromUrl, formatDate } from "./utils/formatters";

// ============================================================================
// Utility Functions - Transformers
// ============================================================================
export {
  transformHighlightsItemToArticle,
  transformPostToArticle,
} from "./utils/transformers";

// ============================================================================
// Utility Functions - Validators
// ============================================================================
export {
  isValidEvent,
  transformWordPressEventToEvent,
} from "./utils/validators";

// ============================================================================
// TypeScript Type Exports - Core Types
// ============================================================================
export type {
  HighlightsApiItem,
  LegacyCategoryResponse,
  MediaResponse,
  PostApiResponse,
  WordPressPost,
} from "./types";

// ============================================================================
// TypeScript Type Exports - Magazine Types
// ============================================================================
export type {
  MagazineArticleContent,
  MagazineArticleResponse,
  MagazineEdition,
  MagazineEditionsResponse,
  PDFArticleBlock,
  PDFArticleContent,
  PDFArticleDetail,
  PDFArticleInfobox,
} from "./magazine/types";

// ============================================================================
// TypeScript Type Exports - Miso Types
// ============================================================================
export type {
  MisoApiResponse,
  MisoProduct,
  MisoRequestParams,
} from "./miso/types";
