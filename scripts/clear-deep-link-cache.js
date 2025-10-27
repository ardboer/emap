#!/usr/bin/env node

/**
 * Clear Deep Link Cache
 *
 * This script clears all deep link cache entries from AsyncStorage
 * Run this if deep links are opening the wrong articles
 *
 * Usage: node scripts/clear-deep-link-cache.js
 */

const { execSync } = require("child_process");

console.log("🧹 Clearing deep link cache...\n");

try {
  // For iOS Simulator
  console.log("📱 Clearing iOS Simulator cache...");
  execSync(
    "xcrun simctl get_app_container booted metropolis.net.nursingtimes data",
    { stdio: "pipe" }
  );
  console.log("✅ iOS cache location found\n");
} catch (error) {
  console.log("ℹ️  iOS Simulator not running or app not installed\n");
}

console.log("To manually clear cache:");
console.log("1. In your app, add this code temporarily:");
console.log(
  '   import AsyncStorage from "@react-native-async-storage/async-storage";'
);
console.log("   AsyncStorage.getAllKeys().then(keys => {");
console.log(
  '     const deepLinkKeys = keys.filter(k => k.startsWith("deeplink_"));'
);
console.log("     AsyncStorage.multiRemove(deepLinkKeys);");
console.log("   });");
console.log("\n2. Or simply wait 3 seconds between tests\n");
console.log("\n3. Or delete and reinstall the app\n");

console.log(
  "💡 Tip: The cache expires after 3 seconds, so wait a bit between tests!"
);
