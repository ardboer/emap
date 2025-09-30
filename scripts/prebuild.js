#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Get project root directory
const projectRoot = process.cwd();

/**
 * Pre-build script for EAS builds
 * Handles brand-specific configuration and asset copying
 *
 * Usage: node scripts/prebuild.js <brand>
 * Example: node scripts/prebuild.js cn
 */

const brand = process.argv[2];

if (!brand) {
  console.error("❌ Brand parameter is required");
  console.error("Usage: node scripts/prebuild.js <brand>");
  process.exit(1);
}

console.log(`🚀 Starting pre-build process for brand: ${brand}`);

// Validate brand
const validBrands = ["cn", "nt"];
if (!validBrands.includes(brand)) {
  console.error(`❌ Invalid brand: ${brand}`);
  console.error(`Valid brands: ${validBrands.join(", ")}`);
  process.exit(1);
}

// Load brand configuration
const brandConfigPath = path.join(projectRoot, "brands", brand, "config.json");
if (!fs.existsSync(brandConfigPath)) {
  console.error(`❌ Brand configuration not found: ${brandConfigPath}`);
  process.exit(1);
}

const brandConfig = JSON.parse(fs.readFileSync(brandConfigPath, "utf8"));
console.log(`✅ Loaded brand configuration for: ${brandConfig.displayName}`);

// Load environment variables from brand-specific .env file
const envPath = path.join(projectRoot, `.env.${brand}`);
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  console.log(`✅ Loaded environment variables from: .env.${brand}`);

  // Parse and set environment variables
  envContent.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join("=");
      }
    }
  });
}

// Update app.json with brand-specific configuration
const appJsonPath = path.join(projectRoot, "app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

// Update app configuration
appJson.expo.name = brandConfig.displayName;
// Keep slug as "emap" for EAS project consistency
// appJson.expo.slug = `emap-${brand}`;

// Update bundle identifiers
const bundleId =
  brand === "cn"
    ? "metropolis.co.uk.constructionnews"
    : "metropolis.net.nursingtimes";
appJson.expo.ios.bundleIdentifier = bundleId;
appJson.expo.android.package = bundleId;

// Update assets paths to use brand-specific assets
const brandAssetsPath = `./brands/${brand}/assets`;
appJson.expo.icon = `${brandAssetsPath}/icon.png`;
appJson.expo.android.adaptiveIcon.foregroundImage = `${brandAssetsPath}/adaptive-icon.png`;
appJson.expo.web.favicon = `${brandAssetsPath}/favicon.png`;

// Update splash screen
if (appJson.expo.plugins) {
  appJson.expo.plugins.forEach((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "expo-splash-screen") {
      plugin[1].image = `${brandAssetsPath}/splash-icon.png`;
    }
  });
}

// Add brand-specific extra configuration
appJson.expo.extra.brandConfig = {
  ...appJson.expo.extra.brandConfig,
  brand: brand,
  brandName: brandConfig.displayName,
  bundleIdentifier: bundleId,
};

// Write updated app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log(
  `✅ Updated app.json with ${brandConfig.displayName} configuration`
);

// Copy brand-specific assets to main assets directory
const copyAssets = () => {
  const brandAssetsDir = path.join(projectRoot, "brands", brand, "assets");
  const mainAssetsDir = path.join(projectRoot, "assets", "images");

  if (!fs.existsSync(brandAssetsDir)) {
    console.warn(`⚠️  Brand assets directory not found: ${brandAssetsDir}`);
    return;
  }

  const assetFiles = [
    "icon.png",
    "adaptive-icon.png",
    "favicon.png",
    "splash-icon.png",
    "react-logo.png",
    "react-logo@2x.png",
    "react-logo@3x.png",
    "partial-react-logo.png",
  ];

  assetFiles.forEach((file) => {
    const sourcePath = path.join(brandAssetsDir, file);
    const destPath = path.join(mainAssetsDir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file} to main assets`);
    } else {
      console.warn(`⚠️  Asset file not found: ${sourcePath}`);
    }
  });
};

copyAssets();

console.log(
  `🎉 Pre-build process completed successfully for ${brandConfig.displayName}`
);
console.log(`📱 Bundle ID: ${bundleId}`);
console.log(`🎨 Brand: ${brand}`);
