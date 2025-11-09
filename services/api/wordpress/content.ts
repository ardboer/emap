/**
 * WordPress Content API
 *
 * Functions for fetching article content and parsing structured content.
 * Handles the transformation of WordPress structured content nodes into readable text.
 */

import { StructuredContentNode } from "@/types";
import { PostApiResponse } from "../types";
import { ENDPOINTS, getApiConfig } from "./config";

/**
 * Parse structured content recursively
 *
 * Converts WordPress structured content nodes into plain text format.
 * Handles various node types including text nodes, paragraphs, blockquotes, and links.
 *
 * @param nodes - Array of structured content nodes from WordPress
 * @returns Parsed text content with proper formatting
 *
 * @example
 * const content = parseStructuredContent(postData.content.rendered);
 * // Returns: "Paragraph 1\n\nParagraph 2\n\n\"Quote text\"\n\n..."
 */
export function parseStructuredContent(nodes: StructuredContentNode[]): string {
  let result = "";

  for (const node of nodes) {
    if (node.typename === "HTMLTextNode") {
      result += node.text || "";
    } else if (node.typename === "HTMLElement") {
      if (node.type === "p") {
        // Add paragraph break only if there's already content
        if (result.trim()) {
          result += "\n\n";
        }
      } else if (node.type === "blockquote") {
        if (result.trim()) {
          result += "\n\n";
        }
        result += '"';
      }

      if (node.children) {
        result += parseStructuredContent(node.children);
      }

      if (node.type === "blockquote") {
        result += '"';
        if (result.trim()) {
          result += "\n\n";
        }
      }
    } else if (node.typename === "HTMLLink") {
      if (node.children) {
        result += parseStructuredContent(node.children);
      }
    }
  }

  return result.trim();
}

/**
 * Fetch full article content from individual post API
 *
 * Retrieves the complete structured content for an article.
 * Used when displaying full article details.
 *
 * @param articleId - The WordPress post ID
 * @returns Promise resolving to parsed article content string
 *
 * @example
 * const content = await fetchArticleContent("12345");
 * // Returns: "Full article text with proper formatting..."
 */
export async function fetchArticleContent(articleId: string): Promise<string> {
  const { cacheService } = await import("../../cache");
  const cacheKey = "article_content";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<string>(cacheKey, { articleId, hash });
  if (cached) {
    console.log(`Returning cached article content for ${articleId}`);
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    console.log(
      "fetchArticleContent",
      `${baseUrl}${ENDPOINTS.INDIVIDUAL_POST}/${articleId}/?hash=${hash}&_fields=id,title,subtitle,leadText,content,imageUrl,timestamp,category`
    );
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.INDIVIDUAL_POST}/${articleId}/?hash=${hash}&_fields=id,title,subtitle,leadText,content,imageUrl,timestamp,category`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch article content");
    }

    const postData: PostApiResponse = await response.json();
    console.log("Individual post response:", postData);

    // Parse the structured content from content.rendered array
    if (
      postData &&
      postData.content &&
      postData.content.rendered &&
      Array.isArray(postData.content.rendered)
    ) {
      const content = parseStructuredContent(postData.content.rendered);

      // Cache the result
      await cacheService.set(cacheKey, content, { articleId, hash });

      return content;
    } else {
      throw new Error(
        "Invalid post content format - content.rendered not found or not an array"
      );
    }
  } catch (error) {
    console.error("Error fetching article content:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<string>(cacheKey, { articleId });
    if (staleCache) {
      console.log(
        `Returning stale cached article content for ${articleId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}
