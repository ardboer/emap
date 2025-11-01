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
// IMPORTANT: Keep name as "emap" to maintain generic iOS/Android project structure
// This prevents eas prebuild from creating brand-specific folders like "NursingTimes/"
// The actual brand display name is stored in extra.brandConfig for runtime use
appJson.expo.name = "emap";
// Keep slug as "emap" for EAS project consistency
appJson.expo.slug = "emap";

// Configure deep linking for the brand
console.log(`🔗 Configuring deep linking for ${brand}...`);

// Set brand-specific URL scheme
appJson.expo.scheme = brand;
console.log(`✅ Set URL scheme: ${brand}`);

// Extract domain from brand config
const extractDomain = (brandConfig) => {
  // Prefer apiConfig.baseUrl as it includes the full domain (e.g., www.nursingtimes.net)
  // Fall back to domain field if baseUrl is not available
  let domain = brandConfig.apiConfig?.baseUrl || brandConfig.domain || "";

  // Remove protocol (https://, http://)
  domain = domain.replace(/^https?:\/\//, "");

  // Remove trailing slashes and paths
  domain = domain.replace(/\/+.*$/, "");

  return domain;
};

const domain = extractDomain(brandConfig);
console.log(`✅ Extracted domain: ${domain}`);

// Generate domain variants (with and without www)
const domainVariants = [];
if (domain.startsWith("www.")) {
  domainVariants.push(domain); // www version
  domainVariants.push(domain.replace("www.", "")); // non-www version
} else {
  domainVariants.push(domain); // non-www version
  domainVariants.push(`www.${domain}`); // www version
}

console.log(`✅ Domain variants: ${domainVariants.join(", ")}`);

// Configure iOS associated domains for Universal Links
if (!appJson.expo.ios) {
  appJson.expo.ios = {};
}
appJson.expo.ios.associatedDomains = domainVariants.map((d) => `applinks:${d}`);
console.log(
  `✅ Configured iOS associated domains: ${appJson.expo.ios.associatedDomains.join(
    ", "
  )}`
);

// Configure Android intent filters for App Links
if (!appJson.expo.android) {
  appJson.expo.android = {};
}
if (!appJson.expo.android.intentFilters) {
  appJson.expo.android.intentFilters = [];
}

// Add intent filters for auth callback (must come first for priority)
domainVariants.forEach((domainVariant) => {
  const authCallbackFilter = {
    action: "VIEW",
    autoVerify: true,
    data: [
      {
        scheme: "https",
        host: domainVariant,
        pathPrefix: "/auth/callback",
      },
    ],
    category: ["BROWSABLE", "DEFAULT"],
  };

  appJson.expo.android.intentFilters.push(authCallbackFilter);
});

// Add intent filters for article and event paths for each domain variant
domainVariants.forEach((domainVariant) => {
  const intentFilter = {
    action: "VIEW",
    autoVerify: true,
    data: [
      {
        scheme: "https",
        host: domainVariant,
        pathPrefix: "/article",
      },
      {
        scheme: "https",
        host: domainVariant,
        pathPrefix: "/event",
      },
      {
        scheme: "https",
        host: domainVariant,
        pathPrefix: "/",
      },
    ],
    category: ["BROWSABLE", "DEFAULT"],
  };

  appJson.expo.android.intentFilters.push(intentFilter);
});

console.log(
  `✅ Configured Android App Links for ${domainVariants.length} domain variants`
);
console.log(`   Domains: ${domainVariants.join(", ")}`);
console.log(`   Paths: /auth/callback, /article/*, /event/*, /*`);

// Get bundle identifier from brand config
const bundleId = brandConfig.bundleId;

if (!bundleId) {
  console.error(`❌ Bundle ID not found in brand configuration for: ${brand}`);
  process.exit(1);
}

console.log(`📱 Using bundle ID: ${bundleId}`);

// Set brand-specific bundle identifiers for both platforms
appJson.expo.ios.bundleIdentifier = bundleId;
appJson.expo.android.package = bundleId;

// Store the bundle ID in brandConfig for reference
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
// Copy Firebase configuration files if they exist
const copyFirebaseConfig = () => {
  console.log(`🔥 Checking for Firebase configuration files...`);

  const brandDir = path.join(projectRoot, "brands", brand);
  const androidAppDir = path.join(projectRoot, "android", "app");
  const iosAppDir = path.join(projectRoot, "ios", "emap");

  // Copy google-services.json for Android
  const googleServicesSource = path.join(brandDir, "google-services.json");
  const googleServicesDest = path.join(androidAppDir, "google-services.json");

  if (fs.existsSync(googleServicesSource)) {
    // Ensure android/app directory exists
    if (!fs.existsSync(androidAppDir)) {
      fs.mkdirSync(androidAppDir, { recursive: true });
    }
    fs.copyFileSync(googleServicesSource, googleServicesDest);
    console.log(`✅ Copied google-services.json for Android`);
  } else {
    console.log(`ℹ️  No google-services.json found for ${brand}`);
  }

  // Copy GoogleService-Info.plist for iOS
  const googleServiceInfoSource = path.join(
    brandDir,
    "GoogleService-Info.plist"
  );
  const googleServiceInfoDest = path.join(
    iosAppDir,
    "GoogleService-Info.plist"
  );

  if (fs.existsSync(googleServiceInfoSource)) {
    // Ensure ios/emap directory exists
    if (!fs.existsSync(iosAppDir)) {
      fs.mkdirSync(iosAppDir, { recursive: true });
    }
    fs.copyFileSync(googleServiceInfoSource, googleServiceInfoDest);
    console.log(`✅ Copied GoogleService-Info.plist for iOS`);

    // Add to Xcode project if not already present
    addGoogleServiceInfoToXcode();
  } else {
    console.log(`ℹ️  No GoogleService-Info.plist found for ${brand}`);
  }
};

// Add GoogleService-Info.plist to Xcode project
const addGoogleServiceInfoToXcode = () => {
  const xcodeProjectPath = path.join(
    projectRoot,
    "ios",
    "emap.xcodeproj",
    "project.pbxproj"
  );

  if (!fs.existsSync(xcodeProjectPath)) {
    console.log(
      `ℹ️  Xcode project not found, skipping GoogleService-Info.plist addition`
    );
    return;
  }

  try {
    let projectContent = fs.readFileSync(xcodeProjectPath, "utf8");

    // Check if GoogleService-Info.plist is already referenced
    if (projectContent.includes("GoogleService-Info.plist")) {
      console.log(`ℹ️  GoogleService-Info.plist already in Xcode project`);
      return;
    }

    console.log(`🔧 Adding GoogleService-Info.plist to Xcode project...`);

    // Generate unique IDs for the file reference and build file
    const fileRefId =
      "FIREBASE" + Math.random().toString(36).substr(2, 20).toUpperCase();
    const buildFileId =
      "FIREBASE" + Math.random().toString(36).substr(2, 20).toUpperCase();

    // Add file reference in PBXFileReference section
    const fileReferenceEntry = `\t\t${fileRefId} /* GoogleService-Info.plist */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text.plist.xml; name = "GoogleService-Info.plist"; path = "emap/GoogleService-Info.plist"; sourceTree = "<group>"; };`;

    projectContent = projectContent.replace(
      /\/\* End PBXFileReference section \*\//,
      `${fileReferenceEntry}\n/* End PBXFileReference section */`
    );

    // Add build file in PBXBuildFile section
    const buildFileEntry = `\t\t${buildFileId} /* GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile; fileRef = ${fileRefId} /* GoogleService-Info.plist */; };`;

    projectContent = projectContent.replace(
      /\/\* End PBXBuildFile section \*\//,
      `${buildFileEntry}\n/* End PBXBuildFile section */`
    );

    // Add to emap group (where other files like Info.plist are)
    const groupEntry = `\t\t\t\t${fileRefId} /* GoogleService-Info.plist */,`;

    // Find the emap group and add the file reference
    projectContent = projectContent.replace(
      /(13B07FAE1A68108700A75B9A \/\* emap \*\/ = \{[^}]+children = \([^)]+)(13B07FB61A68108700A75B9A \/\* Info\.plist \*\/,)/,
      `$1${groupEntry}\n\t\t\t\t$2`
    );

    // Add to Resources build phase
    const resourceEntry = `\t\t\t\t${buildFileId} /* GoogleService-Info.plist in Resources */,`;

    projectContent = projectContent.replace(
      /(13B07F8E1A680F5B00A75B9A \/\* Resources \*\/ = \{[^}]+files = \([^)]+)(BB2F792D24A3F905000567C9 \/\* Expo\.plist in Resources \*\/,)/,
      `$1${resourceEntry}\n\t\t\t\t$2`
    );

    fs.writeFileSync(xcodeProjectPath, projectContent);
    console.log(`✅ Added GoogleService-Info.plist to Xcode project`);
  } catch (error) {
    console.error(
      `❌ Failed to add GoogleService-Info.plist to Xcode project: ${error.message}`
    );
    console.log(`⚠️  You may need to add it manually in Xcode`);
  }
};

copyFirebaseConfig();

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

  // Generate key alias dynamically using full brand name (kebab-case)
  const keyAlias = brandConfig.name.toLowerCase().replace(/\s+/g, "-") + "-key";

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

  // Update namespace to use brand-specific bundle identifier
  buildGradleContent = buildGradleContent.replace(
    /namespace\s+['"][^'"]*['"]/,
    `namespace '${bundleId}'`
  );

  // Update applicationId with the brand-specific bundle identifier
  buildGradleContent = buildGradleContent.replace(
    /applicationId\s+['"][^'"]*['"]/,
    `applicationId '${bundleId}'`
  );

  fs.writeFileSync(buildGradlePath, buildGradleContent);
  console.log(`✅ Updated Android build.gradle:`);
  console.log(`   - namespace: ${bundleId}`);
  console.log(`   - applicationId: ${bundleId}`);
};

updateAndroidBuildGradle();

// Update BuildConfig imports in Kotlin files to match current brand namespace
const updateKotlinBuildConfigImports = () => {
  const kotlinFiles = [
    path.join(
      projectRoot,
      "android",
      "app",
      "src",
      "main",
      "java",
      "com",
      "emap",
      "app",
      "MainActivity.kt"
    ),
    path.join(
      projectRoot,
      "android",
      "app",
      "src",
      "main",
      "java",
      "com",
      "emap",
      "app",
      "MainApplication.kt"
    ),
  ];

  kotlinFiles.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      console.log(`ℹ️  Kotlin file not found: ${path.basename(filePath)}`);
      return;
    }

    try {
      let content = fs.readFileSync(filePath, "utf8");

      // Replace any existing BuildConfig import with the current brand's namespace
      const buildConfigImportRegex = /import\s+[a-z.]+\.BuildConfig/g;
      const newImport = `import ${bundleId}.BuildConfig`;

      if (buildConfigImportRegex.test(content)) {
        // Replace existing import
        content = content.replace(buildConfigImportRegex, newImport);
      } else {
        // Add import after package declaration
        const packageRegex = /(package\s+com\.emap\.app\s*\n)/;
        if (packageRegex.test(content)) {
          content = content.replace(
            packageRegex,
            `$1\nimport ${bundleId}.BuildConfig`
          );
        }
      }

      fs.writeFileSync(filePath, content);
      console.log(
        `✅ Updated BuildConfig import in ${path.basename(filePath)}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to update ${path.basename(filePath)}: ${error.message}`
      );
    }
  });
};

updateKotlinBuildConfigImports();

// Setup brand-specific Android source structure
const setupBrandAndroidStructure = () => {
  const androidSrcPath = path.join(
    projectRoot,
    "android",
    "app",
    "src",
    "main",
    "java"
  );

  // Create brand-specific package path
  const packageParts = bundleId.split(".");
  const brandPackagePath = path.join(androidSrcPath, ...packageParts);

  // Check if brand structure already exists
  if (fs.existsSync(brandPackagePath)) {
    console.log(`✅ Brand package structure already exists: ${bundleId}`);
    return;
  }

  console.log(`ℹ️  Creating brand-specific package structure: ${bundleId}`);
  fs.mkdirSync(brandPackagePath, { recursive: true });
};

setupBrandAndroidStructure();

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
  console.log(`✅ iOS project found: ${currentProjectName}`);
  console.log(`📱 Bundle identifier will be set to: ${bundleId}`);
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

// Update iOS URL schemes in Info.plist
const updateIOSURLSchemes = () => {
  const infoPlistPath = path.join(projectRoot, "ios", "emap", "Info.plist");

  if (!fs.existsSync(infoPlistPath)) {
    console.log(`ℹ️  iOS Info.plist not found, skipping URL scheme update`);
    return;
  }

  try {
    let plistContent = fs.readFileSync(infoPlistPath, "utf8");

    // Check if CFBundleURLTypes exists
    if (!plistContent.includes("<key>CFBundleURLTypes</key>")) {
      console.log(`⚠️  CFBundleURLTypes not found in Info.plist`);
      return;
    }

    // Build new URL schemes array with brand scheme first
    const newSchemes = [brand, "emap", "com.emap.app"];
    const uniqueSchemes = [...new Set(newSchemes)]; // Remove duplicates

    const schemesXml = uniqueSchemes
      .map((scheme) => `          <string>${scheme}</string>`)
      .join("\n");

    const newUrlTypes = `<key>CFBundleURLTypes</key>
    <array>
      <dict>
        <key>CFBundleURLSchemes</key>
        <array>
${schemesXml}
        </array>
      </dict>
    </array>`;

    // More precise regex that matches the complete CFBundleURLTypes block including nested arrays
    const urlTypesRegex =
      /<key>CFBundleURLTypes<\/key>\s*<array>\s*<dict>\s*<key>CFBundleURLSchemes<\/key>\s*<array>[\s\S]*?<\/array>\s*<\/dict>\s*<\/array>/;

    if (!urlTypesRegex.test(plistContent)) {
      console.log(`⚠️  Could not find properly formatted CFBundleURLTypes`);
      return;
    }

    // Replace the CFBundleURLTypes section
    const updatedContent = plistContent.replace(urlTypesRegex, newUrlTypes);

    if (plistContent !== updatedContent) {
      fs.writeFileSync(infoPlistPath, updatedContent);
      console.log(`✅ Updated iOS URL schemes: ${uniqueSchemes.join(", ")}`);
    } else {
      console.log(`ℹ️  iOS URL schemes already correct`);
    }
  } catch (error) {
    console.error(`❌ Failed to update iOS URL schemes: ${error.message}`);
  }
};

updateIOSURLSchemes();
// Update Android URL schemes and App Links in AndroidManifest.xml
const updateAndroidURLSchemes = () => {
  const manifestPath = path.join(
    projectRoot,
    "android",
    "app",
    "src",
    "main",
    "AndroidManifest.xml"
  );

  if (!fs.existsSync(manifestPath)) {
    console.log(
      `ℹ️  AndroidManifest.xml not found, skipping URL scheme update`
    );
    return;
  }

  try {
    let manifestContent = fs.readFileSync(manifestPath, "utf8");

    // Build URL schemes intent filter
    const allSchemes = ["emap", brand]; // Always include emap + current brand
    const uniqueSchemes = [...new Set(allSchemes)];

    const schemeDataElements = uniqueSchemes
      .map((scheme) => `        <data android:scheme="${scheme}"/>`)
      .join("\n");

    const customSchemeFilter = `      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
${schemeDataElements}
      </intent-filter>`;

    // Build App Links intent filters for the current brand
    let appLinksFilters = "";

    if (domain) {
      const appLinksFilter = `      <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https" android:host="${domain}"/>
      </intent-filter>`;

      appLinksFilters = appLinksFilter;

      // Add variant without www if domain has www
      if (domain.startsWith("www.")) {
        const domainWithoutWww = domain.replace("www.", "");
        appLinksFilters += `\n      <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https" android:host="${domainWithoutWww}"/>
      </intent-filter>`;
      }
    }

    // Find and replace all intent-filters within MainActivity
    // Match from the LAUNCHER intent-filter to the closing </activity> tag
    const activityRegex =
      /(android:name="com\.emap\.app\.MainActivity"[\s\S]*?<intent-filter>\s*<action android:name="android\.intent\.action\.MAIN"\/>\s*<category android:name="android\.intent\.category\.LAUNCHER"\/>\s*<\/intent-filter>)([\s\S]*?)(<\/activity>)/;

    const match = manifestContent.match(activityRegex);

    if (!match) {
      console.log(`⚠️  Could not find MainActivity in AndroidManifest.xml`);
      return;
    }

    // Build the new intent filters section
    const newIntentFilters = `\n${customSchemeFilter}${
      appLinksFilters ? "\n" + appLinksFilters : ""
    }\n    `;

    // Replace everything between LAUNCHER filter and </activity>
    const updatedContent = manifestContent.replace(
      activityRegex,
      `$1${newIntentFilters}$3`
    );

    if (manifestContent !== updatedContent) {
      fs.writeFileSync(manifestPath, updatedContent);
      console.log(
        `✅ Updated Android URL schemes: ${uniqueSchemes.join(", ")}`
      );
      if (domain) {
        console.log(`✅ Updated Android App Links for: ${domain}`);
      }
    } else {
      console.log(`ℹ️  Android URL schemes already correct`);
    }
  } catch (error) {
    console.error(`❌ Failed to update Android URL schemes: ${error.message}`);
    console.error(error.stack);
  }
};

updateAndroidURLSchemes();

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

// Generate logo registry for dynamic brand logo imports
const generateLogoRegistry = () => {
  console.log(`\n🎨 Generating logo registry...`);

  try {
    // Discover all brands with logo.svg files
    const brandLogos = [];
    const brandHeaderLogos = [];
    const brandHeaderDarkLogos = [];

    validBrands.forEach((brandShortcode) => {
      const logoPath = path.join(brandsDir, brandShortcode, "logo.svg");
      const headerLogoPath = path.join(
        brandsDir,
        brandShortcode,
        "logo-header.svg"
      );
      const headerDarkLogoPath = path.join(
        brandsDir,
        brandShortcode,
        "logo-header-dark.svg"
      );

      if (fs.existsSync(logoPath)) {
        brandLogos.push(brandShortcode);
      } else {
        console.warn(`⚠️  Logo not found for brand: ${brandShortcode}`);
      }

      if (fs.existsSync(headerLogoPath)) {
        brandHeaderLogos.push(brandShortcode);
      }

      if (fs.existsSync(headerDarkLogoPath)) {
        brandHeaderDarkLogos.push(brandShortcode);
      }
    });

    // Generate TypeScript file with all logo imports
    const timestamp = new Date().toISOString();
    const registryContent = `// This file is auto-generated by the prebuild script
// DO NOT EDIT MANUALLY - it will be overwritten
// Generated at: ${timestamp}

import React from "react";

// Auto-generated brand logo imports
${brandLogos
  .map((b) => `import ${b.toUpperCase()}Logo from "@/brands/${b}/logo.svg";`)
  .join("\n")}
${
  brandHeaderLogos.length > 0
    ? brandHeaderLogos
        .map(
          (b) =>
            `import ${b.toUpperCase()}HeaderLogo from "@/brands/${b}/logo-header.svg";`
        )
        .join("\n")
    : ""
}
${
  brandHeaderDarkLogos.length > 0
    ? brandHeaderDarkLogos
        .map(
          (b) =>
            `import ${b.toUpperCase()}HeaderDarkLogo from "@/brands/${b}/logo-header-dark.svg";`
        )
        .join("\n")
    : ""
}

// Logo registry - maps brand shortcodes to their logo components
export const BRAND_LOGOS: Record<string, React.ComponentType<any>> = {
${brandLogos.map((b) => `  ${b}: ${b.toUpperCase()}Logo,`).join("\n")}
};

// Header logo registry - maps brand shortcodes to their header logo components
export const BRAND_HEADER_LOGOS: Record<string, React.ComponentType<any>> = {
${
  brandHeaderLogos.length > 0
    ? brandHeaderLogos
        .map((b) => `  ${b}: ${b.toUpperCase()}HeaderLogo,`)
        .join("\n")
    : ""
}
};

// Header dark logo registry - maps brand shortcodes to their dark mode header logo components
export const BRAND_HEADER_DARK_LOGOS: Record<string, React.ComponentType<any>> = {
${
  brandHeaderDarkLogos.length > 0
    ? brandHeaderDarkLogos
        .map((b) => `  ${b}: ${b.toUpperCase()}HeaderDarkLogo,`)
        .join("\n")
    : ""
}
};

// Available brand shortcodes with logos
export const AVAILABLE_LOGO_BRANDS = [${brandLogos
      .map((b) => `'${b}'`)
      .join(", ")}] as const;

// Type for brand shortcodes with logos
export type BrandLogoShortcode = typeof AVAILABLE_LOGO_BRANDS[number];

// Check if a brand has a logo in the registry
export function hasBrandLogo(shortcode: string): shortcode is BrandLogoShortcode {
  return shortcode in BRAND_LOGOS;
}

// Check if a brand has a header logo in the registry
export function hasBrandHeaderLogo(shortcode: string): boolean {
  return shortcode in BRAND_HEADER_LOGOS;
}

// Check if a brand has a dark header logo in the registry
export function hasBrandHeaderDarkLogo(shortcode: string): boolean {
  return shortcode in BRAND_HEADER_DARK_LOGOS;
}
`;

    const registryPath = path.join(projectRoot, "brands", "logoRegistry.ts");
    fs.writeFileSync(registryPath, registryContent);

    console.log(`✅ Generated logo registry with ${brandLogos.length} brands`);
    console.log(`   Brands: ${brandLogos.join(", ")}`);
    if (brandHeaderLogos.length > 0) {
      console.log(`   Header logos: ${brandHeaderLogos.join(", ")}`);
    }
    if (brandHeaderDarkLogos.length > 0) {
      console.log(`   Header dark logos: ${brandHeaderDarkLogos.join(", ")}`);
    }
    console.log(`   File: brands/logoRegistry.ts`);
  } catch (error) {
    console.error(`❌ Failed to generate logo registry: ${error.message}`);
    console.error(`⚠️  BrandLogo component may need manual updates`);
  }
};
const generateEditorImageRegistry = () => {
  console.log(`\n👤 Generating editor image registry...`);

  try {
    // Discover all brands with editor.jpg files
    const brandEditorImages = [];

    validBrands.forEach((brandShortcode) => {
      const editorImagePath = path.join(
        brandsDir,
        brandShortcode,
        "editor.jpg"
      );

      if (fs.existsSync(editorImagePath)) {
        brandEditorImages.push(brandShortcode);
      }
    });

    // Generate TypeScript file with all editor image imports
    const timestamp = new Date().toISOString();
    const registryContent = `// This file is auto-generated by the prebuild script
// DO NOT EDIT MANUALLY - it will be overwritten
// Generated at: ${timestamp}

${
  brandEditorImages.length > 0
    ? `// Auto-generated brand editor image imports
${brandEditorImages
  .map(
    (b) =>
      `import ${b.toUpperCase()}EditorImage from "@/brands/${b}/editor.jpg";`
  )
  .join("\n")}`
    : "// No editor images found"
}

// Editor image registry - maps brand shortcodes to their editor images
export const BRAND_EDITOR_IMAGES: Record<string, any> = {
${
  brandEditorImages.length > 0
    ? brandEditorImages
        .map((b) => `  ${b}: ${b.toUpperCase()}EditorImage,`)
        .join("\n")
    : ""
}
};

// Available brand shortcodes with editor images
export const AVAILABLE_EDITOR_IMAGE_BRANDS = [${brandEditorImages
      .map((b) => `'${b}'`)
      .join(", ")}] as const;

// Type for brand shortcodes with editor images
export type BrandEditorImageShortcode = typeof AVAILABLE_EDITOR_IMAGE_BRANDS[number];

// Check if a brand has an editor image in the registry
export function hasBrandEditorImage(shortcode: string): shortcode is BrandEditorImageShortcode {
  return shortcode in BRAND_EDITOR_IMAGES;
}

// Get editor image for a brand (returns null if not available)
export function getBrandEditorImage(shortcode: string): any | null {
  return BRAND_EDITOR_IMAGES[shortcode] || null;
}
`;

    const registryPath = path.join(
      projectRoot,
      "brands",
      "editorImageRegistry.ts"
    );
    fs.writeFileSync(registryPath, registryContent);

    console.log(
      `✅ Generated editor image registry with ${brandEditorImages.length} brands`
    );
    if (brandEditorImages.length > 0) {
      console.log(
        `   Brands with editor images: ${brandEditorImages.join(", ")}`
      );
    } else {
      console.log(`   No brands with editor images found`);
    }
    console.log(`   File: brands/editorImageRegistry.ts`);
  } catch (error) {
    console.error(
      `❌ Failed to generate editor image registry: ${error.message}`
    );
    console.error(`⚠️  WelcomeScreen component may need manual updates`);
  }
};

// Enable Android App Links for development
const enableAndroidAppLinks = () => {
  console.log(`🔗 Checking Android App Links configuration...`);

  const { execSync } = require("child_process");

  try {
    // Check if adb is available
    execSync("adb version", { stdio: "ignore" });

    // Check if device is connected
    const devices = execSync("adb devices", { encoding: "utf8" });
    const deviceLines = devices
      .split("\n")
      .filter((line) => line.includes("\t"));

    if (deviceLines.length === 0) {
      console.log(
        `ℹ️  No Android devices connected - skipping App Links setup`
      );
      console.log(`   Run this command manually after connecting device:`);
      console.log(
        `   adb shell pm set-app-links --package ${bundleId} 0 ${domainVariants.join(
          " "
        )}`
      );
      return;
    }

    console.log(`📱 Found ${deviceLines.length} connected Android device(s)`);
    console.log(`🔧 Enabling App Links for development...`);

    // Enable App Links for the brand's domains
    const command = `adb shell pm set-app-links --package ${bundleId} 0 ${domainVariants.join(
      " "
    )}`;
    execSync(command, { stdio: "inherit" });

    console.log(
      `✅ Enabled App Links for domains: ${domainVariants.join(", ")}`
    );
    console.log(`   Package: ${bundleId}`);
    console.log(
      `   Note: This is for development only. Production apps need assetlinks.json on the server.`
    );
  } catch (error) {
    console.log(
      `ℹ️  Could not automatically enable App Links: ${error.message}`
    );
    console.log(
      `   This is normal if no device is connected or adb is not available`
    );
    console.log(`   Run this command manually after connecting device:`);
    console.log(
      `   adb shell pm set-app-links --package ${bundleId} 0 ${domainVariants.join(
        " "
      )}`
    );
  }
};

// Only run App Links setup if building for Android
if (
  process.argv.includes("--android") ||
  process.env.EAS_BUILD_PLATFORM === "android"
) {
  enableAndroidAppLinks();
} else {
  console.log(`ℹ️  Skipping App Links setup (not an Android build)`);
  console.log(`   To enable App Links for development, run:`);
  console.log(
    `   adb shell pm set-app-links --package ${bundleId} 0 ${domainVariants.join(
      " "
    )}`
  );
}
generateLogoRegistry();
generateEditorImageRegistry();

console.log(
  `\n🎉 Pre-build process completed successfully for ${brandConfig.displayName}`
);
console.log(`📱 Android Bundle ID: ${bundleId}`);
console.log(`📱 iOS Bundle ID: ${bundleId}`);
console.log(`🎨 Brand: ${brand}`);
console.log(`🌐 Domain: ${domain}`);
console.log(`🔗 Deep Linking:`);
console.log(`   • iOS Universal Links: applinks:${domain}`);
console.log(`   • Android App Links: https://${domain}`);
console.log(`   • Custom Scheme: ${brand}://`);
console.log(`\n🚀 Next steps:`);
console.log(`   1. Configure: node scripts/prebuild.js ${brand}`);
console.log(`   2. Android: cd android && ./gradlew bundleRelease`);

console.log(`   3. iOS: Use EAS build or Xcode with generic project`);
