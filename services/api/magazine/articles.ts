/**
 * Magazine Articles API
 *
 * Functions for fetching magazine articles and PDF article details.
 * Uses the emap-epaper-development API.
 */

import { CACHE_KEYS, EPAPER_BASE_URL, MAGAZINE_API_BASE_URL } from "./config";
import type { MagazineArticleResponse, PDFArticleDetail } from "./types";

/**
 * Fetch article details for a specific edition and article
 *
 * Returns article data from /articles/[edition id]/[article id] endpoint.
 * Results are cached for 24 hours per article.
 *
 * @param editionId - The edition ID containing the article
 * @param articleId - The article ID to fetch
 * @returns Promise resolving to article data
 * @throws Error if API request fails and no cached data is available
 *
 * @example
 * ```typescript
 * const article = await fetchMagazineArticle('2024-01', 'article-123');
 * // {
 * //   id: 'article-123',
 * //   title: 'Article Title',
 * //   content: [...],
 * //   ...
 * // }
 * ```
 */
export async function fetchMagazineArticle(
  editionId: string,
  articleId: string
): Promise<MagazineArticleResponse> {
  const { cacheService } = await import("../../cache");
  const cacheKey = CACHE_KEYS.ARTICLE;

  // Try to get from cache first
  const cached = await cacheService.get<MagazineArticleResponse>(cacheKey, {
    editionId,
    articleId,
  });
  if (cached) {
    console.log(
      `Returning cached magazine article for ${editionId}/${articleId}`
    );
    return cached;
  }

  try {
    const response = await fetch(
      `${MAGAZINE_API_BASE_URL}/articles/${editionId}/${articleId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch magazine article: ${response.status}`);
    }

    const articleData: MagazineArticleResponse = await response.json();
    console.log(
      `Magazine article response for ${editionId}/${articleId}:`,
      articleData
    );

    // Validate article data structure
    if (!articleData.id || !articleData.title) {
      throw new Error("Invalid article response format");
    }

    // Cache the result for 24 hours
    await cacheService.set(cacheKey, articleData, { editionId, articleId });

    return articleData;
  } catch (error) {
    console.error(
      `Error fetching magazine article for ${editionId}/${articleId}:`,
      error
    );

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<MagazineArticleResponse>(
      cacheKey,
      { editionId, articleId }
    );
    if (staleCache) {
      console.log(
        `Returning stale cached magazine article for ${editionId}/${articleId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}

/**
 * Fetch PDF article detail from emap-epaper API
 *
 * Used when user clicks on article annotation in PDF viewer.
 * Returns detailed article data including content blocks, infoboxes, and bounding boxes.
 * Results are cached for 24 hours per article.
 *
 * @param editionId - The edition ID containing the article
 * @param articleId - The article ID to fetch
 * @returns Promise resolving to PDF article detail data
 * @throws Error if API request fails and no cached data is available
 *
 * @example
 * ```typescript
 * const article = await fetchPDFArticleDetail('2024-01', 'article-123');
 * // {
 * //   article_id: 'article-123',
 * //   page: 5,
 * //   title: 'Article Title',
 * //   blocks: [...],
 * //   content: { plain: '...', paragraphs: [...] },
 * //   ...
 * // }
 * ```
 */
export async function fetchPDFArticleDetail(
  editionId: string,
  articleId: string
): Promise<PDFArticleDetail> {
  const { cacheService } = await import("../../cache");
  const cacheKey = CACHE_KEYS.PDF_ARTICLE_DETAIL;

  // Try to get from cache first
  const cached = await cacheService.get<PDFArticleDetail>(cacheKey, {
    editionId,
    articleId,
  });
  if (cached) {
    console.log(`✅ Returning cached PDF article ${editionId}/${articleId}`);
    return cached;
  }

  try {
    const url = `${EPAPER_BASE_URL}/articles/${editionId}/${articleId}`;
    console.log(`🔄 Fetching PDF article from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch PDF article: ${response.status} ${response.statusText}`
      );
    }

    const articleData: PDFArticleDetail = await response.json();
    console.log(`✅ PDF article fetched successfully:`, articleData.title);

    // Cache the result
    await cacheService.set(cacheKey, articleData, {
      editionId,
      articleId,
    });

    return articleData;
  } catch (error) {
    console.error(
      `❌ Error fetching PDF article ${editionId}/${articleId}:`,
      error
    );

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<PDFArticleDetail>(cacheKey, {
      editionId,
      articleId,
    });
    if (staleCache) {
      console.log(
        `⚠️ Returning stale cached PDF article for ${editionId}/${articleId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}
