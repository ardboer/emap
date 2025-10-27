#!/usr/bin/env node

/**
 * Test Slug API Resolution
 *
 * This script tests if the WordPress API is correctly resolving slugs to article IDs
 *
 * Usage: node scripts/test-slug-api.js
 */

const testSlugs = [
  "community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025",
  "careers/cornish-nurse-celebrates-50-years-of-caring-with-the-health-service-24-10-2025",
  "professional-regulation/nurse-leader-joins-nmc-council-at-critical-time-for-the-regulator-21-10-2025",
];

const baseUrl = "https://www.nursingtimes.net";
const hash = "5506c4c9af9349c87a364b3b0b1988";

console.log("🧪 Testing WordPress API Slug Resolution\n");
console.log("=".repeat(60));

async function testSlug(slug) {
  const endpoint = `/wp-json/mbm-apps/v1/get-post-by-slug/?slug=${encodeURIComponent(
    slug
  )}&hash=${hash}&_fields=id`;
  const url = `${baseUrl}${endpoint}`;

  console.log(`\n📝 Testing slug: ${slug.substring(0, 50)}...`);
  console.log(`🔗 URL: ${url.substring(0, 80)}...`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data && data.id) {
      console.log(`✅ Resolved to article ID: ${data.id}`);
      return data.id;
    } else {
      console.log(`❌ No ID in response:`, data);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  const results = [];

  for (const slug of testSlugs) {
    const id = await testSlug(slug);
    results.push({ slug, id });
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Summary:\n");

  results.forEach(({ slug, id }) => {
    const shortSlug = slug.split("/").pop().substring(0, 40);
    console.log(`${id ? "✅" : "❌"} ${shortSlug}... → ${id || "FAILED"}`);
  });

  // Check for duplicates
  const ids = results.filter((r) => r.id).map((r) => r.id);
  const uniqueIds = [...new Set(ids)];

  console.log("\n" + "=".repeat(60));

  if (ids.length !== uniqueIds.length) {
    console.log(
      "\n⚠️  WARNING: Multiple slugs resolved to the same article ID!"
    );
    console.log("This is a WordPress API issue, not a deep linking problem.\n");

    // Find duplicates
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    console.log(`Duplicate IDs: ${[...new Set(duplicates)].join(", ")}`);
  } else {
    console.log("\n✅ All slugs resolved to unique article IDs");
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

runTests().catch(console.error);
