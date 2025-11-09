/**
 * Magazine API Types
 *
 * Type definitions for magazine editions, articles, and PDF-related functionality.
 * These types are used by the emap-epaper-development API.
 */

/**
 * Response from the /editions endpoint
 * Contains an array of available edition IDs
 */
export interface MagazineEditionsResponse {
  editions: string[];
}

/**
 * Magazine article content block
 * Represents a single content element within an article
 */
export interface MagazineArticleContent {
  type: string;
  content?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  children?: MagazineArticleContent[];
}

/**
 * Magazine article response from the API
 * Contains full article data including content blocks
 */
export interface MagazineArticleResponse {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  publishDate: string;
  content: MagazineArticleContent[];
  tags?: string[];
  category?: string;
  imageUrl?: string;
  summary?: string;
}

/**
 * Magazine edition data
 * Combines edition ID with cover and PDF URLs
 */
export interface MagazineEdition {
  id: string;
  title?: string;
  publishDate?: string;
  coverUrl?: string;
  pdfUrl?: string;
}

/**
 * PDF article content block
 * Represents a text block within a PDF article
 */
export interface PDFArticleBlock {
  bbox: number[];
  text: string;
  type: string;
  avg_size: number;
  bg_rgb: number[];
}

/**
 * PDF article infobox
 * Represents an infobox or sidebar within a PDF article
 */
export interface PDFArticleInfobox {
  bbox: number[];
  text: string;
  type: string;
  avg_size: number;
  bg_rgb: number[];
}

/**
 * PDF article content
 * Contains both plain text and structured paragraphs
 */
export interface PDFArticleContent {
  plain: string;
  paragraphs: string[];
}

/**
 * PDF article detail response
 * Complete article data from the emap-epaper API
 * Used when user clicks on article annotation in PDF viewer
 */
export interface PDFArticleDetail {
  article_id: string;
  page: number;
  title: string;
  bbox: number[];
  blocks: PDFArticleBlock[];
  infoboxes: PDFArticleInfobox[];
  content: PDFArticleContent;
  endpoints: {
    self: string;
  };
}
