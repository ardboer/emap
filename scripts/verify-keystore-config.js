#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Verify keystore configuration for current brand
 * This script helps debug signing issues by checking all configuration files
 */

const projectRoot = process.cwd();

console.log("🔍 Verifying keystore configuration...\n");

// 1. Check current brand
const brandKeyPath = path.join(projectRoot, "config", "brandKey.ts");
if (fs.existsSync(brandKeyPath)) {
  const brandKeyContent = fs.readFileSync(brandKeyPath, "utf8");
  const brandMatch = brandKeyContent.match(/ACTIVE_BRAND = '(\w+)'/);
  if (brandMatch) {
    const currentBrand = brandMatch[1];
    console.log(`✅ Current brand: ${currentBrand}`);

    // Expected alias for this brand
    const expectedAlias =
      currentBrand === "cn" ? "construction-news-key" : "nursing-times-key";
    console.log(`✅ Expected key alias: ${expectedAlias}`);
  }
} else {
  console.log("❌ Brand key file not found");
}

// 2. Check gradle.properties
const gradlePropsPath = path.join(projectRoot, "android", "gradle.properties");
if (fs.existsSync(gradlePropsPath)) {
  const gradleContent = fs.readFileSync(gradlePropsPath, "utf8");
  const aliasMatch = gradleContent.match(/MYAPP_RELEASE_KEY_ALIAS=(.+)/);
  const storeFileMatch = gradleContent.match(/MYAPP_RELEASE_STORE_FILE=(.+)/);

  if (aliasMatch) {
    console.log(`✅ Gradle key alias: ${aliasMatch[1]}`);
  }
  if (storeFileMatch) {
    console.log(`✅ Gradle keystore file: ${storeFileMatch[1]}`);
  }
} else {
  console.log("❌ gradle.properties not found");
}

// 3. Check keystore contents
const keystorePath = path.join(
  projectRoot,
  "android",
  "app",
  "emap-master-upload-key.keystore"
);
if (fs.existsSync(keystorePath)) {
  console.log("\n🔑 Keystore aliases and fingerprints:");
  try {
    // List keystore contents (will prompt for password)
    const keystoreInfo = execSync(`keytool -list -keystore "${keystorePath}"`, {
      encoding: "utf8",
      stdio: ["inherit", "pipe", "pipe"],
    });
    console.log(keystoreInfo);
  } catch (error) {
    console.log("⚠️  Could not read keystore (password required)");
  }
} else {
  console.log("❌ Keystore file not found");
}

// 4. Check build.gradle configuration
const buildGradlePath = path.join(
  projectRoot,
  "android",
  "app",
  "build.gradle"
);
if (fs.existsSync(buildGradlePath)) {
  const buildGradleContent = fs.readFileSync(buildGradlePath, "utf8");

  // Check if signing config references the correct properties
  const signingConfigMatch = buildGradleContent.match(
    /signingConfigs\s*\{[\s\S]*?release\s*\{[\s\S]*?\}/
  );
  if (signingConfigMatch) {
    console.log("\n📋 Build.gradle signing configuration found");

    // Check if it uses MYAPP_RELEASE_KEY_ALIAS
    if (buildGradleContent.includes("MYAPP_RELEASE_KEY_ALIAS")) {
      console.log("✅ Uses MYAPP_RELEASE_KEY_ALIAS property");
    } else {
      console.log("❌ Does not use MYAPP_RELEASE_KEY_ALIAS property");
    }
  }
}

console.log("\n🎯 Next steps:");
console.log("1. Ensure you've run the prebuild script for the correct brand");
console.log("2. Clean and rebuild the project");
console.log("3. Verify the AAB file is signed with the correct alias");
console.log("\nCommands:");
console.log("  node scripts/prebuild.js cn");
console.log("  cd android && ./gradlew clean");
console.log("  cd android && ./gradlew bundleRelease");
