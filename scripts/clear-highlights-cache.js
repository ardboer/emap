/**
 * Script to clear the highlights cache
 * Run this after updating the highlights implementation to ensure fresh data
 */

const AsyncStorage =
  require("@react-native-async-storage/async-storage").default;

async function clearHighlightsCache() {
  try {
    console.log("🗑️  Clearing highlights cache...");

    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log(`Found ${keys.length} total cache keys`);

    // Find highlights-related keys
    const highlightsKeys = keys.filter(
      (key) =>
        key.includes("highlights") ||
        key.includes("featured_articles") ||
        key.includes("recommended_articles")
    );

    if (highlightsKeys.length > 0) {
      console.log(`Found ${highlightsKeys.length} highlights-related keys:`);
      highlightsKeys.forEach((key) => console.log(`  - ${key}`));

      // Remove them
      await AsyncStorage.multiRemove(highlightsKeys);
      console.log("✅ Highlights cache cleared successfully!");
    } else {
      console.log("ℹ️  No highlights cache keys found");
    }

    console.log("\n💡 Tip: Pull to refresh in the app to see the changes");
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
  }
}

clearHighlightsCache();
