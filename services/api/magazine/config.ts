/**
 * Magazine API Configuration
 *
 * Configuration constants for the emap-epaper-development API.
 * This includes base URLs for both magazine editions and PDF article details.
 */

/**
 * Base URL for magazine editions API
 * Handles edition lists, covers, PDFs, and articles
 */
export const MAGAZINE_API_BASE_URL =
  "https://emap-epaper-development.gdkzr.com";

/**
 * Base URL for PDF article detail API
 * Used when user clicks on article annotation in PDF viewer
 */
export const EPAPER_BASE_URL = "https://emap-epaper-development.gdkzr.com";

/**
 * Cache durations in milliseconds
 */
export const CACHE_DURATIONS = {
  /** Cache duration for magazine editions list (1 hour) */
  EDITIONS: 3600000,
  /** Cache duration for magazine covers (24 hours) */
  COVERS: 86400000,
  /** Cache duration for magazine PDFs (24 hours) */
  PDFS: 86400000,
  /** Cache duration for magazine articles (24 hours) */
  ARTICLES: 86400000,
  /** Cache duration for edition data (24 hours) */
  EDITION_DATA: 86400000,
  /** Cache duration for PDF article details (24 hours) */
  PDF_ARTICLE_DETAILS: 86400000,
};

/**
 * Cache keys for magazine-related data
 */
export const CACHE_KEYS = {
  EDITIONS: "magazine_editions",
  COVER: "magazine_cover",
  PDF: "magazine_pdf",
  ARTICLE: "magazine_article",
  EDITION_DATA: "magazine_edition_data",
  PDF_ARTICLE_DETAIL: "pdf_article_detail",
};
