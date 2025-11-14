/**
 * WordPress Events API
 *
 * Functions for fetching and managing WordPress events (MEC plugin).
 * Handles event listings and individual event details.
 */

import { formatDate, formatEventDate } from "../utils/formatters";
import { decodeHtmlEntities } from "../utils/parsers";
import { ENDPOINTS, getApiConfig } from "./config";

/**
 * Helper function to validate if an event object has required properties
 *
 * @param event - Event object to validate
 * @returns True if event has all required properties
 */
function isValidEvent(event: any): boolean {
  return (
    event &&
    typeof event === "object" &&
    event.post_id &&
    event.post_title &&
    event.start_date
  );
}

/**
 * Transform WordPress event to Event interface
 *
 * Converts raw WordPress event data into a standardized event object.
 * Handles the new mbm-apps/v1/events API format.
 *
 * @param event - Raw WordPress event data
 * @returns Promise resolving to transformed event object
 * @throws Error if event data is invalid
 */
async function transformWordPressEventToEvent(event: any): Promise<any> {
  // Ensure we have valid event data
  if (!isValidEvent(event)) {
    throw new Error("Invalid event data");
  }

  // Extract excerpt text from structured content array
  let excerptText = "";
  if (Array.isArray(event.post_excerpt) && event.post_excerpt.length > 0) {
    const firstParagraph = event.post_excerpt[0];
    if (firstParagraph.children && Array.isArray(firstParagraph.children)) {
      excerptText = firstParagraph.children
        .filter((child: any) => child.type === "text")
        .map((child: any) => child.text)
        .join("");
    }
  }

  // Extract content text from structured content array
  let contentText = "";
  if (Array.isArray(event.post_content) && event.post_content.length > 0) {
    contentText = event.post_content
      .map((node: any) => {
        if (node.children && Array.isArray(node.children)) {
          return node.children
            .filter((child: any) => child.type === "text")
            .map((child: any) => child.text)
            .join("");
        }
        return "";
      })
      .join("\n");
  }

  const imageUrl = event.post_image || "https://picsum.photos/800/600?random=1";

  return {
    id: event.post_id.toString(),
    title: decodeHtmlEntities(event.post_title),
    excerpt: excerptText,
    content: contentText,
    imageUrl,
    timestamp: formatDate(event.start_date),
    category: formatEventDate(event.start_date),
    link: event.more_info || "",
  };
}

/**
 * Fetch events from WordPress events API
 *
 * Retrieves all events from the MEC (Modern Events Calendar) plugin.
 * Filters out invalid events and transforms them to a standard format.
 *
 * @returns Promise resolving to array of event objects
 *
 * @example
 * const events = await fetchEvents();
 * // Returns: [{ id: "123", title: "Event Title", ... }, ...]
 */
export async function fetchEvents(): Promise<any[]> {
  const { hash, baseUrl } = getApiConfig();

  const response = await fetch(`${baseUrl}${ENDPOINTS.EVENTS}?hash=${hash}`);

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const wordpressEvents: any[] = await response.json();

  // Filter out empty objects and invalid events
  const validEvents = wordpressEvents.filter(isValidEvent);

  console.log(
    `Filtered ${wordpressEvents.length - validEvents.length} invalid events`
  );

  const events = await Promise.all(
    validEvents.map(async (event) => {
      try {
        return await transformWordPressEventToEvent(event);
      } catch (error) {
        console.warn(`Failed to transform event ${event.post_id}:`, error);
        return null;
      }
    })
  );

  // Filter out any null results from failed transformations
  const successfulEvents = events.filter((event) => event !== null);

  return successfulEvents;
}

/**
 * Fetch a single event by ID
 *
 * Retrieves complete event data for a specific event.
 * Used when viewing event details.
 *
 * @param eventId - The WordPress event ID
 * @returns Promise resolving to event object
 *
 * @example
 * const event = await fetchSingleEvent("12345");
 * // Returns: { id: "12345", title: "Event Title", content: "...", ... }
 */
export async function fetchSingleEvent(eventId: string): Promise<any> {
  const { hash, baseUrl } = getApiConfig();

  console.log(
    "fetchSingleEvent",
    `${baseUrl}${ENDPOINTS.EVENTS}/${eventId}?hash=${hash}`
  );

  const response = await fetch(
    `${baseUrl}${ENDPOINTS.EVENTS}/${eventId}?hash=${hash}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch event");
  }

  const eventData: any = await response.json();
  console.log("Single event response:", eventData);

  // Validate event data
  if (!isValidEvent(eventData)) {
    throw new Error("Invalid event data received");
  }

  // Use the transformation function to ensure consistency
  return await transformWordPressEventToEvent(eventData);
}
