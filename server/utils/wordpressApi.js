/**
 * WordPress API Utility
 * Handles fetching articles from WordPress REST API for different brands
 */

const axios = require("axios");
const { getBrand } = require("./brandOperations");

/**
 * Fetch articles from WordPress REST API
 * @param {string} brand - Brand shortcode (cn, nt, jnl)
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of articles to fetch (default: 10)
 * @param {number} options.page - Page number (default: 1)
 * @param {string} options.search - Search term (optional)
 * @param {string} options.orderby - Order by field (default: 'date')
 * @param {string} options.order - Order direction (default: 'desc')
 * @returns {Promise<Array>} Array of articles
 */
async function fetchArticles(brand, options = {}) {
  try {
    // Get brand configuration
    const brandConfig = await getBrand(brand);
    if (!brandConfig) {
      throw new Error(`Brand "${brand}" not found`);
    }

    if (!brandConfig.apiConfig || !brandConfig.apiConfig.baseUrl) {
      throw new Error(`API configuration not found for brand "${brand}"`);
    }

    const { baseUrl } = brandConfig.apiConfig;
    const {
      limit = 10,
      page = 1,
      search = "",
      orderby = "date",
      order = "desc",
    } = options;

    // Build WordPress REST API URL
    const apiUrl = `${baseUrl}/wp-json/wp/v2/posts`;

    // Build query parameters
    const params = {
      per_page: limit,
      page: page,
      orderby: orderby,
      order: order,
      _embed: true, // Include embedded data (featured image, author, etc.)
    };

    // Add search if provided
    if (search && search.trim()) {
      params.search = search.trim();
    }

    // Make API request
    const response = await axios.get(apiUrl, {
      params,
      timeout: 10000, // 10 second timeout
    });

    // Transform WordPress response to simplified format
    const articles = response.data.map((post) => transformArticle(post));

    return articles;
  } catch (error) {
    console.error(
      `Error fetching articles for brand "${brand}":`,
      error.message
    );

    if (error.response) {
      throw new Error(
        `WordPress API error: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      throw new Error("No response from WordPress API");
    } else {
      throw error;
    }
  }
}

/**
 * Search articles by term
 * @param {string} brand - Brand shortcode
 * @param {string} searchTerm - Search term
 * @param {number} limit - Number of results (default: 10)
 * @returns {Promise<Array>} Array of articles
 */
async function searchArticles(brand, searchTerm, limit = 10) {
  return fetchArticles(brand, {
    search: searchTerm,
    limit: limit,
  });
}

/**
 * Transform WordPress post to simplified article format
 * @param {Object} post - WordPress post object
 * @returns {Object} Simplified article object
 */
function transformArticle(post) {
  // Extract featured image
  let featuredImage = null;
  if (post._embedded && post._embedded["wp:featuredmedia"]) {
    const media = post._embedded["wp:featuredmedia"][0];
    featuredImage = {
      url: media.source_url,
      alt: media.alt_text || "",
      width: media.media_details?.width,
      height: media.media_details?.height,
    };
  }

  // Extract author
  let author = "Unknown";
  if (post._embedded && post._embedded.author) {
    author = post._embedded.author[0].name;
  }

  // Extract categories
  let categories = [];
  if (post._embedded && post._embedded["wp:term"]) {
    const terms = post._embedded["wp:term"];
    if (terms && terms[0]) {
      categories = terms[0].map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      }));
    }
  }

  // Clean excerpt (remove HTML tags)
  const excerpt = post.excerpt?.rendered
    ? post.excerpt.rendered.replace(/<[^>]*>/g, "").trim()
    : "";

  return {
    id: post.id.toString(),
    title: post.title?.rendered || "Untitled",
    excerpt: excerpt,
    link: post.link,
    date: post.date,
    modified: post.modified,
    author: author,
    featured_image: featuredImage,
    categories: categories,
    content: post.content?.rendered || "",
  };
}

/**
 * Get a single article by ID
 * @param {string} brand - Brand shortcode
 * @param {string} articleId - Article ID
 * @returns {Promise<Object>} Article object
 */
async function getArticle(brand, articleId) {
  try {
    const brandConfig = await getBrand(brand);
    if (!brandConfig) {
      throw new Error(`Brand "${brand}" not found`);
    }

    if (!brandConfig.apiConfig || !brandConfig.apiConfig.baseUrl) {
      throw new Error(`API configuration not found for brand "${brand}"`);
    }

    const { baseUrl } = brandConfig.apiConfig;
    const apiUrl = `${baseUrl}/wp-json/wp/v2/posts/${articleId}`;

    const response = await axios.get(apiUrl, {
      params: { _embed: true },
      timeout: 10000,
    });

    return transformArticle(response.data);
  } catch (error) {
    console.error(
      `Error fetching article ${articleId} for brand "${brand}":`,
      error.message
    );

    if (error.response && error.response.status === 404) {
      throw new Error(`Article ${articleId} not found`);
    }

    throw error;
  }
}

module.exports = {
  fetchArticles,
  searchArticles,
  getArticle,
  transformArticle,
};
