#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Build verification script - prevents brand mix-ups
 * Run this before any production build to verify brand consistency
 */

const projectRoot = process.cwd();

function verifyBrandConsistency() {
  console.log("🔍 Verifying brand consistency...");
  
  const errors = [];
  const warnings = [];
  
  try {
    // Check brand validation file exists
    const brandValidationPath = path.join(projectRoot, "config", "brandValidation.ts");
    if (!fs.existsSync(brandValidationPath)) {
      errors.push("Brand validation file missing. Run prebuild script first.");
      return { success: false, errors, warnings };
    }
    
    // Read current app.json
    const appJsonPath = path.join(projectRoot, "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    
    // Read brand validation
    const brandValidationContent = fs.readFileSync(brandValidationPath, "utf8");
    const expectedBrandMatch = brandValidationContent.match(/EXPECTED_BRAND: '(\w+)'/);
    const expectedBundleMatch = brandValidationContent.match(/EXPECTED_BUNDLE_ID: '([^']+)'/);
    const expectedNameMatch = brandValidationContent.match(/EXPECTED_DISPLAY_NAME: '([^']+)'/);
    
    if (!expectedBrandMatch || !expectedBundleMatch || !expectedNameMatch) {
      errors.push("Invalid brand validation file format");
      return { success: false, errors, warnings };
    }
    
    const expectedBrand = expectedBrandMatch[1];
    const expectedBundleId = expectedBundleMatch[1];
    const expectedDisplayName = expectedNameMatch[1];
    
    // Verify app.json consistency
    if (appJson.expo.extra.brandConfig.brand !== expectedBrand) {
      errors.push(`Brand mismatch in app.json: expected '${expectedBrand}', got '${appJson.expo.extra.brandConfig.brand}'`);
    }
    
    if (appJson.expo.extra.brandConfig.bundleIdentifier !== expectedBundleId) {
      errors.push(`Bundle ID mismatch in app.json: expected '${expectedBundleId}', got '${appJson.expo.extra.brandConfig.bundleIdentifier}'`);
    }
    
    // Verify environment variable
    const envBrand = process.env.EXPO_PUBLIC_BRAND;
    if (envBrand && envBrand !== expectedBrand) {
      errors.push(`Environment brand mismatch: expected '${expectedBrand}', got '${envBrand}'`);
    }
    
    // Check Android build.gradle
    const buildGradlePath = path.join(projectRoot, "android", "app", "build.gradle");
    if (fs.existsSync(buildGradlePath)) {
      const buildGradleContent = fs.readFileSync(buildGradlePath, "utf8");
      const appIdMatch = buildGradleContent.match(/applicationId\s+['"]([^'"]+)['"]/);
      
      if (appIdMatch && appIdMatch[1] !== expectedBundleId) {
        errors.push(`Android applicationId mismatch: expected '${expectedBundleId}', got '${appIdMatch[1]}'`);
      }
    }
    
    // Check iOS Xcode project bundle identifier
    const xcodeProjectPath = path.join(projectRoot, "ios", "emap.xcodeproj", "project.pbxproj");
    if (fs.existsSync(xcodeProjectPath)) {
      const xcodeContent = fs.readFileSync(xcodeProjectPath, "utf8");
      const bundleIdMatches = xcodeContent.match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g);
      
      if (bundleIdMatches) {
        bundleIdMatches.forEach((match, index) => {
          const bundleIdMatch = match.match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/);
          if (bundleIdMatch && bundleIdMatch[1] !== expectedBundleId) {
            errors.push(`iOS bundle identifier mismatch (config ${index + 1}): expected '${expectedBundleId}', got '${bundleIdMatch[1]}'`);
          }
        });
      }
    }
    
    // Success
    if (errors.length === 0) {
      console.log(`✅ Brand verification passed for: ${expectedDisplayName} (${expectedBrand})`);
      console.log(`📱 Bundle ID: ${expectedBundleId}`);
      return { success: true, errors, warnings };
    }
    
  } catch (error) {
    errors.push(`Verification failed: ${error.message}`);
  }
  
  return { success: false, errors, warnings };
}

// Run verification
const result = verifyBrandConsistency();

if (!result.success) {
  console.error("❌ Brand verification FAILED:");
  result.errors.forEach(error => console.error(`   • ${error}`));
  process.exit(1);
}

if (result.warnings.length > 0) {
  console.warn("⚠️  Warnings:");
  result.warnings.forEach(warning => console.warn(`   • ${warning}`));
}

console.log("🎉 Build verification completed successfully!");
