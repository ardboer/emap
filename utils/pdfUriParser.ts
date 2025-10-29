export interface ParsedPDFUri {
  editionId: string;
  articleId: string;
}

/**
 * Parse PDF annotation URI to extract edition ID and article ID
 * Example: /articles/e4a4395e135a5524/p8-a10
 * Returns: { editionId: 'e4a4395e135a5524', articleId: 'p8-a10' }
 */
export function parsePDFArticleUri(uri: string): ParsedPDFUri | null {
  try {
    // Remove leading slash if present
    const cleanUri = uri.startsWith("/") ? uri.slice(1) : uri;

    // Expected format: articles/{editionId}/{articleId}
    const parts = cleanUri.split("/");

    if (parts.length !== 3 || parts[0] !== "articles") {
      console.warn("Invalid PDF article URI format:", uri);
      return null;
    }

    return {
      editionId: parts[1],
      articleId: parts[2],
    };
  } catch (error) {
    console.error("Error parsing PDF article URI:", error);
    return null;
  }
}
