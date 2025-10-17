/**
 * Script to clear the trending articles cache
 * Run this after updating the Miso implementation to ensure fresh data
 */

const AsyncStorage =
  require("@react-native-async-storage/async-storage").default;

async function clearTrendingCache() {
  try {
    console.log("🗑️  Clearing trending articles cache...");

    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log(`Found ${keys.length} total cache keys`);

    // Find trending-related keys
    const trendingKeys = keys.filter(
      (key) =>
        key.includes("trending") ||
        key.includes("miso") ||
        key.includes("related")
    );

    if (trendingKeys.length > 0) {
      console.log(`Found ${trendingKeys.length} trending-related keys:`);
      trendingKeys.forEach((key) => console.log(`  - ${key}`));

      // Remove them
      await AsyncStorage.multiRemove(trendingKeys);
      console.log("✅ Trending cache cleared successfully!");
    } else {
      console.log("ℹ️  No trending cache keys found");
    }

    console.log("\n💡 Tip: Restart your app to see the changes");
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
  }
}

clearTrendingCache();
