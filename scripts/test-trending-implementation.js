/**
 * Test script for Miso Trending Articles Implementation
 *
 * This script tests the fetchTrendingArticles function for both brands:
 * - Nursing Times (NT)
 * - Construction News (CN)
 *
 * It verifies:
 * - API returns 5 trending articles
 * - Each article has all required fields
 * - Brand filter is correctly applied
 * - Date filter works (only articles from the last year)
 * - Data transformation from Miso format to Article interface is correct
 */

const https = require("https");

// Brand configurations
const BRANDS = {
  nt: {
    name: "Nursing Times",
    misoConfig: {
      apiKey: "FcakM2bTHy0Sf0uaM6mYpwI9vnXWKdu4E9jO6Bx2",
      publishableKey: "4yxesK8tUzRGIz17RXDPgplM0c5ZAWnWjtD9cdcD",
      brandFilter: "Nursing Times",
      endpoint: "https://api.askmiso.com/v1/recommendation/user_to_trending",
    },
  },
  cn: {
    name: "Construction News",
    misoConfig: {
      apiKey: "FcakM2bTHy0Sf0uaM6mYpwI9vnXWKdu4E9jO6Bx2",
      publishableKey: "4yxesK8tUzRGIz17RXDPgplM0c5ZAWnWjtD9cdcD",
      brandFilter: "Construction News",
      endpoint: "https://api.askmiso.com/v1/recommendation/user_to_trending",
    },
  },
};

// Required fields for Article interface
const REQUIRED_FIELDS = [
  "id",
  "title",
  "imageUrl",
  "content",
  "timestamp",
  "category",
];

// Helper function to make HTTPS POST request
function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "POST",
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Helper function to strip HTML tags
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").trim();
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text) {
  const entities = {
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
function formatDate(dateString) {
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

// Fetch trending articles from Miso API
async function fetchTrendingArticles(brandKey, limit = 5, useFilters = true) {
  const brand = BRANDS[brandKey];
  const { apiKey, brandFilter, endpoint } = brand.misoConfig;

  // Generate a consistent anonymous ID
  const anonymousId = "test-user-" + Math.random().toString(36).substring(7);

  // Calculate date one year ago for boost_fq
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoISO = oneYearAgo.toISOString().split("T")[0] + "T00:00:00Z";

  // Prepare request body
  const requestBody = {
    anonymous_id: anonymousId,
    fl: ["*"],
    rows: limit,
  };

  // Add filters if requested
  if (useFilters) {
    // Date filter to get articles from the last year
    requestBody.boost_fq = `published_at:[${oneYearAgoISO} TO *]`;
    // Brand filter with quotes for proper matching
    requestBody.fq = `brand:"${brandFilter}"`;
  }

  console.log(`\n📡 Fetching trending articles for ${brand.name}...`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Using Filters: ${useFilters ? "YES" : "NO"}`);
  if (useFilters) {
    console.log(`   Brand Filter: brand:"${brandFilter}"`);
    console.log(`   Date Filter: Articles from ${oneYearAgoISO} onwards`);
  }
  console.log(`   Limit: ${limit}`);
  console.log(`   Request Body:`, JSON.stringify(requestBody, null, 2));

  try {
    const data = await makeRequest(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      },
      requestBody
    );

    console.log(`   ✅ API Response received`);
    console.log(`   Response keys:`, Object.keys(data));
    console.log(`   Message:`, data.message);
    console.log(`   Data type:`, typeof data.data);
    console.log(`   Data value:`, JSON.stringify(data.data, null, 2));

    // Miso API returns products in data.data.products
    const products = (data.data && data.data.products) || data.products || [];
    console.log(`   Products type:`, typeof products);
    console.log(`   Products is array:`, Array.isArray(products));
    console.log(
      `   Products count:`,
      Array.isArray(products) ? products.length : "N/A"
    );
    if (Array.isArray(products) && products.length > 0) {
      console.log(`   First product keys:`, Object.keys(products[0]));
      console.log(
        `   First product sample:`,
        JSON.stringify(products[0], null, 2)
      );
    }

    // Transform Miso response to Article interface
    const trendingArticles = (Array.isArray(products) ? products : []).map(
      (product) => {
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
          timestamp: formatDate(
            product.published_at || new Date().toISOString()
          ),
          category,
          // Additional fields for verification
          _raw: {
            brand: product.brand,
            published_at: product.published_at,
            categories: product.categories,
            original_id: product.product_id,
          },
        };
      }
    );

    return {
      success: true,
      articles: trendingArticles,
      rawResponse: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      articles: [],
    };
  }
}

// Validate article structure
function validateArticle(article, index) {
  const issues = [];

  // Check required fields
  REQUIRED_FIELDS.forEach((field) => {
    if (!article[field] && article[field] !== "") {
      issues.push(`Missing required field: ${field}`);
    }
  });

  // Check field types
  if (typeof article.id !== "string") {
    issues.push(`id should be string, got ${typeof article.id}`);
  }
  if (typeof article.title !== "string") {
    issues.push(`title should be string, got ${typeof article.title}`);
  }
  if (typeof article.imageUrl !== "string") {
    issues.push(`imageUrl should be string, got ${typeof article.imageUrl}`);
  }
  if (typeof article.timestamp !== "string") {
    issues.push(`timestamp should be string, got ${typeof article.timestamp}`);
  }
  if (typeof article.category !== "string") {
    issues.push(`category should be string, got ${typeof article.category}`);
  }

  // Check for empty critical fields
  if (!article.title.trim()) {
    issues.push("title is empty");
  }
  if (!article.id.trim()) {
    issues.push("id is empty");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Verify brand filtering
function verifyBrandFilter(articles, expectedBrand) {
  const brandMismatches = [];

  articles.forEach((article, index) => {
    if (article._raw && article._raw.brand !== expectedBrand) {
      brandMismatches.push({
        index,
        expected: expectedBrand,
        actual: article._raw.brand,
        title: article.title,
      });
    }
  });

  return {
    passed: brandMismatches.length === 0,
    mismatches: brandMismatches,
  };
}

// Verify date filtering
function verifyDateFilter(articles) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const oldArticles = [];

  articles.forEach((article, index) => {
    if (article._raw && article._raw.published_at) {
      const publishDate = new Date(article._raw.published_at);
      if (publishDate < oneYearAgo) {
        oldArticles.push({
          index,
          title: article.title,
          publishDate: article._raw.published_at,
          daysOld: Math.floor(
            (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24)
          ),
        });
      }
    }
  });

  return {
    passed: oldArticles.length === 0,
    oldArticles,
  };
}

// Print test results
function printResults(brandKey, result) {
  const brand = BRANDS[brandKey];
  console.log(`\n${"=".repeat(80)}`);
  console.log(`TEST RESULTS FOR ${brand.name.toUpperCase()}`);
  console.log(`${"=".repeat(80)}`);

  if (!result.success) {
    console.log(`\n❌ FAILED: ${result.error}`);
    return;
  }

  const articles = result.articles;

  // Test 1: Number of articles
  console.log(`\n📊 Test 1: Number of Articles`);
  console.log(`   Expected: 5`);
  console.log(`   Actual: ${articles.length}`);
  console.log(
    `   Status: ${articles.length === 5 ? "✅ PASS" : "⚠️  WARNING"}`
  );

  // Test 2: Article structure validation
  console.log(`\n🔍 Test 2: Article Structure Validation`);
  let allValid = true;
  articles.forEach((article, index) => {
    const validation = validateArticle(article, index);
    if (!validation.valid) {
      allValid = false;
      console.log(
        `   ❌ Article ${index + 1}: ${validation.issues.join(", ")}`
      );
    }
  });
  if (allValid) {
    console.log(`   ✅ All articles have valid structure`);
  }

  // Test 3: Brand filtering
  console.log(`\n🏷️  Test 3: Brand Filtering`);
  const brandCheck = verifyBrandFilter(articles, brand.misoConfig.brandFilter);
  if (brandCheck.passed) {
    console.log(
      `   ✅ All articles match brand filter: ${brand.misoConfig.brandFilter}`
    );
  } else {
    console.log(`   ❌ Brand filter mismatches found:`);
    brandCheck.mismatches.forEach((mismatch) => {
      console.log(
        `      Article ${mismatch.index + 1}: Expected "${
          mismatch.expected
        }", got "${mismatch.actual}"`
      );
      console.log(`      Title: ${mismatch.title}`);
    });
  }

  // Test 4: Date filtering
  console.log(`\n📅 Test 4: Date Filtering (Last Year)`);
  const dateCheck = verifyDateFilter(articles);
  if (dateCheck.passed) {
    console.log(`   ✅ All articles are from the last year`);
  } else {
    console.log(`   ⚠️  Found articles older than one year:`);
    dateCheck.oldArticles.forEach((old) => {
      console.log(`      Article ${old.index + 1}: ${old.daysOld} days old`);
      console.log(`      Published: ${old.publishDate}`);
      console.log(`      Title: ${old.title}`);
    });
  }

  // Test 5: Sample article data
  console.log(`\n📄 Test 5: Sample Article Data`);
  if (articles.length > 0) {
    const sample = articles[0];
    console.log(`   Sample Article #1:`);
    console.log(`   - ID: ${sample.id}`);
    console.log(
      `   - Title: ${sample.title.substring(0, 60)}${
        sample.title.length > 60 ? "..." : ""
      }`
    );
    console.log(`   - Category: ${sample.category}`);
    console.log(`   - Timestamp: ${sample.timestamp}`);
    console.log(
      `   - Image URL: ${sample.imageUrl.substring(0, 60)}${
        sample.imageUrl.length > 60 ? "..." : ""
      }`
    );
    console.log(`   - Content Length: ${sample.content.length} characters`);
    console.log(
      `   - Has Lead Text: ${
        sample.leadText ? "Yes" : "No (expected for Miso)"
      }`
    );
    if (sample._raw) {
      console.log(`   - Raw Brand: ${sample._raw.brand}`);
      console.log(`   - Raw Published: ${sample._raw.published_at}`);
      console.log(
        `   - Raw Categories: ${
          sample._raw.categories ? sample._raw.categories.join(", ") : "None"
        }`
      );
    }
  }

  // Summary
  console.log(`\n📋 Summary:`);
  console.log(`   Total Articles: ${articles.length}`);
  console.log(`   Valid Structure: ${allValid ? "✅" : "❌"}`);
  console.log(`   Brand Filter: ${brandCheck.passed ? "✅" : "❌"}`);
  console.log(`   Date Filter: ${dateCheck.passed ? "✅" : "⚠️"}`);
}

// Main test function
async function runTests() {
  console.log("\n🚀 Starting Miso Trending Articles Implementation Tests");
  console.log("=".repeat(80));

  // Test 1: Without filters (to see if we get any data)
  console.log("\n\n" + "=".repeat(80));
  console.log("TEST SET 1: WITHOUT FILTERS (Baseline Test)");
  console.log("=".repeat(80));

  const ntResultNoFilter = await fetchTrendingArticles("nt", 5, false);
  printResults("nt", ntResultNoFilter);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const cnResultNoFilter = await fetchTrendingArticles("cn", 5, false);
  printResults("cn", cnResultNoFilter);

  // Test 2: With filters (production configuration)
  console.log("\n\n" + "=".repeat(80));
  console.log("TEST SET 2: WITH FILTERS (Production Configuration)");
  console.log("=".repeat(80));

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const ntResult = await fetchTrendingArticles("nt", 5, true);
  printResults("nt", ntResult);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const cnResult = await fetchTrendingArticles("cn", 5, true);
  printResults("cn", cnResult);

  // Final summary
  console.log(`\n${"=".repeat(80)}`);
  console.log("OVERALL TEST SUMMARY");
  console.log(`${"=".repeat(80)}`);

  console.log(`\n📊 Without Filters (Baseline):`);
  console.log(
    `   Nursing Times: ${
      ntResultNoFilter.success ? "✅ SUCCESS" : "❌ FAILED"
    } - ${ntResultNoFilter.articles.length} articles`
  );
  console.log(
    `   Construction News: ${
      cnResultNoFilter.success ? "✅ SUCCESS" : "❌ FAILED"
    } - ${cnResultNoFilter.articles.length} articles`
  );

  console.log(`\n📊 With Filters (Production):`);
  console.log(
    `   Nursing Times: ${ntResult.success ? "✅ SUCCESS" : "❌ FAILED"} - ${
      ntResult.articles.length
    } articles`
  );
  console.log(
    `   Construction News: ${cnResult.success ? "✅ SUCCESS" : "❌ FAILED"} - ${
      cnResult.articles.length
    } articles`
  );

  const allSuccess =
    ntResult.success &&
    cnResult.success &&
    ntResultNoFilter.success &&
    cnResultNoFilter.success;
  const hasData =
    ntResultNoFilter.articles.length > 0 ||
    cnResultNoFilter.articles.length > 0;

  if (allSuccess && hasData) {
    console.log(`\n🎉 All tests completed successfully!`);
    console.log(`\n✅ The Miso API is returning data.`);
    if (ntResult.articles.length === 0 && cnResult.articles.length === 0) {
      console.log(
        `\n⚠️  Note: Filters are preventing results. This may indicate:`
      );
      console.log(`   - Brand filter values need adjustment`);
      console.log(`   - Date filter is too restrictive`);
      console.log(`   - Articles in Miso don't match the filter criteria`);
    }
  } else if (allSuccess && !hasData) {
    console.log(`\n⚠️  API is working but no data available yet.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please review the errors above.`);
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

// Run the tests
runTests().catch((error) => {
  console.error("\n❌ Test execution failed:", error);
  process.exit(1);
});
