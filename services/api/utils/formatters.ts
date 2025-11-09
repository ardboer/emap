/**
 * Formatting Utilities
 *
 * This file contains functions for formatting dates, text, and extracting information.
 * Extracted from services/api.ts as part of the refactoring effort.
 */

/**
 * Formats a date string into a human-readable relative time format
 *
 * Converts ISO date strings into relative time descriptions:
 * - Less than 1 hour: "Just now"
 * - Less than 24 hours: "X hour(s) ago"
 * - 24+ hours: "X day(s) ago"
 *
 * @param dateString - ISO 8601 date string to format
 * @returns Human-readable relative time string
 *
 * @example
 * formatDate('2024-01-01T12:00:00Z') // Returns: "5 days ago" (if current date is Jan 6)
 * formatDate(new Date().toISOString()) // Returns: "Just now"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
}

/**
 * Extracts a category name from a WordPress article URL
 *
 * Analyzes the URL path to identify category segments based on common patterns.
 * Looks for known category keywords and formats them into readable category names.
 *
 * Common category patterns detected:
 * - news
 * - patient-safety
 * - clinical
 * - management
 * - construction
 * - building
 * - infrastructure
 *
 * @param url - The full WordPress article URL
 * @returns Formatted category name (defaults to "News" if no category found)
 *
 * @example
 * extractCategoryFromUrl('https://example.com/patient-safety/article-123')
 * // Returns: "Patient Safety"
 *
 * extractCategoryFromUrl('https://example.com/news/breaking-story')
 * // Returns: "News"
 *
 * extractCategoryFromUrl('https://example.com/article-without-category')
 * // Returns: "News"
 */
export function extractCategoryFromUrl(url: string): string {
  try {
    const urlPath = new URL(url).pathname;
    const segments = urlPath.split("/").filter((segment) => segment.length > 0);

    // Look for common category patterns in URL
    const categoryKeywords = [
      "news",
      "patient-safety",
      "clinical",
      "management",
      "construction",
      "building",
      "infrastructure",
    ];

    for (const segment of segments) {
      if (categoryKeywords.some((keyword) => segment.includes(keyword))) {
        return segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }
    }

    // If no specific category found, return the first meaningful segment
    if (segments.length > 0) {
      return segments[0]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    return "News";
  } catch {
    return "News";
  }
}
