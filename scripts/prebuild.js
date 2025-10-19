#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const AssetGenerator = require("./assetGenerator");

// Get project root directory
const projectRoot = process.cwd();

/**
 * Enhanced pre-build script for multi-brand builds
 * Uses generic package structure to avoid cache clearing between brand switches
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

// Dynamically discover valid brands from filesystem
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

// Get bundle identifier from brand config
const bundleId = brandConfig.bundleId;

if (!bundleId) {
  console.error(`❌ Bundle ID not found in brand configuration for: ${brand}`);
  process.exit(1);
}

console.log(`📱 Using bundle ID: ${bundleId}`);

// Use generic bundle identifier for iOS project structure (avoids pod rebuilds)
const genericIOSBundleId = "com.emap.app";

// Set generic iOS bundle identifier for project structure
appJson.expo.ios.bundleIdentifier = genericIOSBundleId;
appJson.expo.android.package = bundleId;

// Use generic package structure for Android source files
const genericPackageId = "com.emap.app";

// Store the actual brand-specific bundle ID for iOS build configuration
appJson.expo.extra.brandConfig.actualIOSBundleId = bundleId;

// Update assets paths to use brand-specific assets
const brandAssetsPath = `./brands/${brand}/assets`;
appJson.expo.icon = `${brandAssetsPath}/icon.png`;
appJson.expo.android.adaptiveIcon.foregroundImage = `${brandAssetsPath}/adaptive-icon.png`;
appJson.expo.web.favicon = `${brandAssetsPath}/favicon.png`;

// Set Android adaptive icon background color from brand config
if (brandConfig.branding?.iconBackgroundColor) {
  appJson.expo.android.adaptiveIcon.backgroundColor =
    brandConfig.branding.iconBackgroundColor;
  console.log(
    `✅ Set Android adaptive icon background color: ${brandConfig.branding.iconBackgroundColor}`
  );
}

// Update splash screen
if (appJson.expo.plugins) {
  appJson.expo.plugins.forEach((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "expo-splash-screen") {
      plugin[1].image = `${brandAssetsPath}/splash-icon.png`;
      // Set splash screen background color from brand config
      if (brandConfig.branding?.iconBackgroundColor) {
        plugin[1].backgroundColor = brandConfig.branding.iconBackgroundColor;
      }
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

// Generate brand assets from SVG
const generateBrandAssets = async () => {
  console.log(`🎨 Generating brand assets from SVG...`);

  try {
    const assetGenerator = new AssetGenerator(projectRoot);

    // Clean old assets first
    await assetGenerator.cleanOldAssets(brand);

    // Generate all assets from brand logo SVG
    const results = await assetGenerator.generateBrandAssets(
      brand,
      brandConfig
    );

    console.log(
      `✅ Generated ${assetGenerator.getTotalAssetCount(results)} assets from ${
        brandConfig.displayName
      } logo`
    );
    console.log(
      `📱 iOS: ${results.ios.appIcons.length} app icons + ${results.ios.splashLogos.length} splash logos`
    );
    console.log(
      `🤖 Android: 1 Play Store icon + ${results.android.mipmaps.length} mipmaps + ${results.android.drawables.length} drawables`
    );
    console.log(`🌐 Web/Expo: ${Object.keys(results.expo).length} assets`);

    return results;
  } catch (error) {
    console.error(`❌ Asset generation failed: ${error.message}`);
    console.error(`⚠️  Falling back to existing PNG assets`);
    // Don't exit - continue with existing assets
    return null;
  }
};

// Run asset generation (async)
generateBrandAssets()
  .then(() => {
    console.log(`🎉 Asset generation completed, continuing with prebuild...`);
  })
  .catch((error) => {
    console.error(`⚠️  Asset generation error: ${error.message}`);
  });

// Generate brand key file
const generateBrandKeyFile = () => {
  const brandKeyPath = path.join(projectRoot, "config", "brandKey.ts");
  const timestamp = new Date().toISOString();
  const brandKeyContent = `// This file is auto-generated by the prebuild script
// Do not edit manually - it will be overwritten
// Last updated: ${timestamp}

export const ACTIVE_BRAND = '${brand}';
`;

  fs.writeFileSync(brandKeyPath, brandKeyContent);
  console.log(`✅ Generated brand key file with brand: ${brand}`);

  // Touch the app entry point to ensure Metro detects the change
  try {
    const appEntryPath = path.join(projectRoot, "app", "_layout.tsx");
    if (fs.existsSync(appEntryPath)) {
      const now = new Date();
      fs.utimesSync(appEntryPath, now, now);
      console.log(`✅ Touched app entry point to trigger Metro reload`);
    }
  } catch (error) {
    // Ignore errors - this is just a hint to Metro
  }
};

generateBrandKeyFile();

// Add comprehensive brand validation safeguards
const addBrandSafeguards = () => {
  console.log(`🔒 Adding brand mix-up safeguards...`);

  // 1. Create brand validation file for runtime checks
  const brandValidationPath = path.join(
    projectRoot,
    "config",
    "brandValidation.ts"
  );
  const brandValidationContent = `// This file is auto-generated by the prebuild script
// DO NOT EDIT MANUALLY - Brand validation safeguards

export const BRAND_VALIDATION = {
  EXPECTED_BRAND: '${brand}',
  EXPECTED_BUNDLE_ID: '${bundleId}',
  EXPECTED_DISPLAY_NAME: '${brandConfig.displayName}',
  GENERATED_AT: '${new Date().toISOString()}',
  SAFEGUARD_VERSION: '1.0.0'
};

// Runtime brand validation function
export function validateBrandConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check environment brand matches expected
  const envBrand = process.env.EXPO_PUBLIC_BRAND;
  if (envBrand !== BRAND_VALIDATION.EXPECTED_BRAND) {
    errors.push(\`Environment brand mismatch: expected '\${BRAND_VALIDATION.EXPECTED_BRAND}', got '\${envBrand}'\`);
  }
  
  // Validate bundle identifier consistency
  const expectedBundlePattern = BRAND_VALIDATION.EXPECTED_BRAND === 'cn'
    ? /metropolis\\.co\\.uk\\.constructionnews/
    : /metropolis\\.net\\.nursingtimes/;
    
  if (!expectedBundlePattern.test(BRAND_VALIDATION.EXPECTED_BUNDLE_ID)) {
    errors.push(\`Bundle ID pattern mismatch for brand '\${BRAND_VALIDATION.EXPECTED_BRAND}'\`);
  }
  
  // Check for stale configuration (older than 24 hours)
  const generatedTime = new Date(BRAND_VALIDATION.GENERATED_AT);
  const now = new Date();
  const hoursDiff = (now.getTime() - generatedTime.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff > 24) {
    warnings.push(\`Brand configuration is \${Math.round(hoursDiff)} hours old. Consider regenerating.\`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Development mode brand indicator
export function getBrandIndicator(): string {
  const isDev = __DEV__ || process.env.NODE_ENV === 'development';
  if (!isDev) return '';
  
  const brandColors = {
    cn: '🟠', // Orange for Construction News
    nt: '🔵'  // Blue for Nursing Times
  };
  
  return \`\${brandColors[BRAND_VALIDATION.EXPECTED_BRAND] || '⚪'} \${BRAND_VALIDATION.EXPECTED_DISPLAY_NAME}\`;
}
`;

  fs.writeFileSync(brandValidationPath, brandValidationContent);
  console.log(
    `✅ Created brand validation safeguards for: ${brandConfig.displayName}`
  );

  // 2. Create build verification script
  const buildVerificationPath = path.join(
    projectRoot,
    "scripts",
    "verify-build.js"
  );
  const buildVerificationContent = `#!/usr/bin/env node

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
    const expectedBrandMatch = brandValidationContent.match(/EXPECTED_BRAND: '(\\w+)'/);
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
      errors.push(\`Brand mismatch in app.json: expected '\${expectedBrand}', got '\${appJson.expo.extra.brandConfig.brand}'\`);
    }
    
    if (appJson.expo.extra.brandConfig.bundleIdentifier !== expectedBundleId) {
      errors.push(\`Bundle ID mismatch in app.json: expected '\${expectedBundleId}', got '\${appJson.expo.extra.brandConfig.bundleIdentifier}'\`);
    }
    
    // Verify environment variable
    const envBrand = process.env.EXPO_PUBLIC_BRAND;
    if (envBrand && envBrand !== expectedBrand) {
      errors.push(\`Environment brand mismatch: expected '\${expectedBrand}', got '\${envBrand}'\`);
    }
    
    // Check Android build.gradle
    const buildGradlePath = path.join(projectRoot, "android", "app", "build.gradle");
    if (fs.existsSync(buildGradlePath)) {
      const buildGradleContent = fs.readFileSync(buildGradlePath, "utf8");
      const appIdMatch = buildGradleContent.match(/applicationId\\s+['"]([^'"]+)['"]/);
      
      if (appIdMatch && appIdMatch[1] !== expectedBundleId) {
        errors.push(\`Android applicationId mismatch: expected '\${expectedBundleId}', got '\${appIdMatch[1]}'\`);
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
            errors.push(\`iOS bundle identifier mismatch (config \${index + 1}): expected '\${expectedBundleId}', got '\${bundleIdMatch[1]}'\`);
          }
        });
      }
    }
    
    // Success
    if (errors.length === 0) {
      console.log(\`✅ Brand verification passed for: \${expectedDisplayName} (\${expectedBrand})\`);
      console.log(\`📱 Bundle ID: \${expectedBundleId}\`);
      return { success: true, errors, warnings };
    }
    
  } catch (error) {
    errors.push(\`Verification failed: \${error.message}\`);
  }
  
  return { success: false, errors, warnings };
}

// Run verification
const result = verifyBrandConsistency();

if (!result.success) {
  console.error("❌ Brand verification FAILED:");
  result.errors.forEach(error => console.error(\`   • \${error}\`));
  process.exit(1);
}

if (result.warnings.length > 0) {
  console.warn("⚠️  Warnings:");
  result.warnings.forEach(warning => console.warn(\`   • \${warning}\`));
}

console.log("🎉 Build verification completed successfully!");
`;

  fs.writeFileSync(buildVerificationPath, buildVerificationContent);
  fs.chmodSync(buildVerificationPath, "755"); // Make executable
  console.log(`✅ Created build verification script`);
};

addBrandSafeguards();

// Update Android keystore alias based on brand
const updateKeystoreAlias = () => {
  const gradlePropertiesPath = path.join(
    projectRoot,
    "android",
    "gradle.properties"
  );

  if (!fs.existsSync(gradlePropertiesPath)) {
    console.warn(`⚠️  gradle.properties not found: ${gradlePropertiesPath}`);
    return;
  }

  let gradleContent = fs.readFileSync(gradlePropertiesPath, "utf8");

  // Determine the correct key alias based on brand
  const keyAlias =
    brand === "cn" ? "construction-news-key" : "nursing-times-key";

  // Update the key alias in gradle.properties
  gradleContent = gradleContent.replace(
    /MYAPP_RELEASE_KEY_ALIAS=.*/,
    `MYAPP_RELEASE_KEY_ALIAS=${keyAlias}`
  );

  fs.writeFileSync(gradlePropertiesPath, gradleContent);
  console.log(`✅ Updated keystore alias to: ${keyAlias}`);
};

updateKeystoreAlias();

// Update Android build.gradle with correct package name
const updateAndroidBuildGradle = () => {
  const buildGradlePath = path.join(
    projectRoot,
    "android",
    "app",
    "build.gradle"
  );

  if (!fs.existsSync(buildGradlePath)) {
    console.warn(`⚠️  build.gradle not found: ${buildGradlePath}`);
    return;
  }

  let buildGradleContent = fs.readFileSync(buildGradlePath, "utf8");

  // Update namespace to use generic package (stays consistent)
  buildGradleContent = buildGradleContent.replace(
    /namespace\s+['"][^'"]*['"]/,
    `namespace '${genericPackageId}'`
  );

  // Update applicationId with the brand-specific bundle identifier
  buildGradleContent = buildGradleContent.replace(
    /applicationId\s+['"][^'"]*['"]/,
    `applicationId '${bundleId}'`
  );

  fs.writeFileSync(buildGradlePath, buildGradleContent);
  console.log(`✅ Updated Android build.gradle:`);
  console.log(`   - namespace: ${genericPackageId} (generic)`);
  console.log(`   - applicationId: ${bundleId} (brand-specific)`);
};

updateAndroidBuildGradle();

// Setup generic Android source structure (one-time migration)
const setupGenericAndroidStructure = () => {
  const androidSrcPath = path.join(
    projectRoot,
    "android",
    "app",
    "src",
    "main",
    "java"
  );

  const genericPackagePath = path.join(androidSrcPath, "com", "emap", "app");

  // Check if generic structure already exists
  if (fs.existsSync(genericPackagePath)) {
    console.log(
      `✅ Generic package structure already exists: ${genericPackageId}`
    );
    return;
  }

  // Find existing brand-specific package directories
  const possibleOldPaths = [
    {
      path: path.join(androidSrcPath, "metropolis", "net", "nursingtimes"),
      packageId: "metropolis.net.nursingtimes",
    },
    {
      path: path.join(
        androidSrcPath,
        "metropolis",
        "co",
        "uk",
        "constructionnews"
      ),
      packageId: "metropolis.co.uk.constructionnews",
    },
  ];

  let sourcePackageInfo = null;
  for (const possibleOld of possibleOldPaths) {
    if (fs.existsSync(possibleOld.path)) {
      sourcePackageInfo = possibleOld;
      break;
    }
  }

  if (!sourcePackageInfo) {
    console.log(
      `ℹ️  No existing package structure found, creating generic structure`
    );
    fs.mkdirSync(genericPackagePath, { recursive: true });
    return;
  }

  // Create generic package directory
  fs.mkdirSync(genericPackagePath, { recursive: true });

  // Move Kotlin files to generic package directory
  const kotlinFiles = ["MainActivity.kt", "MainApplication.kt"];
  kotlinFiles.forEach((file) => {
    const oldFilePath = path.join(sourcePackageInfo.path, file);
    const newFilePath = path.join(genericPackagePath, file);

    if (fs.existsSync(oldFilePath)) {
      // Read file content and update package declaration to generic
      let fileContent = fs.readFileSync(oldFilePath, "utf8");

      // Replace old package declaration with generic one
      const oldPackageRegex = new RegExp(
        `package\\s+${sourcePackageInfo.packageId.replace(/\./g, "\\.")}`
      );
      fileContent = fileContent.replace(
        oldPackageRegex,
        `package ${genericPackageId}`
      );

      // Write to new generic location
      fs.writeFileSync(newFilePath, fileContent);
      console.log(
        `✅ Migrated ${file} from ${sourcePackageInfo.packageId} to ${genericPackageId}`
      );

      // Remove old file
      fs.unlinkSync(oldFilePath);
    }
  });

  // Clean up old directory structure
  try {
    fs.rmdirSync(sourcePackageInfo.path);

    // Clean up parent directories if empty
    const pathParts = sourcePackageInfo.path
      .replace(androidSrcPath + path.sep, "")
      .split(path.sep);
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = path.join(androidSrcPath, ...pathParts.slice(0, i));
      try {
        fs.rmdirSync(parentPath);
      } catch (error) {
        break; // Directory not empty
      }
    }

    console.log(`✅ Cleaned up old brand-specific package structure`);
  } catch (error) {
    // Directory not empty or doesn't exist, ignore
  }
};

setupGenericAndroidStructure();

// Setup generic iOS structure (when iOS project exists)
const setupGenericIOSStructure = () => {
  const iosProjectPath = path.join(projectRoot, "ios");

  if (!fs.existsSync(iosProjectPath)) {
    console.log(
      `ℹ️  iOS project not found - will use generic structure when generated`
    );
    return;
  }

  // Look for existing Xcode project files
  const projectFiles = fs
    .readdirSync(iosProjectPath)
    .filter((file) => file.endsWith(".xcodeproj"));

  if (projectFiles.length === 0) {
    console.log(`ℹ️  No Xcode project found in iOS directory`);
    return;
  }

  // Check if we need to rename the project to generic name
  const currentProjectName = projectFiles[0].replace(".xcodeproj", "");
  const genericProjectName = "emap";

  if (currentProjectName === genericProjectName) {
    console.log(
      `✅ iOS project already uses generic name: ${genericProjectName}`
    );
    return;
  }

  console.log(`🔄 Converting iOS project to generic structure...`);
  console.log(`   From: ${currentProjectName} → To: ${genericProjectName}`);

  // This would require renaming Xcode project files and updating references
  // For now, we'll log the recommendation
  console.log(`ℹ️  To complete iOS generic setup:`);
  console.log(
    `   1. Rename ${currentProjectName}.xcodeproj to ${genericProjectName}.xcodeproj`
  );
  console.log(
    `   2. Update bundle identifier in Xcode to: ${genericIOSBundleId}`
  );
  console.log(
    `   3. Use EAS build configuration to set final bundle ID at build time`
  );
};

setupGenericIOSStructure();

// Update iOS Xcode project bundle identifier
const updateIOSBundleIdentifier = () => {
  const xcodeProjectPath = path.join(
    projectRoot,
    "ios",
    "emap.xcodeproj",
    "project.pbxproj"
  );

  if (!fs.existsSync(xcodeProjectPath)) {
    console.log(`ℹ️  Xcode project not found, skipping iOS bundle ID update`);
    return;
  }

  try {
    let projectContent = fs.readFileSync(xcodeProjectPath, "utf8");

    // Update PRODUCT_BUNDLE_IDENTIFIER for both Debug and Release configurations
    const updatedContent = projectContent.replace(
      /PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g,
      `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`
    );

    if (projectContent !== updatedContent) {
      fs.writeFileSync(xcodeProjectPath, updatedContent);
      console.log(
        `✅ Updated iOS Xcode project bundle identifier to: ${bundleId}`
      );
    } else {
      console.log(`ℹ️  iOS bundle identifier already correct: ${bundleId}`);
    }
  } catch (error) {
    console.error(
      `❌ Failed to update iOS bundle identifier: ${error.message}`
    );
  }
};

updateIOSBundleIdentifier();

// Update iOS display name in Info.plist
const updateIOSDisplayName = () => {
  const infoPlistPath = path.join(projectRoot, "ios", "emap", "Info.plist");

  if (!fs.existsSync(infoPlistPath)) {
    console.log(`ℹ️  iOS Info.plist not found, skipping display name update`);
    return;
  }

  try {
    let plistContent = fs.readFileSync(infoPlistPath, "utf8");

    // Update CFBundleDisplayName
    const displayNameRegex =
      /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/;
    const updatedContent = plistContent.replace(
      displayNameRegex,
      `$1${brandConfig.displayName}$2`
    );

    if (plistContent !== updatedContent) {
      fs.writeFileSync(infoPlistPath, updatedContent);
      console.log(`✅ Updated iOS display name to: ${brandConfig.displayName}`);
    } else {
      console.log(
        `ℹ️  iOS display name already correct: ${brandConfig.displayName}`
      );
    }
  } catch (error) {
    console.error(`❌ Failed to update iOS display name: ${error.message}`);
  }
};

updateIOSDisplayName();

// Update Android display name in strings.xml
const updateAndroidDisplayName = () => {
  const stringsXmlPath = path.join(
    projectRoot,
    "android",
    "app",
    "src",
    "main",
    "res",
    "values",
    "strings.xml"
  );

  if (!fs.existsSync(stringsXmlPath)) {
    console.log(
      `ℹ️  Android strings.xml not found, skipping display name update`
    );
    return;
  }

  try {
    let stringsContent = fs.readFileSync(stringsXmlPath, "utf8");

    // Update app_name
    const appNameRegex = /(<string name="app_name">)[^<]*(<\/string>)/;
    const updatedContent = stringsContent.replace(
      appNameRegex,
      `$1${brandConfig.displayName}$2`
    );

    if (stringsContent !== updatedContent) {
      fs.writeFileSync(stringsXmlPath, updatedContent);
      console.log(`✅ Updated Android app name to: ${brandConfig.displayName}`);
    } else {
      console.log(
        `ℹ️  Android app name already correct: ${brandConfig.displayName}`
      );
    }
  } catch (error) {
    console.error(`❌ Failed to update Android app name: ${error.message}`);
  }
};

updateAndroidDisplayName();

// Update iOS splash screen background color
const updateIOSSplashBackgroundColor = () => {
  const splashBackgroundColorPath = path.join(
    projectRoot,
    "ios",
    "emap",
    "Images.xcassets",
    "SplashScreenBackground.colorset",
    "Contents.json"
  );

  if (!fs.existsSync(splashBackgroundColorPath)) {
    console.warn(
      `⚠️  iOS splash background colorset not found: ${splashBackgroundColorPath}`
    );
    return;
  }

  // Get brand background color or default to white
  const backgroundColorHex =
    brandConfig.branding?.iconBackgroundColor || "#ffffff";

  // Convert hex to RGB components (0-1 range for iOS)
  const hexToRgbNormalized = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { red: 1, green: 1, blue: 1 }; // Default to white

    return {
      red: (parseInt(result[1], 16) / 255).toFixed(8),
      green: (parseInt(result[2], 16) / 255).toFixed(8),
      blue: (parseInt(result[3], 16) / 255).toFixed(8),
    };
  };

  const rgbComponents = hexToRgbNormalized(backgroundColorHex);

  const splashBackgroundColorContent = {
    colors: [
      {
        color: {
          components: {
            alpha: "1.000",
            blue: rgbComponents.blue,
            green: rgbComponents.green,
            red: rgbComponents.red,
          },
          "color-space": "srgb",
        },
        idiom: "universal",
      },
    ],
    info: {
      version: 1,
      author: "expo",
    },
  };

  fs.writeFileSync(
    splashBackgroundColorPath,
    JSON.stringify(splashBackgroundColorContent, null, 2)
  );
  console.log(
    `✅ Updated iOS splash screen background color to: ${backgroundColorHex}`
  );
};

updateIOSSplashBackgroundColor();

console.log(
  `\n🎉 Pre-build process completed successfully for ${brandConfig.displayName}`
);
console.log(`📱 Android Bundle ID: ${bundleId}`);
console.log(
  `📱 iOS Bundle ID: ${genericIOSBundleId} → ${bundleId} (at build time)`
);
console.log(`🎨 Brand: ${brand}`);
console.log(`📁 Generic Android Package: ${genericPackageId}`);
console.log(`📁 Generic iOS Bundle: ${genericIOSBundleId}`);
console.log(`\n💡 Benefits of generic structure:`);
console.log(`   • No cache clearing needed when switching brands`);
console.log(`   • No pod rebuilds required for iOS`);
console.log(`   • Faster brand switching`);
console.log(`   • Consistent build artifacts`);
console.log(`\n🚀 Next steps:`);
console.log(`   1. Configure: node scripts/prebuild.js ${brand}`);
console.log(`   2. Android: cd android && ./gradlew bundleRelease`);

console.log(`   3. iOS: Use EAS build or Xcode with generic project`);
