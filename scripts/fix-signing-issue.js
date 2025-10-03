#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Fix Android signing issue for multi-brand builds
 * This script ensures the correct keystore alias is used for each brand
 */

const projectRoot = process.cwd();

console.log("🔧 Fixing Android signing configuration...\n");

// 1. Get current brand
const brandKeyPath = path.join(projectRoot, "config", "brandKey.ts");
if (!fs.existsSync(brandKeyPath)) {
  console.error("❌ Brand key file not found. Run prebuild script first.");
  process.exit(1);
}

const brandKeyContent = fs.readFileSync(brandKeyPath, "utf8");
const brandMatch = brandKeyContent.match(/ACTIVE_BRAND = '(\w+)'/);
if (!brandMatch) {
  console.error("❌ Could not determine current brand");
  process.exit(1);
}

const currentBrand = brandMatch[1];
const expectedAlias =
  currentBrand === "cn" ? "construction-news-key" : "nursing-times-key";
const brandName = currentBrand === "cn" ? "Construction News" : "Nursing Times";

console.log(`🎯 Current brand: ${brandName} (${currentBrand})`);
console.log(`🔑 Expected alias: ${expectedAlias}`);

// 2. Update gradle.properties with correct alias
const gradlePropsPath = path.join(projectRoot, "android", "gradle.properties");
if (!fs.existsSync(gradlePropsPath)) {
  console.error("❌ gradle.properties not found");
  process.exit(1);
}

let gradleContent = fs.readFileSync(gradlePropsPath, "utf8");

// Update the key alias
const oldAliasMatch = gradleContent.match(/MYAPP_RELEASE_KEY_ALIAS=(.+)/);
if (oldAliasMatch) {
  const oldAlias = oldAliasMatch[1];
  if (oldAlias !== expectedAlias) {
    console.log(`🔄 Updating alias: ${oldAlias} → ${expectedAlias}`);
    gradleContent = gradleContent.replace(
      /MYAPP_RELEASE_KEY_ALIAS=.+/,
      `MYAPP_RELEASE_KEY_ALIAS=${expectedAlias}`
    );
    fs.writeFileSync(gradlePropsPath, gradleContent);
    console.log("✅ Updated gradle.properties");
  } else {
    console.log("✅ Alias already correct in gradle.properties");
  }
} else {
  console.error("❌ MYAPP_RELEASE_KEY_ALIAS not found in gradle.properties");
  process.exit(1);
}

// 3. Verify keystore contains the expected alias
const keystorePath = path.join(
  projectRoot,
  "android",
  "app",
  "emap-master-upload-key.keystore"
);
if (!fs.existsSync(keystorePath)) {
  console.error("❌ Keystore file not found");
  process.exit(1);
}

console.log("\n🔍 Verifying keystore contains expected alias...");
try {
  // Check if alias exists in keystore
  const keystoreList = execSync(
    `keytool -list -keystore "${keystorePath}" -storepass If435i34344df8T`,
    {
      encoding: "utf8",
    }
  );

  if (keystoreList.includes(expectedAlias)) {
    console.log(`✅ Keystore contains alias: ${expectedAlias}`);

    // Get fingerprint for verification
    const fingerprintOutput = execSync(
      `keytool -list -v -alias "${expectedAlias}" -keystore "${keystorePath}" -storepass If435i34344df8T`,
      {
        encoding: "utf8",
      }
    );

    const sha1Match = fingerprintOutput.match(/SHA1: ([A-F0-9:]+)/);
    if (sha1Match) {
      console.log(`🔑 SHA1 fingerprint: ${sha1Match[1]}`);

      // Check if this matches expected fingerprint for the brand
      const expectedFingerprints = {
        "construction-news-key":
          "2F:61:DF:B5:4C:88:39:29:F6:58:3D:2F:18:49:29:63:CD:0C:78:0F",
        "nursing-times-key":
          "53:38:F9:D4:D2:98:17:E6:D7:C1:68:01:0D:EF:89:48:1D:A1:0A:17",
      };

      if (sha1Match[1] === expectedFingerprints[expectedAlias]) {
        console.log("✅ Fingerprint matches expected value");
      } else {
        console.log(
          `⚠️  Fingerprint mismatch. Expected: ${expectedFingerprints[expectedAlias]}`
        );
      }
    }
  } else {
    console.error(`❌ Keystore does not contain alias: ${expectedAlias}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ Error checking keystore: ${error.message}`);
  process.exit(1);
}

// 4. Clean build artifacts to ensure fresh build
console.log("\n🧹 Cleaning build artifacts...");
try {
  execSync("cd android && ./gradlew clean", { stdio: "inherit" });
  console.log("✅ Build artifacts cleaned");
} catch (error) {
  console.error(`❌ Error cleaning build: ${error.message}`);
}

// 5. Clear React Native cache
console.log("\n🧹 Clearing React Native cache...");
try {
  execSync("npx react-native start --reset-cache", { stdio: "pipe" });
  console.log("✅ React Native cache cleared");
} catch (error) {
  // This command might fail if metro is not running, which is fine
  console.log("⚠️  React Native cache clear attempted");
}

console.log("\n🎉 Signing configuration fixed!");
console.log("\n📋 Next steps:");
console.log("1. Build the release bundle:");
console.log("   cd android && ./gradlew bundleRelease");
console.log("\n2. The AAB file will be created with the correct signing:");
console.log(
  `   android/app/build/outputs/bundle/release/app-release_${currentBrand}.aab`
);
console.log("\n3. Upload this AAB to Google Play Console");
console.log(
  `\n🔑 Expected SHA1 for ${brandName}: ${
    expectedAlias === "construction-news-key"
      ? "2F:61:DF:B5:4C:88:39:29:F6:58:3D:2F:18:49:29:63:CD:0C:78:0F"
      : "53:38:F9:D4:D2:98:17:E6:D7:C1:68:01:0D:EF:89:48:1D:A1:0A:17"
  }`
);
