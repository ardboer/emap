/**
 * Push Credentials Checker
 * Verifies EAS push notification credentials for brands
 */

const { getBrand, updateBrand } = require("./brandOperations");

/**
 * Check if push credentials are configured for a brand
 * Since EAS credentials command is interactive, this function
 * allows manual verification and storage of the status
 *
 * @param {string} shortcode - Brand shortcode
 * @param {boolean} isConfigured - Manual verification result
 * @returns {Promise<{configured: boolean, details: string, lastChecked: string}>}
 */
async function checkPushCredentials(shortcode, isConfigured = null) {
  try {
    const brand = await getBrand(shortcode);

    if (!brand) {
      throw new Error(`Brand ${shortcode} not found`);
    }

    const bundleId = brand.bundleId || brand.ios?.bundleIdentifier;

    if (!bundleId) {
      return {
        configured: false,
        details: "Bundle ID not configured",
        lastChecked: new Date().toISOString(),
      };
    }

    console.log(
      `Updating push credentials status for ${shortcode} (${bundleId})...`
    );

    // If isConfigured is explicitly provided, use it
    // Otherwise, return current status or prompt for manual check
    let configured = isConfigured;
    let details = "";

    if (configured === null) {
      // Return instruction to check manually
      return {
        configured: false,
        details: `Please verify manually using: npx eas credentials -p ios\nThen update the status in the web interface`,
        lastChecked: new Date().toISOString(),
        requiresManualCheck: true,
      };
    }

    details = configured
      ? "Push credentials configured (manually verified)"
      : "Push credentials not configured (manually verified)";

    const result = {
      configured,
      details,
      lastChecked: new Date().toISOString(),
    };

    // Store result in brand config
    await updateBrand(shortcode, {
      ...brand,
      pushCredentials: result,
    });

    return result;
  } catch (error) {
    console.error(`Error updating push credentials for ${shortcode}:`, error);
    throw error;
  }
}

/**
 * Get stored push credentials status from brand config
 * @param {string} shortcode - Brand shortcode
 * @returns {Promise<object|null>}
 */
async function getPushCredentialsStatus(shortcode) {
  try {
    const brand = await getBrand(shortcode);
    return brand?.pushCredentials || null;
  } catch (error) {
    console.error(
      `Error getting push credentials status for ${shortcode}:`,
      error
    );
    return null;
  }
}

module.exports = {
  checkPushCredentials,
  getPushCredentialsStatus,
};
