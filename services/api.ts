import { brandManager } from "@/config/BrandManager";
import { Article } from "@/types";

// Get API configuration from active brand
function getApiConfig() {
  return brandManager.getApiConfig();
}

const POSTS_ENDPOINT = "/wp-json/wp/v2/posts";
const STRUCTURED_CONTENT_ENDPOINT = "/wp-json/mbm-structured-html/v1/posts";

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

export interface StructuredContentNode {
  typename: string;
  type: string;
  text?: string;
  children?: StructuredContentNode[];
  href?: string;
  class?: string;
  target?: string;
  rel?: string;
}

export interface MediaResponse {
  source_url: string;
  alt_text: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
}

// Helper function to strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

// Helper function to format date
function formatDate(dateString: string): string {
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

// Fetch featured media URL
async function fetchMediaUrl(mediaId: number): Promise<string> {
  try {
    const { baseUrl } = getApiConfig();
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

// Fetch category name
async function fetchCategoryName(categoryId: number): Promise<string> {
  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(
      `${baseUrl}/wp-json/wp/v2/categories/${categoryId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch category");
    }
    const category: CategoryResponse = await response.json();
    return category.name;
  } catch (error) {
    console.error("Error fetching category:", error);
    return "News"; // Fallback category
  }
}

// Transform WordPress post to Article interface
async function transformPostToArticle(post: WordPressPost): Promise<Article> {
  const imageUrl = post.featured_media
    ? await fetchMediaUrl(post.featured_media)
    : "https://picsum.photos/800/600?random=1";
  const category =
    post.categories.length > 0
      ? await fetchCategoryName(post.categories[0])
      : "News";

  return {
    id: post.id.toString(),
    title: stripHtml(post.title.rendered),
    leadText: stripHtml(post.excerpt.rendered),
    content: stripHtml(post.excerpt.rendered), // Will be replaced with structured content when viewing full article
    imageUrl,
    timestamp: formatDate(post.date),
    category,
  };
}

// Fetch articles from WordPress API
export async function fetchArticles(): Promise<Article[]> {
  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(
      `${baseUrl}${POSTS_ENDPOINT}?per_page=8&_embed&&_fields=id,title,excerpt,featured_media,categories`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }

    const posts: WordPressPost[] = await response.json();
    const articles = await Promise.all(posts.map(transformPostToArticle));

    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
}

// Parse structured content recursively
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

// Fetch full article content with structured HTML
export async function fetchArticleContent(articleId: string): Promise<string> {
  try {
    const { baseUrl, hash } = getApiConfig();
    const response = await fetch(
      `${baseUrl}${STRUCTURED_CONTENT_ENDPOINT}/${articleId}?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch article content");
    }

    const responseData = await response.json();
    console.log("Structured content response:", responseData);

    // The structured content is in content.rendered array
    if (
      responseData &&
      responseData.content &&
      responseData.content.rendered &&
      Array.isArray(responseData.content.rendered)
    ) {
      return parseStructuredContent(responseData.content.rendered);
    } else {
      throw new Error(
        "Invalid structured content format - content.rendered not found or not an array"
      );
    }
  } catch (error) {
    console.error("Error fetching article content:", error);
    throw error;
  }
}

// Get featured articles (first 5)
export async function fetchFeaturedArticles(): Promise<Article[]> {
  const articles = await fetchArticles();
  return articles.slice(0, 5);
}

// Get all news articles
export async function fetchNewsArticles(): Promise<Article[]> {
  return await fetchArticles();
}
