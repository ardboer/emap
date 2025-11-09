/**
 * WordPress Events API
 *
 * Functions for fetching and managing WordPress events (MEC plugin).
 * Handles event listings and individual event details.
 */

import { formatDate } from "../utils/formatters";
import { decodeHtmlEntities, stripHtml } from "../utils/parsers";
import { ENDPOINTS, getApiConfig } from "./config";
import { fetchMediaUrl } from "./media";

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
    event.id &&
    event.title &&
    event.title.rendered &&
    event.date
  );
}

/**
 * Transform WordPress event to Event interface
 *
 * Converts raw WordPress event data into a standardized event object.
 * Fetches featured media and formats content.
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
  const { cacheService } = await import("../../cache");
  const cacheKey = "events";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<any[]>(cacheKey, { hash });
  if (cached) {
    console.log("Returning cached events");
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.EVENTS}?hash=${hash}&_fields=id,title,excerpt,content,featured_media,date,link`
    );
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
          console.warn(`Failed to transform event ${event.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any null results from failed transformations
    const successfulEvents = events.filter((event) => event !== null);

    // Cache the result
    await cacheService.set(cacheKey, successfulEvents, { hash });

    return successfulEvents;
  } catch (error) {
    console.error("Error fetching events:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<any[]>(cacheKey);
    if (staleCache) {
      console.log("Returning stale cached events due to API error");
      return staleCache;
    }

    throw error;
  }
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
  const { cacheService } = await import("../../cache");
  const cacheKey = "single_event";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<any>(cacheKey, { eventId, hash });
  if (cached) {
    console.log(`Returning cached single event for ${eventId}`);
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
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

    // Extract image URL from featured_media if available
    let imageUrl = "https://picsum.photos/800/600?random=1";
    if (eventData.featured_media) {
      try {
        imageUrl = await fetchMediaUrl(eventData.featured_media);
      } catch {
        console.warn("Failed to fetch featured media, using fallback");
      }
    }

    // Transform to Event interface
    const event: any = {
      id: eventData.id.toString(),
      title: decodeHtmlEntities(stripHtml(eventData.title.rendered)),
      excerpt:
        eventData.excerpt && eventData.excerpt.rendered
          ? stripHtml(eventData.excerpt.rendered)
          : "",
      content:
        eventData.content && eventData.content.rendered
          ? stripHtml(eventData.content.rendered)
          : "",
      imageUrl,
      timestamp: formatDate(eventData.date),
      link: eventData.link || "",
    };

    // Cache the result
    await cacheService.set(cacheKey, event, { eventId, hash });

    return event;
  } catch (error) {
    console.error("Error fetching single event:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<any>(cacheKey, { eventId });
    if (staleCache) {
      console.log(
        `Returning stale cached single event for ${eventId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}
