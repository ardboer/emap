/**
 * Brand Discovery Utility
 *
 * Dynamically discovers brands by scanning the brands/ directory for folders
 * containing config.json files. Works in both Node.js (build-time) and
 * React Native (runtime) environments.
 */

import { BrandConfig } from "./index";

// Type for brand loader function
export type BrandLoader = () => BrandConfig;

// Type for discovered brands registry
export type BrandsRegistry = Record<string, BrandLoader>;

/**
 * Discover brands at build-time (Node.js environment)
 * Used by scripts and build processes
 */
export function discoverBrandsSync(): BrandsRegistry {
  // Only available in Node.js environment
  if (typeof require !== "undefined" && typeof process !== "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");

      // Determine the brands directory path
      const brandsDir = path.join(__dirname);

      // Read all entries in the brands directory
      const entries = fs.readdirSync(brandsDir, { withFileTypes: true });

      const brands: BrandsRegistry = {};

      for (const entry of entries) {
        // Skip non-directories and special files
        if (
          !entry.isDirectory() ||
          entry.name.startsWith(".") ||
          entry.name.startsWith("_")
        ) {
          continue;
        }

        const brandPath = path.join(brandsDir, entry.name);
        const configPath = path.join(brandPath, "config.json");

        // Check if config.json exists
        if (fs.existsSync(configPath)) {
          const shortcode = entry.name;

          // Validate shortcode format (2-6 lowercase alphanumeric)
          if (/^[a-z0-9]{2,6}$/.test(shortcode)) {
            // Create a loader function for this brand
            // Use absolute path to avoid Metro bundler issues with dynamic requires
            const absoluteConfigPath = configPath;
            brands[shortcode] = () => {
              const configContent = fs.readFileSync(absoluteConfigPath, "utf8");
              return JSON.parse(configContent);
            };
          }
        }
      }

      return brands;
    } catch (error) {
      console.warn("Failed to discover brands dynamically:", error);
      return {};
    }
  }

  return {};
}

/**
 * Get list of available brand shortcodes from filesystem
 * Used by scripts for validation
 */
export function getAvailableBrandShortcodes(): string[] {
  if (typeof require !== "undefined" && typeof process !== "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");

      const brandsDir = path.join(__dirname);
      const entries = fs.readdirSync(brandsDir, { withFileTypes: true });

      const shortcodes: string[] = [];

      for (const entry of entries) {
        if (
          !entry.isDirectory() ||
          entry.name.startsWith(".") ||
          entry.name.startsWith("_")
        ) {
          continue;
        }

        const configPath = path.join(brandsDir, entry.name, "config.json");

        if (fs.existsSync(configPath) && /^[a-z0-9]{2,6}$/.test(entry.name)) {
          shortcodes.push(entry.name);
        }
      }

      return shortcodes.sort();
    } catch (error) {
      console.warn("Failed to get brand shortcodes:", error);
      return [];
    }
  }

  return [];
}

/**
 * Get brand configuration from filesystem
 * Used by scripts to read brand config
 */
export function getBrandConfig(shortcode: string): BrandConfig | null {
  if (typeof require !== "undefined" && typeof process !== "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");

      const configPath = path.join(__dirname, shortcode, "config.json");

      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, "utf8");
        return JSON.parse(configContent);
      }
    } catch (error) {
      console.warn(`Failed to load brand config for ${shortcode}:`, error);
    }
  }

  return null;
}

/**
 * Validate if a brand exists in the filesystem
 */
export function brandExists(shortcode: string): boolean {
  if (typeof require !== "undefined" && typeof process !== "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");

      const configPath = path.join(__dirname, shortcode, "config.json");
      return fs.existsSync(configPath);
    } catch (error) {
      return false;
    }
  }

  return false;
}

/**
 * Get bundle ID mapping from all brand configs
 * Returns a map of bundle IDs to brand shortcodes
 */
export function getBundleIdMapping(): Record<string, string> {
  const mapping: Record<string, string> = {};
  const shortcodes = getAvailableBrandShortcodes();

  for (const shortcode of shortcodes) {
    const config = getBrandConfig(shortcode);
    if (config) {
      // Extract bundle IDs from app.json structure if present
      // This assumes the config might have iOS/Android bundle identifiers
      // We'll need to check the actual structure
      try {
        const fs = require("fs");
        const path = require("path");
        const appJsonPath = path.join(process.cwd(), "app.json");

        if (fs.existsSync(appJsonPath)) {
          // For now, we'll build this from the prebuild script logic
          // Each brand should ideally store its bundle ID in config.json
          // But we can infer it from the domain or other properties

          // Check if config has explicit bundle ID
          if ((config as any).bundleId) {
            mapping[(config as any).bundleId] = shortcode;
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }
  }

  return mapping;
}
