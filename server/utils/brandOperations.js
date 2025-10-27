/**
 * Brand Operations Utility
 * Handles file system operations for brand management
 */

const fs = require("fs-extra");
const path = require("path");

// Path to brands directory (relative to server root)
const BRANDS_DIR = path.join(__dirname, "../../brands");
const CONFIG_DIR = path.join(__dirname, "../../config");
const APP_JSON_PATH = path.join(__dirname, "../../app.json");

/**
 * Get all available brands
 */
async function getAllBrands() {
  try {
    const entries = await fs.readdir(BRANDS_DIR, { withFileTypes: true });
    const brands = [];

    for (const entry of entries) {
      if (
        !entry.isDirectory() ||
        entry.name.startsWith(".") ||
        entry.name.startsWith("_")
      ) {
        continue;
      }

      const configPath = path.join(BRANDS_DIR, entry.name, "config.json");

      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        brands.push({
          shortcode: entry.name,
          ...config,
        });
      }
    }

    return brands;
  } catch (error) {
    throw new Error(`Failed to get brands: ${error.message}`);
  }
}

/**
 * Get a specific brand by shortcode
 */
async function getBrand(shortcode) {
  try {
    const configPath = path.join(BRANDS_DIR, shortcode, "config.json");

    if (!(await fs.pathExists(configPath))) {
      return null;
    }

    const config = await fs.readJson(configPath);
    return config;
  } catch (error) {
    throw new Error(`Failed to get brand ${shortcode}: ${error.message}`);
  }
}

/**
 * Check if a brand exists
 */
async function brandExists(shortcode) {
  const configPath = path.join(BRANDS_DIR, shortcode, "config.json");
  return await fs.pathExists(configPath);
}

/**
 * Create a new brand
 */
async function createBrand(shortcode, config) {
  try {
    const brandDir = path.join(BRANDS_DIR, shortcode);

    // Check if brand already exists
    if (await fs.pathExists(brandDir)) {
      throw new Error(`Brand ${shortcode} already exists`);
    }

    // Create brand directory structure
    await fs.ensureDir(brandDir);
    await fs.ensureDir(path.join(brandDir, "assets"));

    // Write config.json
    const configPath = path.join(brandDir, "config.json");
    await fs.writeJson(configPath, config, { spaces: 2 });

    return config;
  } catch (error) {
    throw new Error(`Failed to create brand: ${error.message}`);
  }
}

/**
 * Update an existing brand configuration
 */
async function updateBrand(shortcode, config) {
  try {
    const configPath = path.join(BRANDS_DIR, shortcode, "config.json");

    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Brand ${shortcode} does not exist`);
    }

    // Ensure shortcode in config matches
    config.shortcode = shortcode;

    // Write updated config
    await fs.writeJson(configPath, config, { spaces: 2 });

    return config;
  } catch (error) {
    throw new Error(`Failed to update brand: ${error.message}`);
  }
}

/**
 * Delete a brand
 */
async function deleteBrand(shortcode) {
  try {
    const brandDir = path.join(BRANDS_DIR, shortcode);

    if (!(await fs.pathExists(brandDir))) {
      throw new Error(`Brand ${shortcode} does not exist`);
    }

    // Remove entire brand directory
    await fs.remove(brandDir);

    return true;
  } catch (error) {
    throw new Error(`Failed to delete brand: ${error.message}`);
  }
}

/**
 * Save brand asset file
 */
async function saveBrandAsset(shortcode, filename, fileBuffer) {
  try {
    const brandDir = path.join(BRANDS_DIR, shortcode);

    if (!(await fs.pathExists(brandDir))) {
      throw new Error(`Brand ${shortcode} does not exist`);
    }

    let filePath;
    // Special files that live in the brand root directory
    const rootFiles = [
      "logo.svg",
      "logo-header.svg",
      "logo-header-dark.svg",
      "editor.jpg",
    ];

    if (rootFiles.includes(filename)) {
      filePath = path.join(brandDir, filename);
    } else {
      // Other assets go in assets folder
      await fs.ensureDir(path.join(brandDir, "assets"));
      filePath = path.join(brandDir, "assets", filename);
    }

    await fs.writeFile(filePath, fileBuffer);

    return filePath;
  } catch (error) {
    throw new Error(`Failed to save asset: ${error.message}`);
  }
}

/**
 * Get brand asset
 */
async function getBrandAsset(shortcode, filename) {
  try {
    let filePath;
    // Special files that live in the brand root directory
    const rootFiles = [
      "logo.svg",
      "logo-header.svg",
      "logo-header-dark.svg",
      "editor.jpg",
    ];

    if (rootFiles.includes(filename)) {
      filePath = path.join(BRANDS_DIR, shortcode, filename);
    } else {
      filePath = path.join(BRANDS_DIR, shortcode, "assets", filename);
    }

    if (!(await fs.pathExists(filePath))) {
      return null;
    }

    return filePath;
  } catch (error) {
    throw new Error(`Failed to get asset: ${error.message}`);
  }
}

/**
 * Get currently active brand from brandKey.ts
 */
async function getActiveBrand() {
  try {
    const brandKeyPath = path.join(CONFIG_DIR, "brandKey.ts");
    const content = await fs.readFile(brandKeyPath, "utf8");

    // Parse the ACTIVE_BRAND value
    const match = content.match(/export const ACTIVE_BRAND = ['"]([^'"]+)['"]/);

    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to get active brand: ${error.message}`);
  }
}

/**
 * Switch active brand by updating brandKey.ts and app.json
 */
async function switchActiveBrand(shortcode) {
  try {
    // Verify brand exists
    if (!(await brandExists(shortcode))) {
      throw new Error(`Brand ${shortcode} does not exist`);
    }

    // Get brand config
    const brandConfig = await getBrand(shortcode);

    // Update brandKey.ts
    const brandKeyPath = path.join(CONFIG_DIR, "brandKey.ts");
    const brandKeyContent = `// This file is auto-generated by the prebuild script
// Do not edit manually - it will be overwritten

export const ACTIVE_BRAND = '${shortcode}';
`;
    await fs.writeFile(brandKeyPath, brandKeyContent, "utf8");

    // Update app.json
    const appJson = await fs.readJson(APP_JSON_PATH);

    // Update expo configuration
    appJson.expo.name = brandConfig.name;
    appJson.expo.icon = `./brands/${shortcode}/assets/icon.png`;

    // Update iOS bundle identifier
    if (appJson.expo.ios) {
      appJson.expo.ios.bundleIdentifier =
        brandConfig.bundleId || `com.emap.${shortcode}`;
    }

    // Update Android package
    if (appJson.expo.android) {
      appJson.expo.android.package =
        brandConfig.bundleId || `com.emap.${shortcode}`;
      appJson.expo.android.adaptiveIcon = {
        foregroundImage: `./brands/${shortcode}/assets/adaptive-icon.png`,
        backgroundColor: brandConfig.branding?.iconBackgroundColor || "#ffffff",
      };
    }

    // Update web favicon
    if (appJson.expo.web) {
      appJson.expo.web.favicon = `./brands/${shortcode}/assets/favicon.png`;
    }

    // Update splash screen
    const splashPlugin = appJson.expo.plugins?.find(
      (p) => Array.isArray(p) && p[0] === "expo-splash-screen"
    );
    if (splashPlugin && splashPlugin[1]) {
      splashPlugin[1].image = `./brands/${shortcode}/assets/splash-icon.png`;
      splashPlugin[1].backgroundColor =
        brandConfig.branding?.iconBackgroundColor || "#ffffff";
    }

    // Update extra.brandConfig
    if (!appJson.expo.extra) {
      appJson.expo.extra = {};
    }
    appJson.expo.extra.brandConfig = {
      dynamicName: true,
      dynamicIcon: true,
      dynamicSplash: true,
      dynamicColors: true,
      brand: shortcode,
      brandName: brandConfig.name,
      bundleIdentifier: brandConfig.bundleId || `com.emap.${shortcode}`,
      actualIOSBundleId: brandConfig.bundleId || `com.emap.${shortcode}`,
    };

    await fs.writeJson(APP_JSON_PATH, appJson, { spaces: 2 });

    return {
      success: true,
      activeBrand: shortcode,
      brandConfig,
    };
  } catch (error) {
    throw new Error(`Failed to switch brand: ${error.message}`);
  }
}

module.exports = {
  getAllBrands,
  getBrand,
  brandExists,
  createBrand,
  updateBrand,
  deleteBrand,
  saveBrandAsset,
  getBrandAsset,
  getActiveBrand,
  switchActiveBrand,
};
