#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Setup keystore properties for the current brand
 * Usage: node scripts/setup-keystore.js <brand> <password>
 */

const brand = process.argv[2];
const password = process.argv[3];

if (!brand || !password) {
  console.error("❌ Usage: node scripts/setup-keystore.js <brand> <password>");
  console.error("   Example: node scripts/setup-keystore.js nt mypassword");
  process.exit(1);
}

// Validate brand
const validBrands = ["cn", "nt"];
if (!validBrands.includes(brand)) {
  console.error(`❌ Invalid brand: ${brand}`);
  console.error(`Valid brands: ${validBrands.join(", ")}`);
  process.exit(1);
}

// Map brand to key alias
const brandKeyAliases = {
  cn: "construction-news-key",
  nt: "nursing-times-key",
};

const keyAlias = brandKeyAliases[brand];
const brandName = brand === "cn" ? "Construction News" : "Nursing Times";

console.log(`🔑 Setting up keystore for ${brandName} (${brand})`);
console.log(`🔑 Key alias: ${keyAlias}`);

// Create keystore.properties content
const keystoreContent = `# Keystore properties for release builds
# This file should NOT be committed to version control
# Auto-generated for brand: ${brand}

storePassword=${password}
keyPassword=${password}
keyAlias=${keyAlias}
storeFile=../keystores/release.keystore
`;

// Write keystore.properties file
const keystorePropertiesPath = path.join(
  process.cwd(),
  "android",
  "keystore.properties"
);
fs.writeFileSync(keystorePropertiesPath, keystoreContent);

console.log(`✅ Created keystore.properties for ${brandName}`);
console.log(`📁 File: ${keystorePropertiesPath}`);
console.log(`🔐 Key alias: ${keyAlias}`);
