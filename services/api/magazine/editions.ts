/**
 * Magazine Editions API
 *
 * Functions for fetching magazine editions, covers, and PDFs.
 * Uses the emap-epaper-development API.
 */

import { CACHE_KEYS, MAGAZINE_API_BASE_URL } from "./config";
import type { MagazineEdition, MagazineEditionsResponse } from "./types";

/**
 * Fetch available magazine editions
 *
 * Returns array of edition IDs from /editions endpoint.
 * Results are cached for 1 hour to reduce API calls.
 *
 * @returns Promise resolving to array of edition ID strings
 * @throws Error if API request fails and no cached data is available
 *
 * @example
 * ```typescript
 * const editions = await fetchMagazineEditions();
 * // ['2024-01', '2024-02', '2024-03']
 * ```
 */
export async function fetchMagazineEditions(): Promise<string[]> {
  const { cacheService } = await import("../../cache");
  const cacheKey = CACHE_KEYS.EDITIONS;

  // Try to get from cache first
  const cached = await cacheService.get<string[]>(cacheKey);
  if (cached) {
    console.log("Returning cached magazine editions");
    return cached;
  }

  try {
    const response = await fetch(`${MAGAZINE_API_BASE_URL}/editions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch magazine editions: ${response.status}`);
    }

    const data: MagazineEditionsResponse = await response.json();
    console.log("Magazine editions response:", data);

    if (!data.editions || !Array.isArray(data.editions)) {
      throw new Error("Invalid editions response format");
    }

    // Cache the result for 1 hour (3600000 ms)
    await cacheService.set(cacheKey, data.editions);

    return data.editions;
  } catch (error) {
    console.error("Error fetching magazine editions:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<string[]>(cacheKey);
    if (staleCache) {
      console.log("Returning stale cached magazine editions due to API error");
      return staleCache;
    }

    throw error;
  }
}

/**
 * Fetch cover image URL for a specific edition
 *
 * Returns the cover image URL from /cover/[edition id] endpoint.
 * Results are cached for 24 hours per edition.
 *
 * @param editionId - The edition ID to fetch cover for
 * @returns Promise resolving to cover image URL
 * @throws Returns fallback image URL if API request fails
 *
 * @example
 * ```typescript
 * const coverUrl = await fetchMagazineCover('2024-01');
 * // 'https://emap-epaper-development.gdkzr.com/cover/2024-01'
 * ```
 */
export async function fetchMagazineCover(editionId: string): Promise<string> {
  const { cacheService } = await import("../../cache");
  const cacheKey = CACHE_KEYS.COVER;

  // Try to get from cache first
  const cached = await cacheService.get<string>(cacheKey, { editionId });
  if (cached) {
    console.log(`Returning cached magazine cover for ${editionId}`);
    return cached;
  }

  try {
    const response = await fetch(`${MAGAZINE_API_BASE_URL}/cover/${editionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch magazine cover: ${response.status}`);
    }

    // The cover endpoint returns the image directly, so we return the URL
    const coverUrl = response.url;
    console.log(`Magazine cover URL for ${editionId}:`, coverUrl);

    // Cache the result for 24 hours
    await cacheService.set(cacheKey, coverUrl, { editionId });

    return coverUrl;
  } catch (error) {
    console.error(`Error fetching magazine cover for ${editionId}:`, error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<string>(cacheKey, { editionId });
    if (staleCache) {
      console.log(
        `Returning stale cached magazine cover for ${editionId} due to API error`
      );
      return staleCache;
    }

    // Return fallback cover image
    return "https://picsum.photos/400/600?random=1";
  }
}

/**
 * Fetch PDF URL for a specific edition
 *
 * Returns the PDF URL from /editions/[edition id] endpoint.
 * Handles both direct PDF responses and JSON responses with PDF URLs.
 * Results are cached for 24 hours per edition.
 *
 * @param editionId - The edition ID to fetch PDF for
 * @returns Promise resolving to PDF URL
 * @throws Error if API request fails and no cached data is available
 *
 * @example
 * ```typescript
 * const pdfUrl = await fetchMagazinePDF('2024-01');
 * // 'https://emap-epaper-development.gdkzr.com/editions/2024-01.pdf'
 * ```
 */
export async function fetchMagazinePDF(editionId: string): Promise<string> {
  const { cacheService } = await import("../../cache");
  const cacheKey = CACHE_KEYS.PDF;

  // Try to get from cache first
  const cached = await cacheService.get<string>(cacheKey, { editionId });
  if (cached) {
    console.log(`Returning cached magazine PDF for ${editionId}`);
    return cached;
  }

  try {
    const response = await fetch(
      `${MAGAZINE_API_BASE_URL}/editions/${editionId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch magazine PDF: ${response.status}`);
    }

    // Check if this is a direct PDF or a redirect
    const contentType = response.headers.get("content-type");
    console.log(`Content-Type for ${editionId}:`, contentType);

    let pdfUrl: string;

    if (contentType && contentType.includes("application/pdf")) {
      // Direct PDF response, use the response URL
      pdfUrl = response.url;
    } else {
      // Might be a redirect or JSON response with PDF URL
      try {
        const data = await response.json();
        pdfUrl = data.pdf_url || data.url || response.url;
      } catch {
        // If not JSON, assume the URL itself is the PDF
        pdfUrl = response.url;
      }
    }

    console.log(`Magazine PDF URL for ${editionId}:`, pdfUrl);
    console.log(
      `Original request URL: ${MAGAZINE_API_BASE_URL}/editions/${editionId}`
    );

    // Cache the result for 24 hours
    await cacheService.set(cacheKey, pdfUrl, { editionId });

    return pdfUrl;
  } catch (error) {
    console.error(`Error fetching magazine PDF for ${editionId}:`, error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<string>(cacheKey, { editionId });
    if (staleCache) {
      console.log(
        `Returning stale cached magazine PDF for ${editionId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}

/**
 * Fetch complete magazine edition data including cover and PDF URLs
 *
 * Combines multiple API calls for convenience.
 * Fetches cover and PDF URLs in parallel for better performance.
 * Results are cached for 24 hours per edition.
 *
 * @param editionId - The edition ID to fetch data for
 * @returns Promise resolving to complete edition data
 * @throws Error if API request fails and no cached data is available
 *
 * @example
 * ```typescript
 * const edition = await fetchMagazineEditionData('2024-01');
 * // {
 * //   id: '2024-01',
 * //   coverUrl: 'https://...',
 * //   pdfUrl: 'https://...'
 * // }
 * ```
 */
export async function fetchMagazineEditionData(
  editionId: string
): Promise<MagazineEdition> {
  const { cacheService } = await import("../../cache");
  const cacheKey = CACHE_KEYS.EDITION_DATA;

  // Try to get from cache first
  const cached = await cacheService.get<MagazineEdition>(cacheKey, {
    editionId,
  });
  if (cached) {
    console.log(`Returning cached magazine edition data for ${editionId}`);
    return cached;
  }

  try {
    // Fetch cover and PDF URLs in parallel
    const [coverUrl, pdfUrl] = await Promise.allSettled([
      fetchMagazineCover(editionId),
      fetchMagazinePDF(editionId),
    ]);

    const editionData: MagazineEdition = {
      id: editionId,
      coverUrl: coverUrl.status === "fulfilled" ? coverUrl.value : undefined,
      pdfUrl: pdfUrl.status === "fulfilled" ? pdfUrl.value : undefined,
    };

    console.log(`Magazine edition data for ${editionId}:`, editionData);

    // Cache the result for 24 hours
    await cacheService.set(cacheKey, editionData, { editionId });

    return editionData;
  } catch (error) {
    console.error(
      `Error fetching magazine edition data for ${editionId}:`,
      error
    );

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<MagazineEdition>(cacheKey, {
      editionId,
    });
    if (staleCache) {
      console.log(
        `Returning stale cached magazine edition data for ${editionId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}
