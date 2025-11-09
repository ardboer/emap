/**
 * Miso API Module - Main Export File
 *
 * This module provides a clean interface to all Miso recommendation endpoints.
 * Part of Phase 2 refactoring to eliminate code duplication.
 *
 * Usage:
 * ```typescript
 * import { fetchTrendingArticles, fetchRecommendedArticles } from '@/services/api/miso';
 * ```
 */

// Export all Miso endpoint functions
export { fetchHighlightsWithRecommendations } from "./highlights";
export {
  fetchRecommendedArticles,
  fetchRecommendedArticlesWithExclude,
} from "./recommended";
export { fetchRelatedArticles } from "./related";
export { fetchTrendingArticles } from "./trending";

// Export types for external use
export type { MisoApiResponse, MisoProduct, MisoRequestParams } from "./types";

// Export transformers for advanced use cases
export {
  extractArticleId,
  extractCategory,
  removeImageSizeConstraint,
  transformMisoProductToArticle,
  transformMisoProductToArticleWithLandscape,
} from "./transformers";

// Export client for advanced use cases
export { fetchMisoRecommendations } from "./client";
