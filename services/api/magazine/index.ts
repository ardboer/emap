/**
 * Magazine API Module
 *
 * Centralized exports for all magazine-related API functionality.
 * This module provides functions for fetching magazine editions, covers, PDFs, and articles.
 */

// Export all types
export type {
  MagazineArticleContent,
  MagazineArticleResponse,
  MagazineEdition,
  MagazineEditionsResponse,
  PDFArticleBlock,
  PDFArticleContent,
  PDFArticleDetail,
  PDFArticleInfobox,
} from "./types";

// Export configuration constants
export {
  CACHE_DURATIONS,
  CACHE_KEYS,
  EPAPER_BASE_URL,
  MAGAZINE_API_BASE_URL,
} from "./config";

// Export edition functions
export {
  fetchMagazineCover,
  fetchMagazineEditionData,
  fetchMagazineEditions,
  fetchMagazinePDF,
} from "./editions";

// Export article functions
export { fetchMagazineArticle, fetchPDFArticleDetail } from "./articles";
