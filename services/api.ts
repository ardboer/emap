import { brandManager } from "@/config/BrandManager";
import {
  Article,
  ClinicalArticlesResponse,
  ClinicalPost,
  MagazineArticleResponse,
  MagazineEdition,
  MagazineEditionsResponse,
  StructuredContentNode,
} from "@/types";
import { getAnonymousId } from "./anonymousId";

// Re-export brandManager for use in other services
export { brandManager };

// Get API configuration from active brand
function getApiConfig() {
  const config = brandManager.getApiConfig();
  console.log("🔍 API Config:", {
    baseUrl: config.baseUrl,
    hash: config.hash,
  });
  return config;
}

const POSTS_ENDPOINT = "/wp-json/wp/v2/posts";
const STRUCTURED_CONTENT_ENDPOINT = "/wp-json/mbm-structured-html/v1/posts";
const HIGHLIGHTS_ENDPOINT = "/wp-json/mbm-apps/v1/highlights";
const INDIVIDUAL_POST_ENDPOINT = "/wp-json/mbm-apps/v1/posts";
const MENU_ENDPOINT = "/wp-json/mbm-apps/v1/menu";
const CATEGORY_ENDPOINT = "/wp-json/mbm-apps/v1/categories";
const CLINICAL_ENDPOINT = "/wp-json/mbm-apps/v1/get-post-by-filter";
const EVENTS_ENDPOINT = "/wp-json/wp/v2/mec-events";
const SEARCH_ENDPOINT = "/wp-json/wp/v2/search";

export interface HighlightsApiItem {
  post_id: number;
  post_title: string;
  post_excerpt: string;
  post_image: string;
  post_image_width: number;
  post_image_height: number;
  post_highlights_image: string;
  post_highlights_image_width: number;
  post_highlights_image_height: number;
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

export interface LegacyCategoryResponse {
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
    const category: LegacyCategoryResponse = await response.json();
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
async function transformHighlightsItemToArticle(
  item: HighlightsApiItem
): Promise<Article> {
  // Check if debug setting is enabled to force landscape images
  const AsyncStorage = (
    await import("@react-native-async-storage/async-storage")
  ).default;
  const forceLandscape = await AsyncStorage.getItem(
    "debug_force_landscape_images"
  );
  const useLandscape = forceLandscape === "true";

  // Select image and dimensions based on debug setting
  let imageUrl: string;
  let imageWidth: number;
  let imageHeight: number;

  if (useLandscape) {
    imageUrl =
      item.post_image ||
      item.post_highlights_image ||
      "https://picsum.photos/800/600?random=1";
    imageWidth =
      item.post_image_width || item.post_highlights_image_width || 800;
    imageHeight =
      item.post_image_height || item.post_highlights_image_height || 600;
  } else {
    imageUrl =
      item.post_highlights_image ||
      item.post_image ||
      "https://picsum.photos/800/600?random=1";
    imageWidth =
      item.post_highlights_image_width || item.post_image_width || 800;
    imageHeight =
      item.post_highlights_image_height || item.post_image_height || 600;
  }

  // Determine if image is landscape (width > height)
  const isLandscape = imageWidth > imageHeight;

  const category = extractCategoryFromUrl(item.post_url);

  return {
    id: item.post_id.toString(),
    title: decodeHtmlEntities(stripHtml(item.post_title)),
    leadText: stripHtml(item.post_excerpt),
    content: stripHtml(item.post_excerpt), // Will be replaced with full content when viewing article
    imageUrl,
    timestamp: formatDate(item.post_publish_date),
    category,
    isLandscape,
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
    console.log("api call", `${baseUrl}${HIGHLIGHTS_ENDPOINT}?hash=${hash}`);
    const response = await fetch(
      `${baseUrl}${HIGHLIGHTS_ENDPOINT}?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }

    const highlightsItems: HighlightsApiItem[] = await response.json();
    const articles = await Promise.all(
      highlightsItems.map(transformHighlightsItemToArticle)
    );

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
    console.log(
      "fetchArticleContent",
      `${baseUrl}${INDIVIDUAL_POST_ENDPOINT}/${articleId}/?hash=${hash}&_fields=id,title,subtitle,leadText,content,imageUrl,timestamp,category`
    );
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

// Get featured articles (limited by maxNbOfItems with valid highlight images)
export async function fetchFeaturedArticles(): Promise<Article[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "featured_articles";
  const { hash, maxNbOfItems = 10 } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, { hash });
  if (cached) {
    console.log("Returning cached featured articles");
    // return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    console.log("api call", `${baseUrl}${HIGHLIGHTS_ENDPOINT}?hash=${hash}`);
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

    // Transform and return limited by maxNbOfItems
    console.log("itemsWithHighlightImages", itemsWithHighlightImages.length);
    console.log("maxNbOfItems", maxNbOfItems);
    const featuredArticles = await Promise.all(
      itemsWithHighlightImages
        .slice(0, maxNbOfItems)
        .map(transformHighlightsItemToArticle)
    );

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
  const { baseUrl } = getApiConfig();
  console.log(
    "fetching article",
    `${baseUrl}${INDIVIDUAL_POST_ENDPOINT}/${articleId}/?hash=${hash}`
  );
  // Try to get from cache first
  const cached = await cacheService.get<Article>(cacheKey, { articleId, hash });
  if (cached) {
    console.log(`Returning cached single article for ${articleId}`);
    return cached;
  }

  try {
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

    // Return structured content instead of parsed text
    let content: string | StructuredContentNode[] = "";
    if (
      postData.content &&
      postData.content.rendered &&
      Array.isArray(postData.content.rendered)
    ) {
      content = postData.content.rendered;
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
    console.log(
      "fetchSingleEvent",
      `${baseUrl}${EVENTS_ENDPOINT}/${eventId}?hash=${hash}`
    );
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
  articleId: string,
  limit: number = 5
): Promise<Article[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "related_articles";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, {
    articleId,
    limit,
    hash,
  });
  if (cached) {
    console.log(`Returning cached related articles for ${articleId}`);
    return cached;
  }

  try {
    // Get brand config to access Miso configuration
    const brandConfig = brandManager.getCurrentBrand();

    if (!brandConfig.misoConfig) {
      console.warn("Miso configuration not found for current brand");
      return [];
    }

    const { apiKey, brandFilter } = brandConfig.misoConfig;
    const endpoint =
      "https://api.askmiso.com/v1/recommendation/product_to_products";

    // Get persistent anonymous ID for tracking
    // Format: "1658570109.1761120937" (Google Analytics style)
    const anonymousId = await getAnonymousId();

    // Construct product_id with brand shortcode prefix (e.g., "NT-339716")
    // Use uppercase shortcode for consistency with Miso data
    const brandPrefix = brandConfig.shortcode.toUpperCase();
    const productId = `${brandPrefix}-${articleId}`;

    // Prepare request body for anonymous users
    // For authenticated users, this would use:
    // - user_id: "sub:user_id" + user_hash for subscribers
    // - user_id: "reg:user_id" + user_hash for registered users
    // Since we don't have authentication yet, use anonymous_id
    const requestBody = {
      anonymous_id: anonymousId, // Use persistent anonymous ID (Google Analytics style)
      product_id: productId,
      rows: limit,
      fl: ["*"],
      fq: `brand:"${brandFilter}"`, // Filter by brand
      // Add date boosting to prefer recent articles (last year)
      boost_fq: `published_at:[${
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      } TO *]`,
    };

    console.log("Fetching related articles from Miso:", {
      endpoint,
      brand: brandConfig.name,
      articleId,
      productId,
      limit,
      requestBody,
    });

    // Generate curl command for debugging
    const curlCommand = `curl -X POST '${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${apiKey}' \\
  -d '${JSON.stringify(requestBody)}'`;

    console.log("\n=== DEBUG: Copy this curl command to test the API ===");
    console.log(curlCommand);
    console.log("===================================================\n");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Miso API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Miso API error response:", errorText);
      throw new Error(
        `Miso API request failed: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Miso API response for related articles:", data);

    // Transform Miso response to Article interface
    // Miso API returns products in data.data.products
    const products = (data.data && data.data.products) || data.products || [];
    const relatedArticles: Article[] = products.map((product: any) => {
      // Extract category - categories is an array of arrays, get the first category from the first array
      let category = "News";
      if (
        product.categories &&
        Array.isArray(product.categories) &&
        product.categories.length > 0
      ) {
        const firstCategoryArray = product.categories[0];
        if (
          Array.isArray(firstCategoryArray) &&
          firstCategoryArray.length > 0
        ) {
          category = firstCategoryArray[0];
        } else if (typeof firstCategoryArray === "string") {
          category = firstCategoryArray;
        }
      }

      // Extract numeric ID from product_id (e.g., "NT-339716" -> "339716")
      // The WordPress API expects just the numeric part
      let extractedArticleId = product.product_id || "";
      const idMatch = extractedArticleId.match(/\d+$/);
      if (idMatch) {
        extractedArticleId = idMatch[0];
      }

      return {
        id: extractedArticleId,
        title: decodeHtmlEntities(stripHtml(product.title || "")),
        leadText: "", // Miso doesn't provide lead text
        content: product.html || "",
        imageUrl:
          product.cover_image || "https://picsum.photos/800/600?random=1",
        timestamp: formatDate(product.published_at || new Date().toISOString()),
        category,
      };
    });

    // Cache the result
    await cacheService.set(cacheKey, relatedArticles, {
      articleId,
      limit,
      hash,
    });

    return relatedArticles;
  } catch (error) {
    console.error("Error fetching related articles from Miso:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey, {
      articleId,
      limit,
    });
    if (staleCache) {
      console.log(
        `Returning stale cached related articles for ${articleId} due to API error`
      );
      return staleCache;
    }

    // Return empty array instead of throwing to gracefully handle errors
    return [];
  }
}
// Fetch trending articles from Miso API
export async function fetchTrendingArticles(
  limit: number = 5
): Promise<Article[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "trending_articles";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, { limit, hash });
  if (cached) {
    console.log("Returning cached trending articles");
    return cached;
  }

  try {
    // Get brand config to access Miso configuration
    const brandConfig = brandManager.getCurrentBrand();

    if (!brandConfig.misoConfig) {
      console.warn("Miso configuration not found for current brand");
      return [];
    }

    const { apiKey, brandFilter, endpoint } = brandConfig.misoConfig;

    // Get persistent anonymous ID for tracking
    // Format: "1658570109.1761120937" (Google Analytics style)
    const anonymousId = await getAnonymousId();

    // Calculate date one year ago for boost_fq
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoISO = oneYearAgo.toISOString().split("T")[0] + "T00:00:00Z";

    // Prepare request body for anonymous users
    // For authenticated users, this would use:
    // - user_id: "sub:user_id" for subscribers
    // - user_id: "reg:user_id" for registered users
    const requestBody = {
      anonymous_id: anonymousId, // Use persistent anonymous ID
      fl: ["*"],
      rows: limit,
      // Date filter to get articles from the last year
      boost_fq: `published_at:[${oneYearAgoISO} TO *]`,
      // Brand filter with quotes for proper matching
      fq: `brand:"${brandFilter}"`,
    };

    console.log("Fetching trending articles from Miso:", {
      endpoint,
      brand: brandConfig.name,
      limit,
      requestBody,
    });

    // Generate curl command for debugging
    const curlCommand = `curl -X POST '${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: ${apiKey}' \\
  -d '${JSON.stringify(requestBody)}'`;

    console.log(
      "\n=== DEBUG: Copy this curl command to test Trending Articles API ==="
    );
    console.log(curlCommand);
    console.log(
      "====================================================================\n"
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Miso API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Miso API response:", data);

    // Transform Miso response to Article interface
    // Miso API returns products in data.data.products
    const products = (data.data && data.data.products) || data.products || [];
    const trendingArticles: Article[] = products.map((product: any) => {
      // Extract category - categories is an array of arrays, get the first category from the first array
      let category = "News";
      if (
        product.categories &&
        Array.isArray(product.categories) &&
        product.categories.length > 0
      ) {
        const firstCategoryArray = product.categories[0];
        if (
          Array.isArray(firstCategoryArray) &&
          firstCategoryArray.length > 0
        ) {
          category = firstCategoryArray[0];
        } else if (typeof firstCategoryArray === "string") {
          category = firstCategoryArray;
        }
      }

      // Extract numeric ID from product_id (e.g., "NT-339716" -> "339716")
      // The WordPress API expects just the numeric part
      let articleId = product.product_id || "";
      const idMatch = articleId.match(/\d+$/);
      if (idMatch) {
        articleId = idMatch[0];
      }

      return {
        id: articleId,
        title: decodeHtmlEntities(stripHtml(product.title || "")),
        leadText: "", // Miso doesn't provide lead text
        content: product.html || "",
        imageUrl:
          product.cover_image || "https://picsum.photos/800/600?random=1",
        timestamp: formatDate(product.published_at || new Date().toISOString()),
        category,
      };
    });

    // Cache the result
    await cacheService.set(cacheKey, trendingArticles, { limit, hash });

    return trendingArticles;
  } catch (error) {
    console.error("Error fetching trending articles from Miso:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey, { limit });
    if (staleCache) {
      console.log("Returning stale cached trending articles due to API error");
      return staleCache;
    }

    // Return empty array instead of throwing to gracefully handle errors
    return [];
  }
}

// Get all news articles
export async function fetchNewsArticles(): Promise<Article[]> {
  return await fetchArticles();
}

// Transform category post to Article interface
function transformCategoryPostToArticle(post: any): Article {
  const imageUrl = post.post_image || "https://picsum.photos/800/600?random=1";
  const category = extractCategoryFromUrl(post.post_url);

  return {
    id: post.post_id.toString(),
    title: decodeHtmlEntities(stripHtml(post.post_title)),
    leadText: "", // Category posts don't have excerpts in the provided structure
    content: "", // Will be replaced with full content when viewing article
    imageUrl,
    timestamp: formatDate(post.post_publish_date),
    category,
  };
}

// Fetch category content from category API
export async function fetchCategoryContent(
  categoryId: string
): Promise<Article[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "category_content";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<Article[]>(cacheKey, {
    categoryId,
    hash,
  });
  if (cached) {
    console.log(`Returning cached category content for ${categoryId}`);
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();
    console.log(
      "fetch category content from ",
      `${baseUrl}${CATEGORY_ENDPOINT}/${categoryId}/?hash=${hash}`
    );
    const response = await fetch(
      `${baseUrl}${CATEGORY_ENDPOINT}/${categoryId}/?hash=${hash}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch category content");
    }

    const categoryData: any = await response.json();
    console.log("Category response:", categoryData);

    // Extract all posts from all blocks
    const allPosts: any[] = [];
    if (categoryData.blocks && Array.isArray(categoryData.blocks)) {
      categoryData.blocks.forEach((block: any) => {
        if (block.posts && Array.isArray(block.posts)) {
          allPosts.push(...block.posts);
        }
      });
    }

    // Transform posts to Article interface
    const articles = allPosts.map(transformCategoryPostToArticle);

    // Cache the result
    await cacheService.set(cacheKey, articles, { categoryId, hash });

    return articles;
  } catch (error) {
    console.error("Error fetching category content:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<Article[]>(cacheKey, {
      categoryId,
    });
    if (staleCache) {
      console.log(
        `Returning stale cached category content for ${categoryId} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
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
// Transform clinical post to Article interface
function transformClinicalPostToArticle(post: ClinicalPost): Article {
  return {
    id: post.post_id.toString(),
    title: decodeHtmlEntities(stripHtml(post.post_title)),
    leadText: stripHtml(post.post_excerpt || ""),
    content: "",
    imageUrl: post.post_image || "https://picsum.photos/800/600?random=1",
    timestamp: post.post_publish_date,
    category: extractCategoryFromUrl(post.post_url),
    isLandscape: post.post_image_width > post.post_image_height,
  };
}

// Fetch clinical articles with pagination
export async function fetchClinicalArticles(
  page: number = 1
): Promise<{ articles: Article[]; hasMore: boolean }> {
  const { cacheService } = await import("./cache");
  const cacheKey = "clinical_articles";
  const { hash } = getApiConfig();

  // Try to get from cache first
  const cached = await cacheService.get<{
    articles: Article[];
    hasMore: boolean;
  }>(cacheKey, { page, hash });
  if (cached) {
    console.log(`Returning cached clinical articles for page ${page}`);
    return cached;
  }

  try {
    const { baseUrl } = getApiConfig();

    // Fixed parameters for clinical articles
    const params = new URLSearchParams({
      hash: hash,
      include_taxonomy: "type",
      include_term: "2404",
      per_page: "40",
      page: page.toString(),
    });

    const url = `${baseUrl}${CLINICAL_ENDPOINT}/?${params.toString()}`;
    console.log("Fetching clinical articles:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch clinical articles: ${response.status}`);
    }

    const data: ClinicalArticlesResponse = await response.json();
    console.log(`Clinical articles response for page ${page}:`, {
      articlesCount: data.articles?.length,
      currentPage: data.page,
      totalPages: data.total_pages,
      total: data.total,
    });

    // Transform posts to articles
    const articles = (data.articles || []).map(transformClinicalPostToArticle);

    // Determine if there are more pages based on API response
    const hasMore = data.page < data.total_pages;

    const result = { articles, hasMore };

    // Cache the result
    await cacheService.set(cacheKey, result, { page, hash });

    return result;
  } catch (error) {
    console.error(`Error fetching clinical articles for page ${page}:`, error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<{
      articles: Article[];
      hasMore: boolean;
    }>(cacheKey, { page });
    if (staleCache) {
      console.log(
        `Returning stale cached clinical articles for page ${page} due to API error`
      );
      return staleCache;
    }

    throw error;
  }
}

// Magazine API Base URL
// Fetch post ID by slug for deep linking
export async function getPostBySlug(slug: string): Promise<{ id: number }> {
  try {
    const { baseUrl, hash } = getApiConfig();
    const endpoint = `/wp-json/mbm-apps/v1/get-post-by-slug/?slug=${encodeURIComponent(
      slug
    )}&hash=${hash}&_fields=id`;

    console.log(`🔗 Resolving slug to ID: ${slug}`);
    console.log(`🔗 API call: ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch post by slug: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data || !data.id) {
      throw new Error("Invalid response: missing id field");
    }

    console.log(`✅ Resolved slug "${slug}" to ID: ${data.id}`);
    return { id: data.id };
  } catch (error) {
    console.error("❌ Error fetching post by slug:", error);
    throw error;
  }
}

const MAGAZINE_API_BASE_URL = "https://emap-epaper-development.gdkzr.com";

// Magazine API Functions

/**
 * Fetch available magazine editions
 * Returns array of edition IDs from /editions endpoint
 */
export async function fetchMagazineEditions(): Promise<string[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "magazine_editions";

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
 * Returns the cover image URL from /cover/[edition id] endpoint
 */
export async function fetchMagazineCover(editionId: string): Promise<string> {
  const { cacheService } = await import("./cache");
  const cacheKey = "magazine_cover";

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
 * Returns the PDF URL from /editions/[edition id] endpoint
 */
export async function fetchMagazinePDF(editionId: string): Promise<string> {
  const { cacheService } = await import("./cache");
  const cacheKey = "magazine_pdf";

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
 * Fetch article details for a specific edition and article
 * Returns article data from /articles/[edition id]/[article id] endpoint
 */
export async function fetchMagazineArticle(
  editionId: string,
  articleId: string
): Promise<MagazineArticleResponse> {
  const { cacheService } = await import("./cache");
  const cacheKey = "magazine_article";

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
 * Fetch complete magazine edition data including cover and PDF URLs
 * Combines multiple API calls for convenience
 */
export async function fetchMagazineEditionData(
  editionId: string
): Promise<MagazineEdition> {
  const { cacheService } = await import("./cache");
  const cacheKey = "magazine_edition_data";

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

/**
 * Fetch PDF article detail from emap-epaper API
 * Used when user clicks on article annotation in PDF viewer
 */
export async function fetchPDFArticleDetail(
  editionId: string,
  articleId: string
): Promise<import("@/types").PDFArticleDetail> {
  const { cacheService } = await import("./cache");
  const cacheKey = "pdf_article_detail";

  // Try to get from cache first
  const cached = await cacheService.get<import("@/types").PDFArticleDetail>(
    cacheKey,
    {
      editionId,
      articleId,
    }
  );
  if (cached) {
    console.log(`✅ Returning cached PDF article ${editionId}/${articleId}`);
    return cached;
  }

  try {
    const EPAPER_BASE_URL = "https://emap-epaper-development.gdkzr.com";
    const url = `${EPAPER_BASE_URL}/articles/${editionId}/${articleId}`;
    console.log(`🔄 Fetching PDF article from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch PDF article: ${response.status} ${response.statusText}`
      );
    }

    const articleData: import("@/types").PDFArticleDetail =
      await response.json();
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
    const staleCache = await cacheService.get<
      import("@/types").PDFArticleDetail
    >(cacheKey, {
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
