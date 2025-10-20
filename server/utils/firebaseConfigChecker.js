/**
 * Firebase Configuration Checker
 * Verifies Firebase configuration files for brands and validates bundle IDs
 */

const fs = require("fs").promises;
const path = require("path");
const plist = require("plist");
const { getBrand, getAllBrands } = require("./brandOperations");

/**
 * Verify iOS Firebase configuration (GoogleService-Info.plist)
 * @param {string} shortcode - Brand shortcode
 * @param {string} expectedBundleId - Expected bundle ID from config.json
 * @returns {Promise<object>} iOS configuration status
 */
async function verifyIOSConfig(shortcode, expectedBundleId) {
  const brandsDir = path.join(process.cwd(), "..", "brands");
  const plistPath = path.join(brandsDir, shortcode, "GoogleService-Info.plist");
  const relativePath = `brands/${shortcode}/GoogleService-Info.plist`;

  try {
    // Check if file exists
    await fs.access(plistPath);

    // Read and parse plist file
    const plistContent = await fs.readFile(plistPath, "utf8");
    const parsedPlist = plist.parse(plistContent);

    // Extract bundle ID
    const bundleIdFound = parsedPlist.BUNDLE_ID;

    if (!bundleIdFound) {
      return {
        configured: false,
        fileExists: true,
        filePath: relativePath,
        bundleIdMatch: false,
        bundleIdFound: null,
        error: "BUNDLE_ID key not found in plist file",
      };
    }

    // Check if bundle ID matches
    const bundleIdMatch = bundleIdFound === expectedBundleId;

    if (!bundleIdMatch) {
      return {
        configured: false,
        fileExists: true,
        filePath: relativePath,
        bundleIdMatch: false,
        bundleIdFound,
        error: `Bundle ID mismatch: expected '${expectedBundleId}', found '${bundleIdFound}'`,
      };
    }

    return {
      configured: true,
      fileExists: true,
      filePath: relativePath,
      bundleIdMatch: true,
      bundleIdFound,
      error: null,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        configured: false,
        fileExists: false,
        filePath: relativePath,
        bundleIdMatch: false,
        bundleIdFound: null,
        error: "GoogleService-Info.plist not found",
      };
    }

    return {
      configured: false,
      fileExists: true,
      filePath: relativePath,
      bundleIdMatch: false,
      bundleIdFound: null,
      error: `Error parsing plist: ${error.message}`,
    };
  }
}

/**
 * Verify Android Firebase configuration (google-services.json)
 * @param {string} shortcode - Brand shortcode
 * @param {string} expectedPackageName - Expected package name from config.json
 * @returns {Promise<object>} Android configuration status
 */
async function verifyAndroidConfig(shortcode, expectedPackageName) {
  const brandsDir = path.join(process.cwd(), "..", "brands");
  const jsonPath = path.join(brandsDir, shortcode, "google-services.json");
  const relativePath = `brands/${shortcode}/google-services.json`;

  try {
    // Check if file exists
    await fs.access(jsonPath);

    // Read and parse JSON file
    const jsonContent = await fs.readFile(jsonPath, "utf8");
    const parsedJson = JSON.parse(jsonContent);

    // Extract package name from first client
    const packageNameFound =
      parsedJson.client?.[0]?.client_info?.android_client_info?.package_name;

    if (!packageNameFound) {
      return {
        configured: false,
        fileExists: true,
        filePath: relativePath,
        packageNameMatch: false,
        packageNameFound: null,
        error: "package_name not found in google-services.json",
      };
    }

    // Check if package name matches
    const packageNameMatch = packageNameFound === expectedPackageName;

    if (!packageNameMatch) {
      return {
        configured: false,
        fileExists: true,
        filePath: relativePath,
        packageNameMatch: false,
        packageNameFound,
        error: `Package name mismatch: expected '${expectedPackageName}', found '${packageNameFound}'`,
      };
    }

    return {
      configured: true,
      fileExists: true,
      filePath: relativePath,
      packageNameMatch: true,
      packageNameFound,
      error: null,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        configured: false,
        fileExists: false,
        filePath: relativePath,
        packageNameMatch: false,
        packageNameFound: null,
        error: "google-services.json not found",
      };
    }

    return {
      configured: false,
      fileExists: true,
      filePath: relativePath,
      packageNameMatch: false,
      packageNameFound: null,
      error: `Error parsing JSON: ${error.message}`,
    };
  }
}

/**
 * Verify Firebase configuration for a specific brand
 * @param {string} shortcode - Brand shortcode
 * @returns {Promise<object>} Complete Firebase status for the brand
 */
async function verifyBrandFirebase(shortcode) {
  try {
    const brand = await getBrand(shortcode);

    if (!brand) {
      throw new Error(`Brand ${shortcode} not found`);
    }

    const bundleId = brand.bundleId || brand.ios?.bundleIdentifier;

    if (!bundleId) {
      return {
        success: false,
        error: "Bundle ID not configured in brand config",
        shortcode,
        bundleId: null,
      };
    }

    // Verify both iOS and Android configurations
    const [iosStatus, androidStatus] = await Promise.all([
      verifyIOSConfig(shortcode, bundleId),
      verifyAndroidConfig(shortcode, bundleId),
    ]);

    // Determine overall status
    let overallStatus = "not_configured";
    let message = "";

    if (iosStatus.configured && androidStatus.configured) {
      overallStatus = "configured";
      message = "Firebase configuration is valid for both platforms";
    } else if (!iosStatus.configured && !androidStatus.configured) {
      if (!iosStatus.fileExists && !androidStatus.fileExists) {
        overallStatus = "not_configured";
        message = "Firebase configuration files are missing for both platforms";
      } else {
        overallStatus = "misconfigured";
        message = "Firebase configuration has errors on both platforms";
      }
    } else if (iosStatus.configured || androidStatus.configured) {
      overallStatus = "partially_configured";
      const configuredPlatform = iosStatus.configured ? "iOS" : "Android";
      const missingPlatform = iosStatus.configured ? "Android" : "iOS";
      message = `Firebase configuration is valid for ${configuredPlatform} but missing or invalid for ${missingPlatform}`;
    } else {
      overallStatus = "misconfigured";
      message = "Firebase configuration has errors";
    }

    return {
      success: true,
      shortcode,
      bundleId,
      firebase: {
        ios: iosStatus,
        android: androidStatus,
        overallStatus,
        message,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      shortcode,
    };
  }
}

/**
 * Verify Firebase configuration for all brands
 * @returns {Promise<object>} Firebase status for all brands with summary
 */
async function verifyAllBrands() {
  try {
    const brands = await getAllBrands();

    // Verify each brand
    const brandStatuses = await Promise.all(
      brands.map((brand) => verifyBrandFirebase(brand.shortcode))
    );

    // Calculate summary
    const summary = {
      total: brandStatuses.length,
      configured: 0,
      partially_configured: 0,
      not_configured: 0,
      misconfigured: 0,
      error: 0,
    };

    brandStatuses.forEach((status) => {
      if (!status.success) {
        summary.error++;
      } else {
        const overallStatus = status.firebase?.overallStatus;
        if (overallStatus === "configured") {
          summary.configured++;
        } else if (overallStatus === "partially_configured") {
          summary.partially_configured++;
        } else if (overallStatus === "not_configured") {
          summary.not_configured++;
        } else if (overallStatus === "misconfigured") {
          summary.misconfigured++;
        }
      }
    });

    return {
      success: true,
      count: brandStatuses.length,
      brands: brandStatuses,
      summary,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  verifyBrandFirebase,
  verifyAllBrands,
  verifyIOSConfig,
  verifyAndroidConfig,
};
