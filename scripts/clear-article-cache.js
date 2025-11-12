#!/usr/bin/env node

/**
 * Clear Article Cache Script
 *
 * This script clears the cached article data to force fresh API calls
 * that will include the new author_data field.
 */

const AsyncStorage =
  require("@react-native-async-storage/async-storage").default;

async function clearArticleCache() {
  try {
    console.log("🗑️  Clearing article cache...");

    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log(`📋 Found ${keys.length} total cache keys`);

    // Filter for article-related keys
    const articleKeys = keys.filter(
      (key) => key.includes("single_article") || key.includes("article_")
    );

    console.log(`🎯 Found ${articleKeys.length} article cache keys to clear`);

    if (articleKeys.length > 0) {
      // Remove article cache keys
      await AsyncStorage.multiRemove(articleKeys);
      console.log("✅ Article cache cleared successfully!");
      console.log("📝 Cleared keys:", articleKeys);
    } else {
      console.log("ℹ️  No article cache keys found");
    }

    console.log(
      "\n✨ Done! Fresh article data with author info will be loaded on next fetch."
    );
  } catch (error) {
    console.error("❌ Error clearing article cache:", error);
    process.exit(1);
  }
}

clearArticleCache();
