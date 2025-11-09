/**
 * Validation Utilities
 *
 * This file contains functions for validating data structures and API responses.
 * Extracted from services/api.ts as part of the refactoring effort.
 */

import { MediaResponse } from "../types";
import { formatDate } from "./formatters";
import { decodeHtmlEntities, stripHtml } from "./parsers";

// TODO: This function depends on fetchMediaUrl from api.ts
// It will be moved to a separate media.ts utility file in Phase 2

/**
 * Fetches the media URL for a given WordPress media ID
 *
 * @param mediaId - WordPress media ID
 * @returns Promise resolving to the media URL
 *
 * NOTE: This is a temporary inline implementation. Will be moved to
 * services/api/utils/media.ts in Phase 2 of the refactoring.
 */
async function fetchMediaUrl(mediaId: number): Promise<string> {
  try {
    // TODO: Import getApiConfig from config.ts once created in Phase 2
    const { brandManager } = await import("@/config/BrandManager");
    const config = brandManager.getApiConfig();
    const baseUrl = config.baseUrl;

    const response = await fetch(`${baseUrl}/wp-json/wp/v2/media/${mediaId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch media");
    }
    const media: MediaResponse = await response.json();
    return media.source_url;
  } catch (error) {
    console.error("Error fetching media:", error);
    return "https://picsum.photos/800/600?random=1"; // Fallback image
  }
}

/**
 * Validates if an object is a valid WordPress event
 *
 * Checks that the event object has all required fields:
 * - id: Event identifier
 * - title: Event title with rendered content
 * - date: Event date
 *
 * @param event - The event object to validate
 * @returns True if the event is valid, false otherwise
 *
 * @example
 * isValidEvent({ id: 123, title: { rendered: 'Event' }, date: '2024-01-01' })
 * // Returns: true
 *
 * isValidEvent({ id: 123 })
 * // Returns: false (missing title and date)
 */
export function isValidEvent(event: any): boolean {
  return (
    event &&
    typeof event === "object" &&
    event.id &&
    event.title &&
    event.title.rendered &&
    event.date
  );
}

/**
 * Transforms a WordPress event object into a standardized Event interface
 *
 * This function:
 * - Validates the event data structure
 * - Fetches the featured media image
 * - Strips HTML from title, excerpt, and content
 * - Decodes HTML entities in the title
 * - Formats the date into relative time
 *
 * @param event - The WordPress event object to transform
 * @returns Promise resolving to a transformed Event object
 * @throws Error if the event data is invalid
 *
 * @example
 * const event = await transformWordPressEventToEvent({
 *   id: 123,
 *   title: { rendered: 'Conference 2024' },
 *   excerpt: { rendered: '<p>Join us...</p>' },
 *   content: { rendered: '<p>Full details...</p>' },
 *   featured_media: 456,
 *   date: '2024-01-01T12:00:00Z',
 *   link: 'https://example.com/events/conference-2024'
 * });
 */
export async function transformWordPressEventToEvent(event: any): Promise<any> {
  // Ensure we have valid event data
  if (!isValidEvent(event)) {
    throw new Error("Invalid event data");
  }

  const imageUrl = event.featured_media
    ? await fetchMediaUrl(event.featured_media)
    : "https://picsum.photos/800/600?random=1";

  return {
    id: event.id.toString(),
    title: decodeHtmlEntities(stripHtml(event.title.rendered)),
    excerpt:
      event.excerpt && event.excerpt.rendered
        ? stripHtml(event.excerpt.rendered)
        : "",
    content:
      event.content && event.content.rendered
        ? stripHtml(event.content.rendered)
        : "",
    imageUrl,
    timestamp: formatDate(event.date),
    link: event.link || "",
  };
}
