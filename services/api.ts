import { brandManager } from "@/config/BrandManager";
import { Article } from "@/types";

// Get API configuration from active brand
function getApiConfig() {
  return brandManager.getApiConfig();
}

const POSTS_ENDPOINT = "/wp-json/wp/v2/posts";
const STRUCTURED_CONTENT_ENDPOINT = "/wp-json/mbm-structured-html/v1/posts";
const HIGHLIGHTS_ENDPOINT = "/wp-json/mbm-apps/v1/highlights";
const INDIVIDUAL_POST_ENDPOINT = "/wp-json/mbm-apps/v1/posts";
const MENU_ENDPOINT = "/wp-json/mbm-apps/v1/menu";
const EVENTS_ENDPOINT = "/wp-json/wp/v2/mec-events";
const SEARCH_ENDPOINT = "/wp-json/wp/v2/search";

export interface HighlightsApiItem {
  post_id: number;
  post_title: string;
  post_excerpt: string;
  post_image: string;
  post_highlights_image: string;
  post_url: string;
  post_publish_date: string;
}

export interface PostApiResponse {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: StructuredContentNode[];
  };
  featured_media: number;
  link: string;
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

// Legacy interfaces - keeping for backward compatibility if needed
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

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    "&#8216;": "'",
    "&#8217;": "'",
    "&#8220;": '"',
    "&#8221;": '"',
    "&#8211;": "–",
    "&#8212;": "—",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
  };

  return text.replace(/&#?\w+;/g, (entity) => entities[entity] || entity);
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

// Helper function to extract category from URL
function extractCategoryFromUrl(url: string): string {
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
  } catch (error) {
    return "News";
  }
}

// Transform highlights API item to Article interface
function transformHighlightsItemToArticle(item: HighlightsApiItem): Article {
  const imageUrl =
    item.post_highlights_image ||
    item.post_image ||
    "https://picsum.photos/800/600?random=1";
  const category = extractCategoryFromUrl(item.post_url);

  return {
    id: item.post_id.toString(),
    title: decodeHtmlEntities(stripHtml(item.post_title)),
    leadText: stripHtml(item.post_excerpt),
    content: stripHtml(item.post_excerpt), // Will be replaced with full content when viewing article
    imageUrl,
    timestamp: formatDate(item.post_publish_date),
    category,
  };
}

// Transform WordPress post to Article interface (legacy)
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

// Fetch articles from highlights API
export async function fetchArticles(): Promise<Article[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "highlights";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, { hash });
  if (cached) {
    console.log("Returning cached articles");
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(
      `${baseUrl}${HIGHLIGHTS_ENDPOINT}?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }

    const highlightsItems: HighlightsApiItem[] = await response.json();
    const articles = highlightsItems.map(transformHighlightsItemToArticle);

    // Cache the result
    await cacheService.set(cacheKey, articles, { hash });

    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey);
    if (staleCache) {
      console.log("Returning stale cached articles due to API error");
      return staleCache;
    }

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

// Fetch full article content from individual post API
export async function fetchArticleContent(articleId: string): Promise<string> {
  const { cacheService } = await import("./cache");
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
    const response = await fetch(
      `${baseUrl}${INDIVIDUAL_POST_ENDPOINT}/${articleId}/?hash=${hash}&_fields=id,title,subtitle,leadText,content,imageUrl,timestamp,category`
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

// Get featured articles (first 5 with valid highlight images)
export async function fetchFeaturedArticles(): Promise<Article[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "featured_articles";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, { hash });
  if (cached) {
    console.log("Returning cached featured articles");
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(
      `${baseUrl}${HIGHLIGHTS_ENDPOINT}?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch featured articles");
    }

    const highlightsItems: HighlightsApiItem[] = await response.json();

    // Filter to only include items with valid post_highlights_image
    const itemsWithHighlightImages = highlightsItems.filter(
      (item) =>
        item.post_highlights_image && item.post_highlights_image.trim() !== ""
    );

    // Transform and return first 5
    const featuredArticles = itemsWithHighlightImages
      .slice(0, 5)
      .map(transformHighlightsItemToArticle);

    // Cache the result
    await cacheService.set(cacheKey, featuredArticles, { hash });

    return featuredArticles;
  } catch (error) {
    console.error("Error fetching featured articles:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey);
    if (staleCache) {
      console.log("Returning stale cached featured articles due to API error");
      return staleCache;
    }

    throw error;
  }
}

// Fetch a single article by ID
export async function fetchSingleArticle(articleId: string): Promise<Article> {
  const { cacheService } = await import("./cache");
  const cacheKey = "single_article";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article>(cacheKey, { articleId, hash });
  if (cached) {
    console.log(`Returning cached single article for ${articleId}`);
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(
      `${baseUrl}${INDIVIDUAL_POST_ENDPOINT}/${articleId}/?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch article");
    }

    const postData: PostApiResponse = await response.json();
    console.log("Single article response:", postData);

    // Extract image URL from featured_media if available
    let imageUrl = "https://picsum.photos/800/600?random=1";
    if (postData.featured_media) {
      try {
        imageUrl = await fetchMediaUrl(postData.featured_media);
      } catch (error) {
        console.warn("Failed to fetch featured media, using fallback");
      }
    }

    // Extract category from URL
    const category = extractCategoryFromUrl(postData.link);

    // Parse the structured content
    let content = "";
    if (
      postData.content &&
      postData.content.rendered &&
      Array.isArray(postData.content.rendered)
    ) {
      content = parseStructuredContent(postData.content.rendered);
    }

    // Transform to Article interface
    const article: Article = {
      id: postData.id.toString(),
      title: decodeHtmlEntities(stripHtml(postData.title.rendered)),
      leadText: stripHtml(postData.excerpt.rendered),
      content,
      imageUrl,
      timestamp: formatDate(postData.date),
      category,
    };

    // Cache the result
    await cacheService.set(cacheKey, article, { articleId, hash });

    return article;
  } catch (error) {
    console.error("Error fetching single article:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article>(cacheKey, { articleId });
    if (staleCache) {
      console.log(
        `Returning stale cached single article for ${articleId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}

// Fetch menu items from menu API
export async function fetchMenuItems(): Promise<any[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "menu_items";
  const apiConfig = getApiConfig() as any;
  const { hash, menuId } = apiConfig;

  if (!menuId) {
    throw new Error("Menu ID not configured for this brand");
  }

  // Try to get from cache first
  const cached = await cacheService.get<any[]>(cacheKey, { menuId, hash });
  if (cached) {
    console.log("Returning cached menu items");
    return cached;
  }

  try {
    const { baseUrl } = apiConfig;
    const response = await fetch(
      `${baseUrl}${MENU_ENDPOINT}/${menuId}/?hash=${hash}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch menu items");
    }

    const menuData = await response.json();
    console.log("Menu response:", menuData);

    const menuItems = menuData.menu_items || [];

    // Cache the result
    await cacheService.set(cacheKey, menuItems, { menuId, hash });

    return menuItems;
  } catch (error) {
    console.error("Error fetching menu items:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<any[]>(cacheKey, { menuId });
    if (staleCache) {
      console.log("Returning stale cached menu items due to API error");
      return staleCache;
    }

    throw error;
  }
}

// Helper function to validate if an event object has required properties
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

// Transform WordPress event to Event interface
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

// Fetch events from WordPress events API
export async function fetchEvents(): Promise<any[]> {
  const { cacheService } = await import("./cache");
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
      `${baseUrl}${EVENTS_ENDPOINT}?hash=${hash}&_fields=id,title,excerpt,content,featured_media,date,link`
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

// Fetch a single event by ID
export async function fetchSingleEvent(eventId: string): Promise<any> {
  const { cacheService } = await import("./cache");
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
    const response = await fetch(
      `${baseUrl}${EVENTS_ENDPOINT}/${eventId}?hash=${hash}`
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
      } catch (error) {
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

// Fetch related articles (excluding current article)
export async function fetchRelatedArticles(
  excludeId: string,
  limit: number = 5
): Promise<Article[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "related_articles";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, {
    excludeId,
    limit,
    hash,
  });
  if (cached) {
    console.log(`Returning cached related articles for ${excludeId}`);
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    const response = await fetch(
      `${baseUrl}${HIGHLIGHTS_ENDPOINT}?hash=${hash}&per_page=${limit + 5}` // Fetch extra to account for filtering
    );
    if (!response.ok) {
      throw new Error("Failed to fetch related articles");
    }

    const highlightsItems: HighlightsApiItem[] = await response.json();

    // Filter out the current article and transform to Article interface
    const relatedArticles = highlightsItems
      .filter((item) => item.post_id.toString() !== excludeId)
      .slice(0, limit)
      .map(transformHighlightsItemToArticle);

    // Cache the result
    await cacheService.set(cacheKey, relatedArticles, {
      excludeId,
      limit,
      hash,
    });

    return relatedArticles;
  } catch (error) {
    console.error("Error fetching related articles:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey, {
      excludeId,
      limit,
    });
    if (staleCache) {
      console.log(
        `Returning stale cached related articles for ${excludeId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}

// Get all news articles
export async function fetchNewsArticles(): Promise<Article[]> {
  return await fetchArticles();
}

// Fetch search results from WordPress search API
export async function fetchSearchResults(query: string): Promise<any[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "search_results";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<any[]>(cacheKey, { query, hash });
  if (cached) {
    console.log(`Returning cached search results for "${query}"`);
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${baseUrl}${SEARCH_ENDPOINT}?search=${encodedQuery}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }

    const searchResults: any[] = await response.json();
    console.log("Search results response:", searchResults);

    // Transform search results to include decoded titles
    const transformedResults = searchResults.map((result) => ({
      ...result,
      title: decodeHtmlEntities(stripHtml(result.title)),
    }));

    // Cache the result
    await cacheService.set(cacheKey, transformedResults, { query, hash });

    return transformedResults;
  } catch (error) {
    console.error("Error fetching search results:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<any[]>(cacheKey, { query });
    if (staleCache) {
      console.log(
        `Returning stale cached search results for "${query}" due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}
