/**
 * Test script for fetchRelatedArticles function
 * This script tests the Miso Product to Products API integration
 */

const https = require("https");

// API Configuration (same as test-miso-api.js)
const SECRET_API_KEY = "4yxesK8tUzRGIz17RXDPgplM0c5ZAWnWjtD9cdcD";
const API_ENDPOINT =
  "https://api.askmiso.com/v1/recommendation/product_to_products";
const BRAND_FILTER = "CN"; // Construction News brand

// Test parameters
const TEST_ARTICLE_ID = "520094"; // Construction News article ID
const TEST_LIMIT = 3;
const ANONYMOUS_ID = "test-user-" + Math.random().toString(36).substring(7);
const PRODUCT_ID = `${TEST_ARTICLE_ID}`;

// Request payload
const requestBody = {
  user_id: ANONYMOUS_ID,
  product_id: PRODUCT_ID,
  rows: TEST_LIMIT,
  // fl: ["*"], // Get all fields
  // fq: `brand:"${BRAND_FILTER}"`, // Filter by brand
};

console.log("🧪 Testing fetchRelatedArticles - Miso Product to Products API");
console.log("━".repeat(60));
console.log("Endpoint:", API_ENDPOINT);
console.log("Brand Filter:", BRAND_FILTER);
console.log("Article ID:", TEST_ARTICLE_ID);
console.log("Product ID:", PRODUCT_ID);
console.log("Limit:", TEST_LIMIT);
console.log("");
console.log("Request Body:", JSON.stringify(requestBody, null, 2));
console.log("━".repeat(60));
console.log("");

// Parse URL
const url = new URL(API_ENDPOINT);

// Prepare request options
const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: "POST",
  headers: {
    "x-api-key": SECRET_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Make the request
const req = https.request(options, (res) => {
  let data = "";

  console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log("");

  // Collect data chunks
  res.on("data", (chunk) => {
    data += chunk;
  });

  // Handle complete response
  res.on("end", () => {
    try {
      const response = JSON.parse(data);

      console.log("✅ API Response Received");
      console.log("━".repeat(60));
      console.log("Full Response:");
      console.log(JSON.stringify(response, null, 2));
      console.log("━".repeat(60));
      console.log("");

      // Analyze the response structure
      console.log("📊 Response Analysis:");
      console.log("━".repeat(60));

      const products =
        (response.data && response.data.products) || response.products || [];

      if (products.length > 0) {
        console.log(`✓ Found ${products.length} related articles`);
        console.log("");

        console.log("Related Articles:");
        products.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.title || "No title"}`);
          console.log(`   Product ID: ${product.product_id || "N/A"}`);
          console.log(`   Published: ${product.published_at || "N/A"}`);
          console.log(
            `   Cover Image: ${
              product.cover_image
                ? product.cover_image.substring(0, 50) + "..."
                : "N/A"
            }`
          );

          // Show categories if available
          if (product.categories && Array.isArray(product.categories)) {
            const firstCat = product.categories[0];
            const category = Array.isArray(firstCat) ? firstCat[0] : firstCat;
            console.log(`   Category: ${category || "N/A"}`);
          }
        });
      } else {
        console.log("⚠️  No related articles found");
        console.log("This could mean:");
        console.log("  - The article ID doesn't exist in Miso");
        console.log("  - There are no related articles for this product");
        console.log("  - The brand filter might be incorrect");
      }

      console.log("");
      console.log("━".repeat(60));
      console.log("✅ Test completed successfully");
    } catch (error) {
      console.error("❌ Error parsing JSON response:");
      console.error(error.message);
      console.log("");
      console.log("Raw response data:");
      console.log(data);
    }
  });
});

// Handle request errors
req.on("error", (error) => {
  console.error("❌ Request Error:");
  console.error(error.message);
  console.error("");
  console.error("Full error:", error);
});

// Handle timeout
req.setTimeout(30000, () => {
  console.error("❌ Request timeout after 30 seconds");
  req.destroy();
});

// Send the request
req.write(JSON.stringify(requestBody));
req.end();
