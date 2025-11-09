/**
 * WordPress API Module
 *
 * Barrel export file for all WordPress API functions.
 * Provides a single import point for WordPress-related API calls.
 *
 * @example
 * import { fetchArticles, fetchSingleArticle, fetchMenuItems } from '@/services/api/wordpress';
 */

// Configuration
export { ENDPOINTS, getApiConfig } from "./config";

// Media utilities
export { fetchCategoryName, fetchMediaUrl } from "./media";

// Articles
export {
  fetchArticles,
  fetchFeaturedArticles,
  fetchNewsArticles,
  fetchSingleArticle,
  getPostBySlug,
} from "./articles";

// Content
export { fetchArticleContent, parseStructuredContent } from "./content";

// Menu
export { fetchMenuItems } from "./menu";

// Events
export { fetchEvents, fetchSingleEvent } from "./events";

// Clinical posts
export { fetchClinicalArticles } from "./clinical";

// Search
export { fetchSearchResults } from "./search";

// Category content
export { fetchCategoryContent } from "./category";
