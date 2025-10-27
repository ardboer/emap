#!/usr/bin/env node

/**
 * Deep Linking Implementation Test Script
 *
 * This script verifies that the deep linking setup is correctly configured
 * for the EMAP multi-brand mobile app.
 *
 * Usage:
 *   node scripts/test-deep-linking.js
 *
 * What it tests:
 *   1. URL parsing logic for various URL formats
 *   2. app.json configuration (scheme, iOS, Android settings)
 *   3. Brand-specific domain mappings
 *
 * Note: API endpoint testing requires the app to be running and network access.
 */

const fs = require("fs");
const path = require("path");

/* eslint-disable no-undef */
// __dirname is available in Node.js CommonJS scripts

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

/**
 * Brand configuration for testing
 */
const BRAND_CONFIG = {
  cn: {
    name: "Construction News",
    domain: "www.constructionnews.co.uk",
    scheme: "cn",
    bundleId: "metropolis.co.uk.constructionnews",
    packageName: "metropolis.co.uk.constructionnews",
    testSlug: "some-construction-article-slug",
  },
  jnl: {
    name: "Jobs Nursing & Learning",
    domain: "jnl.nursingtimes.net",
    scheme: "jnl",
    bundleId: "metropolis.net.jnl",
    packageName: "metropolis.net.jnl",
    testSlug: "some-jnl-article-slug",
  },
  nt: {
    name: "Nursing Times",
    domain: "www.nursingtimes.net",
    scheme: "nt",
    bundleId: "metropolis.net.nursingtimes",
    packageName: "metropolis.net.nursingtimes",
    testSlug: "community-nursing/some-nursing-article-slug",
  },
};

/**
 * Log a test result
 */
function logTest(name, passed, message = "", isWarning = false) {
  const icon = passed ? "✓" : isWarning ? "⚠" : "✗";
  const color = passed ? colors.green : isWarning ? colors.yellow : colors.red;

  console.log(`  ${color}${icon}${colors.reset} ${name}`);
  if (message) {
    console.log(`    ${colors.cyan}${message}${colors.reset}`);
  }

  results.tests.push({ name, passed, message, isWarning });

  if (passed) {
    results.passed++;
  } else if (isWarning) {
    results.warnings++;
  } else {
    results.failed++;
  }
}

/**
 * Extract slug from various URL formats
 */
function extractSlugFromUrl(url) {
  try {
    // Handle custom scheme URLs (e.g., nt://category/article-slug/)
    if (url.includes("://") && !url.startsWith("http")) {
      const parts = url.split("://");
      if (parts.length === 2) {
        // Remove trailing slash and return path
        return parts[1].replace(/\/$/, "");
      }
    }

    // Handle HTTP/HTTPS URLs
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;

    // Remove leading and trailing slashes
    pathname = pathname.replace(/^\//, "").replace(/\/$/, "");

    return pathname;
  } catch (error) {
    console.error(`Error parsing URL: ${url}`, error.message);
    return null;
  }
}

/**
 * Test URL parsing logic
 */
function testUrlParsing() {
  console.log(
    `\n${colors.bright}${colors.blue}🔍 Testing URL Parsing...${colors.reset}\n`
  );

  const testCases = [
    {
      name: "Full URL with trailing slash",
      url: "https://www.nursingtimes.net/community-nursing/article-title-24-10-2025/",
      expected: "community-nursing/article-title-24-10-2025",
    },
    {
      name: "Full URL without trailing slash",
      url: "https://www.nursingtimes.net/community-nursing/article-title-24-10-2025",
      expected: "community-nursing/article-title-24-10-2025",
    },
    {
      name: "Custom scheme with trailing slash",
      url: "nt://community-nursing/article-title-24-10-2025/",
      expected: "community-nursing/article-title-24-10-2025",
    },
    {
      name: "Custom scheme without trailing slash",
      url: "nt://community-nursing/article-title-24-10-2025",
      expected: "community-nursing/article-title-24-10-2025",
    },
    {
      name: "URL with query parameters",
      url: "https://www.constructionnews.co.uk/article-slug?param=value&other=test",
      expected: "article-slug",
    },
    {
      name: "Simple article slug",
      url: "https://jnl.nursingtimes.net/job-listing-title",
      expected: "job-listing-title",
    },
    {
      name: "Nested category path",
      url: "https://www.nursingtimes.net/clinical-archive/infection-control/article-name/",
      expected: "clinical-archive/infection-control/article-name",
    },
  ];

  testCases.forEach(({ name, url, expected }) => {
    const result = extractSlugFromUrl(url);
    const passed = result === expected;
    const message = passed
      ? `Extracted: "${result}"`
      : `Expected: "${expected}", Got: "${result}"`;

    logTest(name, passed, message);
  });
}

/**
 * Test app.json configuration
 */
function testAppJsonConfig() {
  console.log(
    `\n${colors.bright}${colors.blue}🔍 Testing app.json Configuration...${colors.reset}\n`
  );

  const appJsonPath = path.join(__dirname, "..", "app.json");

  // Check if app.json exists
  if (!fs.existsSync(appJsonPath)) {
    logTest("app.json exists", false, "File not found");
    return;
  }

  logTest("app.json exists", true);

  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    const expo = appJson.expo;

    if (!expo) {
      logTest("app.json structure", false, 'Missing "expo" key');
      return;
    }

    logTest("app.json structure", true);

    // Get current brand from extra.brandConfig
    const currentBrand = expo.extra?.brandConfig?.brand || "unknown";
    const brandConfig = BRAND_CONFIG[currentBrand];

    if (!brandConfig) {
      logTest(
        "Current brand configuration",
        false,
        `Unknown brand: ${currentBrand}`
      );
      return;
    }

    logTest(
      "Current brand configuration",
      true,
      `Testing for brand: ${brandConfig.name} (${currentBrand})`
    );

    // Test scheme
    const hasScheme = expo.scheme !== undefined;
    const schemeMatches =
      expo.scheme === brandConfig.scheme || expo.scheme === "emap";

    if (hasScheme) {
      logTest(
        "App scheme configured",
        schemeMatches,
        schemeMatches
          ? `Scheme: "${expo.scheme}"`
          : `Expected: "${brandConfig.scheme}", Got: "${expo.scheme}"`,
        !schemeMatches // Warning if doesn't match but exists
      );
    } else {
      logTest("App scheme configured", false, "No scheme found in app.json");
    }

    // Test iOS configuration
    if (expo.ios) {
      logTest("iOS configuration exists", true);

      const iosBundleId = expo.ios.bundleIdentifier;
      const bundleIdMatches = iosBundleId === brandConfig.bundleId;

      logTest(
        "iOS bundle identifier",
        bundleIdMatches,
        bundleIdMatches
          ? `Bundle ID: ${iosBundleId}`
          : `Expected: ${brandConfig.bundleId}, Got: ${iosBundleId}`
      );

      // Check for associatedDomains (Universal Links)
      const hasAssociatedDomains = expo.ios.associatedDomains !== undefined;

      if (hasAssociatedDomains) {
        const domains = expo.ios.associatedDomains;
        const expectedDomain = `applinks:${brandConfig.domain}`;
        const hasDomain = domains.includes(expectedDomain);

        logTest(
          "iOS Universal Links (associatedDomains)",
          hasDomain,
          hasDomain
            ? `Configured: ${expectedDomain}`
            : `Missing: ${expectedDomain}. Found: ${domains.join(", ")}`,
          !hasDomain
        );
      } else {
        logTest(
          "iOS Universal Links (associatedDomains)",
          false,
          "Not configured. Add associatedDomains to ios config",
          true
        );
      }
    } else {
      logTest("iOS configuration exists", false, "Missing ios configuration");
    }

    // Test Android configuration
    if (expo.android) {
      logTest("Android configuration exists", true);

      const androidPackage = expo.android.package;
      const packageMatches = androidPackage === brandConfig.packageName;

      logTest(
        "Android package name",
        packageMatches,
        packageMatches
          ? `Package: ${androidPackage}`
          : `Expected: ${brandConfig.packageName}, Got: ${androidPackage}`
      );

      // Check for intentFilters (App Links)
      const hasIntentFilters = expo.android.intentFilters !== undefined;

      if (hasIntentFilters) {
        const filters = expo.android.intentFilters;
        const hasHttpsFilter = filters.some((filter) =>
          filter.data?.some(
            (data) =>
              data.scheme === "https" && data.host === brandConfig.domain
          )
        );

        logTest(
          "Android App Links (intentFilters)",
          hasHttpsFilter,
          hasHttpsFilter
            ? `Configured for: https://${brandConfig.domain}`
            : `Missing HTTPS intent filter for ${brandConfig.domain}`,
          !hasHttpsFilter
        );
      } else {
        logTest(
          "Android App Links (intentFilters)",
          false,
          "Not configured. Add intentFilters to android config",
          true
        );
      }
    } else {
      logTest(
        "Android configuration exists",
        false,
        "Missing android configuration"
      );
    }
  } catch (error) {
    logTest("Parse app.json", false, error.message);
  }
}

/**
 * Test brand domain mappings
 */
function testBrandDomainMappings() {
  console.log(
    `\n${colors.bright}${colors.blue}🔍 Testing Brand Domain Mappings...${colors.reset}\n`
  );

  Object.entries(BRAND_CONFIG).forEach(([shortcode, config]) => {
    const testUrl = `https://${config.domain}/${config.testSlug}`;
    const slug = extractSlugFromUrl(testUrl);

    logTest(
      `${config.name} (${shortcode})`,
      slug === config.testSlug,
      `Domain: ${config.domain}, Slug: ${slug}`
    );
  });
}

/**
 * Provide recommendations based on test results
 */
function provideRecommendations() {
  console.log(
    `\n${colors.bright}${colors.blue}📋 Recommendations${colors.reset}\n`
  );

  const failedTests = results.tests.filter((t) => !t.passed && !t.isWarning);
  const warnings = results.tests.filter((t) => t.isWarning);

  if (failedTests.length === 0 && warnings.length === 0) {
    console.log(
      `  ${colors.green}✓ All tests passed! Deep linking is properly configured.${colors.reset}`
    );
    return;
  }

  if (failedTests.length > 0) {
    console.log(`  ${colors.red}Critical Issues:${colors.reset}`);
    failedTests.forEach((test) => {
      console.log(`    • ${test.name}: ${test.message}`);
    });
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`  ${colors.yellow}Warnings:${colors.reset}`);
    warnings.forEach((test) => {
      console.log(`    • ${test.name}: ${test.message}`);
    });
    console.log();
  }

  console.log(`  ${colors.cyan}Next Steps:${colors.reset}`);
  console.log(
    `    1. Review the deep linking setup guide: docs/deep-linking-setup-guide.md`
  );
  console.log(
    `    2. Update app.json with correct iOS associatedDomains and Android intentFilters`
  );
  console.log(`    3. Run the prebuild script: npm run prebuild`);
  console.log(`    4. Test on physical devices after deploying`);
}

/**
 * Display test summary
 */
function displaySummary() {
  console.log(`\n${colors.bright}${"=".repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.bright}${"=".repeat(50)}${colors.reset}\n`);

  const total = results.passed + results.failed + results.warnings;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  console.log(`  Total Tests: ${total}`);
  console.log(`  ${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log(`  Pass Rate: ${passRate}%\n`);

  if (results.failed === 0 && results.warnings === 0) {
    console.log(
      `  ${colors.green}${colors.bright}🎉 All tests passed!${colors.reset}\n`
    );
  } else if (results.failed === 0) {
    console.log(
      `  ${colors.yellow}${colors.bright}⚠️  Tests passed with warnings${colors.reset}\n`
    );
  } else {
    console.log(
      `  ${colors.red}${colors.bright}❌ Some tests failed${colors.reset}\n`
    );
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bright}${"=".repeat(50)}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.cyan}Deep Linking Implementation Tests${colors.reset}`
  );
  console.log(`${colors.bright}${"=".repeat(50)}${colors.reset}`);

  // Run all test suites
  testUrlParsing();
  testAppJsonConfig();
  testBrandDomainMappings();

  // Display results
  displaySummary();
  provideRecommendations();

  console.log(`${colors.bright}${"=".repeat(50)}${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error(
    `${colors.red}${colors.bright}Fatal Error:${colors.reset}`,
    error
  );
  process.exit(1);
});
