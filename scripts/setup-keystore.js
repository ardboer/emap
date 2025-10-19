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

// Dynamically discover valid brands from filesystem
const projectRoot = process.cwd();
const brandsDir = path.join(projectRoot, "brands");
const validBrands = fs
  .readdirSync(brandsDir, { withFileTypes: true })
  .filter((entry) => {
    if (
      !entry.isDirectory() ||
      entry.name.startsWith(".") ||
      entry.name.startsWith("_")
    ) {
      return false;
    }
    const configPath = path.join(brandsDir, entry.name, "config.json");
    return fs.existsSync(configPath) && /^[a-z0-9]{2,6}$/.test(entry.name);
  })
  .map((entry) => entry.name)
  .sort();

console.log(`📦 Discovered brands: ${validBrands.join(", ")}`);

// Validate brand
if (!validBrands.includes(brand)) {
  console.error(`❌ Invalid brand: ${brand}`);
  console.error(`Valid brands: ${validBrands.join(", ")}`);
  process.exit(1);
}

// Load brand configuration to get display name
const brandConfigPath = path.join(brandsDir, brand, "config.json");
const brandConfig = JSON.parse(fs.readFileSync(brandConfigPath, "utf8"));

// Generate key alias from brand shortcode
const keyAlias = `${brand}-key`;
const brandName = brandConfig.displayName;

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
