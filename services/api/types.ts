/**
 * API Type Definitions
 *
 * This file contains all TypeScript interfaces and types used across the API modules.
 * Extracted from services/api.ts as part of the refactoring effort.
 */

import { StructuredContentNode } from "@/types";

/**
 * Represents an item from the WordPress Highlights API endpoint
 * Used for the main article feed on the home screen
 */
export interface HighlightsApiItem {
  post_id: number;
  post_title: string;
  post_excerpt: string;
  post_image: string;
  post_image_width: number;
  post_image_height: number;
  post_highlights_image: string;
  post_highlights_image_width: number;
  post_highlights_image_height: number;
  post_url: string;
  post_publish_date: string;
}

/**
 * Response structure from WordPress Posts API
 * Used when fetching individual posts or structured content
 */
export interface PostApiResponse {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: StructuredContentNode[];
  };
  featured_media: number;
  link: string;
  author_data?: {
    id: string;
    first_name: string;
    last_name: string;
    bio: string;
  };
}

/**
 * Legacy WordPress post structure
 * Kept for backward compatibility with older API endpoints
 */
export interface WordPressPost {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  categories: number[];
  _links: {
    "wp:featuredmedia"?: {
      href: string;
    }[];
  };
}

/**
 * WordPress Media API response structure
 * Used when fetching featured images and media assets
 */
export interface MediaResponse {
  source_url: string;
  alt_text: string;
}

/**
 * Legacy category response from WordPress API
 * Used for fetching category names by ID
 */
export interface LegacyCategoryResponse {
  id: number;
  name: string;
}
