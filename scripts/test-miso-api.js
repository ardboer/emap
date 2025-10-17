/**
 * Test script for Miso API endpoint
 * This script tests the Miso trending API to understand its response structure
 */

const https = require("https");
const crypto = require("crypto");

// API Configuration
const SECRET_API_KEY = "4yxesK8tUzRGIz17RXDPgplM0c5ZAWnWjtD9cdcD";
const PUBLISHABLE_API_KEY = "4yxesK8tUzRGIz17RXDPgplM0c5ZAWnWjtD9cdcD";
const API_ENDPOINT =
  "https://api.askmiso.com/v1/recommendation/user_to_trending";

// Use anonymous user approach
const anonymousId = "anonymous_test_user_123";

console.log("🔐 Authentication Details:");
console.log("Using Secret API Key for server-side call");
console.log("Anonymous ID:", anonymousId);
console.log("");

// Request payload
// When using Secret API Key, user_hash is NOT required
const requestBody = {
  anonymous_id: anonymousId,
  fl: ["*"], // Get all fields
  rows: 10, // Get 10 trending articles
  // Removed filters to see if we get any results
  // boost_fq: "published_at:[2024-01-17 TO *]", // Articles from last year
  // fq: "brand:Nursing Times", // Filter for Nursing Times brand
};

console.log("🔍 Testing Miso API Endpoint");
console.log("━".repeat(60));
console.log("Endpoint:", API_ENDPOINT);
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
  console.log("Response Headers:", JSON.stringify(res.headers, null, 2));
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

      if (response.data && Array.isArray(response.data)) {
        console.log(`✓ Found ${response.data.length} articles in response`);
        console.log("");

        if (response.data.length > 0) {
          const firstArticle = response.data[0];
          console.log("First Article Structure:");
          console.log(
            "Available Fields:",
            Object.keys(firstArticle).join(", ")
          );
          console.log("");

          // Check for key fields we need
          const requiredFields = [
            "title",
            "id",
            "url",
            "image",
            "imageUrl",
            "published_at",
            "author",
            "description",
            "content",
          ];
          console.log("Field Availability Check:");
          requiredFields.forEach((field) => {
            const exists = field in firstArticle;
            const value = exists
              ? typeof firstArticle[field] === "string"
                ? firstArticle[field].substring(0, 50)
                : firstArticle[field]
              : "N/A";
            console.log(
              `  ${exists ? "✓" : "✗"} ${field}: ${
                exists ? value : "NOT FOUND"
              }`
            );
          });
          console.log("");

          // Display first article details
          console.log("First Article Details:");
          console.log(JSON.stringify(firstArticle, null, 2));
        }
      } else if (response.products && Array.isArray(response.products)) {
        console.log(`✓ Found ${response.products.length} products in response`);
        console.log("");

        if (response.products.length > 0) {
          const firstProduct = response.products[0];
          console.log("First Product Structure:");
          console.log(
            "Available Fields:",
            Object.keys(firstProduct).join(", ")
          );
          console.log("");

          // Check for key fields we need
          const requiredFields = [
            "title",
            "product_id",
            "url",
            "cover_image",
            "published_at",
            "authors",
            "description",
          ];
          console.log("Field Availability Check:");
          requiredFields.forEach((field) => {
            const exists = field in firstProduct;
            const value = exists
              ? typeof firstProduct[field] === "string"
                ? firstProduct[field].substring(0, 50)
                : firstProduct[field]
              : "N/A";
            console.log(
              `  ${exists ? "✓" : "✗"} ${field}: ${
                exists ? value : "NOT FOUND"
              }`
            );
          });
          console.log("");

          // Display first product details
          console.log("First Product Details:");
          console.log(JSON.stringify(firstProduct, null, 2));
        }
      } else {
        console.log("⚠️  Unexpected response structure");
        console.log("Response keys:", Object.keys(response).join(", "));
      }

      console.log("━".repeat(60));
      console.log("");
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
