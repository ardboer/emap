/**
 * WordPress Category API
 *
 * Functions for fetching category content with block grouping.
 * Handles category pages with multiple content blocks and articles.
 */

import { Article, ArticleBlock, CategoryContentResponse } from "@/types";
import { extractCategoryFromUrl, formatDate } from "../utils/formatters";
import { decodeHtmlEntities, stripHtml } from "../utils/parsers";
import { ENDPOINTS, getApiConfig } from "./config";

/**
 * Transform category post to Article interface
 *
 * Converts raw category post data into a standardized Article object.
 * Used for articles within category content blocks.
 *
 * @param post - Raw category post data
 * @returns Transformed Article object
 */
function transformCategoryPostToArticle(post: any): Article {
  const imageUrl = post.post_image || "https://picsum.photos/800/600?random=1";
  const category = extractCategoryFromUrl(post.post_url);

  return {
    id: post.post_id.toString(),
    title: decodeHtmlEntities(stripHtml(post.post_title)),
    leadText: "", // Category posts don't have excerpts in the provided structure
    content: "", // Will be replaced with full content when viewing article
    imageUrl,
    timestamp: formatDate(post.post_publish_date), // Pre-formatted for list views
    publishDate: post.post_publish_date, // Raw ISO date for detail view
    category,
  };
}

/**
 * Fetch category content from category API with block grouping
 *
 * Retrieves category page content organized into blocks.
 * Each block contains a title, layout type, description, and articles.
 *
 * @param categoryId - The WordPress category ID
 * @returns Promise resolving to CategoryContentResponse with category info and blocks
 *
 * @example
 * const categoryContent = await fetchCategoryContent("42");
 * // Returns: {
 * //   categoryInfo: { id: 42, name: "News", ... },
 * //   blocks: [
 * //     { blockTitle: "Latest News", articles: [...], ... },
 * //     { blockTitle: "Featured", articles: [...], ... }
 * //   ]
 * // }
 */
export async function fetchCategoryContent(
  categoryId: string
): Promise<CategoryContentResponse> {
  const { hash, baseUrl } = getApiConfig();

  console.log(
    "fetch category content from ",
    `${baseUrl}${ENDPOINTS.CATEGORY}/${categoryId}/?hash=${hash}`
  );

  const response = await fetch(
    `${baseUrl}${ENDPOINTS.CATEGORY}/${categoryId}/?hash=${hash}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch category content");
  }

  const categoryData: any = await response.json();
  console.log("Category response:", categoryData);

  // Transform blocks to ArticleBlock structure
  // Filter out blocks with no posts and transform each block
  const blocks: ArticleBlock[] = [];
  if (categoryData.blocks && Array.isArray(categoryData.blocks)) {
    categoryData.blocks.forEach((block: any) => {
      // Skip blocks without posts
      if (
        !block.posts ||
        !Array.isArray(block.posts) ||
        block.posts.length === 0
      ) {
        return;
      }

      // Transform block posts to articles
      const articles = block.posts.map(transformCategoryPostToArticle);

      // Create ArticleBlock
      blocks.push({
        blockTitle: block.block_title || "",
        blockLayout: block.block_layout || "",
        blockDescription: block.block_description || "",
        blockBottomLink: block.block_bottom_more_news_link || "",
        blockBottomLinkUrl: block.block_bottom_more_news_link_url || "",
        articles,
      });
    });
  }

  // Create response with category info and blocks
  const result: CategoryContentResponse = {
    categoryInfo: {
      id: categoryData.id || 0,
      name: categoryData.name || "",
      description: categoryData.description || "",
      slug: categoryData.slug || "",
    },
    blocks,
  };

  return result;
}
