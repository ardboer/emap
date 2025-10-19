/**
 * Keystore Checker
 * Verifies if a brand's alias exists in the production keystore
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs-extra");
const { getBrand, updateBrand } = require("./brandOperations");

const execAsync = promisify(exec);

// Load environment variables from root .env
require("dotenv").config({ path: path.join(process.cwd(), "../.env") });

// Path to the production keystore
const KEYSTORE_PATH = path.join(
  process.cwd(),
  "../android/app/emap-master-upload-key.keystore"
);
const KEYSTORE_PASSWORD = process.env.KEYSTORE_PASSWORD;

if (!KEYSTORE_PASSWORD) {
  console.warn("WARNING: KEYSTORE_PASSWORD not found in environment variables");
}

/**
 * Check if a brand's alias exists in the production keystore
 * @param {string} shortcode - Brand shortcode
 * @returns {Promise<{configured: boolean, details: string, lastChecked: string, alias: string}>}
 */
async function checkKeystoreAlias(shortcode) {
  try {
    const brand = await getBrand(shortcode);

    if (!brand) {
      throw new Error(`Brand ${shortcode} not found`);
    }

    // Check if keystore file exists
    if (!(await fs.pathExists(KEYSTORE_PATH))) {
      return {
        configured: false,
        details: "Production keystore file not found",
        lastChecked: new Date().toISOString(),
        alias: null,
      };
    }

    // Expected alias format: usually the shortcode or bundle ID
    const expectedAlias = shortcode.toLowerCase();

    console.log(
      `Checking keystore alias for ${shortcode} (${expectedAlias})...`
    );

    // Run keytool to list aliases in the keystore
    const command = `keytool -list -v -keystore "${KEYSTORE_PATH}" -storepass "${KEYSTORE_PASSWORD}"`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000, // 10 second timeout
      });

      const output = stdout + stderr;

      // Extract all aliases from the output for logging
      const aliasMatches = output.match(/Alias name:\s*([^\s\n]+)/gi);
      const allAliases = aliasMatches
        ? aliasMatches.map((match) =>
            match.replace(/Alias name:\s*/i, "").trim()
          )
        : [];

      console.log(
        `Found ${allAliases.length} aliases in keystore:`,
        allAliases
      );

      // Check for various alias patterns
      // 1. Exact shortcode match
      const exactMatch = allAliases.find(
        (alias) => alias.toLowerCase() === expectedAlias
      );

      // 2. Brand name with "-key" suffix (e.g., "nursing-times-key")
      const brandNameKey = `${brand.name
        .toLowerCase()
        .replace(/\s+/g, "-")}-key`;
      const nameKeyMatch = allAliases.find(
        (alias) => alias.toLowerCase() === brandNameKey
      );

      // 3. Bundle ID based (e.g., "metropolis-net-nursingtimes")
      const bundleIdAlias = brand.bundleId?.replace(/\./g, "-").toLowerCase();
      const bundleIdMatch =
        bundleIdAlias &&
        allAliases.find((alias) => alias.toLowerCase() === bundleIdAlias);

      // 4. Shortcode with "-key" suffix (e.g., "nt-key")
      const shortcodeKey = `${expectedAlias}-key`;
      const shortcodeKeyMatch = allAliases.find(
        (alias) => alias.toLowerCase() === shortcodeKey
      );

      const foundAlias =
        exactMatch || nameKeyMatch || bundleIdMatch || shortcodeKeyMatch;
      const configured = !!foundAlias;

      if (!configured) {
        console.log(`No match found for ${shortcode}.`);
        console.log(
          `Tried patterns: "${expectedAlias}", "${brandNameKey}", "${bundleIdAlias}", "${shortcodeKey}"`
        );
      } else {
        console.log(`Match found: "${foundAlias}"`);
      }

      const result = {
        configured,
        details: configured
          ? `Keystore alias found: ${foundAlias}`
          : `No keystore alias found for ${expectedAlias}`,
        lastChecked: new Date().toISOString(),
        alias: foundAlias,
      };

      // Store result in brand config
      await updateBrand(shortcode, {
        ...brand,
        keystoreStatus: result,
      });

      return result;
    } catch (execError) {
      console.error(
        `Keytool command error for ${shortcode}:`,
        execError.message
      );

      const result = {
        configured: false,
        details: `Error checking keystore: ${execError.message}`,
        lastChecked: new Date().toISOString(),
        alias: null,
      };

      // Store error result in brand config
      await updateBrand(shortcode, {
        ...brand,
        keystoreStatus: result,
      });

      return result;
    }
  } catch (error) {
    console.error(`Error checking keystore for ${shortcode}:`, error);
    throw error;
  }
}

/**
 * Get stored keystore status from brand config
 * @param {string} shortcode - Brand shortcode
 * @returns {Promise<object|null>}
 */
async function getKeystoreStatus(shortcode) {
  try {
    const brand = await getBrand(shortcode);
    return brand?.keystoreStatus || null;
  } catch (error) {
    console.error(`Error getting keystore status for ${shortcode}:`, error);
    return null;
  }
}

module.exports = {
  checkKeystoreAlias,
  getKeystoreStatus,
};
