#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/**
 * Modern Icon Generation System using Sharp directly
 * Generates complete icon sets including:
 * - iOS app icons (light, dark, tinted variants for iOS 18+)
 * - Android adaptive icons (foreground + background layers + XML config)
 * - Splash screen assets
 */

// iOS icon sizes following Apple's guidelines
const IOS_ICON_SIZES = [
  {
    size: 1024,
    scale: 1,
    filename: "App-Icon-1024x1024@1x.png",
    idiom: "universal",
    platform: "ios",
  },
  {
    size: 180,
    scale: 3,
    filename: "App-Icon-180x180@1x.png",
    idiom: "iphone",
    sizeStr: "60x60",
  },
  {
    size: 120,
    scale: 2,
    filename: "App-Icon-120x120@1x.png",
    idiom: "iphone",
    sizeStr: "60x60",
  },
  {
    size: 167,
    scale: 2,
    filename: "App-Icon-167x167@1x.png",
    idiom: "ipad",
    sizeStr: "83.5x83.5",
  },
  {
    size: 152,
    scale: 2,
    filename: "App-Icon-152x152@1x.png",
    idiom: "ipad",
    sizeStr: "76x76",
  },
  {
    size: 76,
    scale: 1,
    filename: "App-Icon-76x76@1x.png",
    idiom: "ipad",
    sizeStr: "76x76",
  },
  {
    size: 40,
    scale: 2,
    filename: "App-Icon-40x40@2x.png",
    idiom: "iphone",
    sizeStr: "20x20",
  },
  {
    size: 60,
    scale: 3,
    filename: "App-Icon-60x60@3x.png",
    idiom: "iphone",
    sizeStr: "20x20",
  },
  {
    size: 58,
    scale: 2,
    filename: "App-Icon-58x58@2x.png",
    idiom: "iphone",
    sizeStr: "29x29",
  },
  {
    size: 87,
    scale: 3,
    filename: "App-Icon-87x87@3x.png",
    idiom: "iphone",
    sizeStr: "29x29",
  },
  {
    size: 80,
    scale: 2,
    filename: "App-Icon-80x80@2x.png",
    idiom: "iphone",
    sizeStr: "40x40",
  },
  {
    size: 58,
    scale: 2,
    filename: "App-Icon-58x58@2x-ipad.png",
    idiom: "ipad",
    sizeStr: "29x29",
  },
];

// Android density configurations
const ANDROID_DENSITIES = {
  mdpi: { scale: 1, folderName: "mipmap-mdpi" },
  hdpi: { scale: 1.5, folderName: "mipmap-hdpi" },
  xhdpi: { scale: 2, folderName: "mipmap-xhdpi" },
  xxhdpi: { scale: 3, folderName: "mipmap-xxhdpi" },
  xxxhdpi: { scale: 4, folderName: "mipmap-xxxhdpi" },
};

const ADAPTIVE_ICON_SIZE = 108; // Android adaptive icon base size

class IconGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  /**
   * Parse hex color to RGB object
   */
  parseHexColor(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  }

  /**
   * Generate all icons for a brand
   */
  async generateAllIcons(brand, brandConfig) {
    console.log(`🎨 Generating icons for brand: ${brandConfig.displayName}`);

    const logoPath = path.join(this.projectRoot, "brands", brand, "logo.svg");

    if (!fs.existsSync(logoPath)) {
      throw new Error(`Logo SVG not found: ${logoPath}`);
    }

    // Create output directories
    await this.createOutputDirectories(brand);

    const results = {
      ios: await this.generateIOSIcons(logoPath, brand, brandConfig),
      android: await this.generateAndroidIcons(logoPath, brand, brandConfig),
      expo: await this.generateExpoAssets(logoPath, brand, brandConfig),
    };

    console.log(`✅ Generated all icons for ${brandConfig.displayName}`);
    return results;
  }

  /**
   * Create all necessary output directories
   */
  async createOutputDirectories(brand) {
    const directories = [
      // iOS directories
      path.join(
        this.projectRoot,
        "ios",
        "emap",
        "Images.xcassets",
        "AppIcon.appiconset"
      ),
      path.join(
        this.projectRoot,
        "ios",
        "emap",
        "Images.xcassets",
        "SplashScreenLogo.imageset"
      ),

      // Android mipmap directories
      ...Object.values(ANDROID_DENSITIES).map((density) =>
        path.join(
          this.projectRoot,
          "android",
          "app",
          "src",
          "main",
          "res",
          density.folderName
        )
      ),

      // Android adaptive icon directory
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "mipmap-anydpi-v26"
      ),

      // Android drawable directories for splash
      ...Object.values(ANDROID_DENSITIES).map((density) =>
        path.join(
          this.projectRoot,
          "android",
          "app",
          "src",
          "main",
          "res",
          density.folderName.replace("mipmap", "drawable")
        )
      ),

      // Brand assets directory
      path.join(this.projectRoot, "brands", brand, "assets"),

      // Main assets directory
      path.join(this.projectRoot, "assets", "images"),
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Generate iOS app icons with dark mode support
   */
  async generateIOSIcons(logoPath, brand, brandConfig) {
    console.log(`📱 Generating iOS app icons...`);

    const iosPath = path.join(
      this.projectRoot,
      "ios",
      "emap",
      "Images.xcassets",
      "AppIcon.appiconset"
    );
    const results = { light: [], dark: [] };
    const imagesJson = [];

    // Get background colors from config
    const lightBgColor =
      brandConfig.branding?.iconBackgroundColorLight || "#ffffff";
    const darkBgColor =
      brandConfig.branding?.iconBackgroundColorDark ||
      brandConfig.branding?.iconBackgroundColor ||
      "#000000";

    const lightBgRGB = this.parseHexColor(lightBgColor);
    const darkBgRGB = this.parseHexColor(darkBgColor);

    // Get padding from config (default to 0 for no padding)
    // Clamp padding between 0 and 0.4 (0% to 40%) to prevent negative sizes
    let padding = brandConfig.branding?.iconPadding || 0;
    if (padding < 0) padding = 0;
    if (padding > 0.4) {
      console.warn(
        `⚠️  Icon padding ${padding} is too large, clamping to 0.4 (40%)`
      );
      padding = 0.4;
    }

    console.log(`  Light mode background: ${lightBgColor}`);
    console.log(`  Dark mode background: ${darkBgColor}`);
    console.log(`  Icon padding: ${(padding * 100).toFixed(1)}%`);

    // Generate light mode icons
    for (const iconConfig of IOS_ICON_SIZES) {
      const outputPath = path.join(iosPath, iconConfig.filename);

      // Calculate size with padding
      const paddedSize = Math.round(iconConfig.size * (1 - padding * 2));
      const paddingAmount = Math.round((iconConfig.size - paddedSize) / 2);

      let iconBuffer;

      if (padding > 0) {
        // Apply padding by resizing smaller and extending with background
        iconBuffer = await sharp(logoPath)
          .resize(paddedSize, paddedSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .extend({
            top: paddingAmount,
            bottom: paddingAmount,
            left: paddingAmount,
            right: paddingAmount,
            background: {
              r: lightBgRGB.r,
              g: lightBgRGB.g,
              b: lightBgRGB.b,
              alpha: 1,
            },
          })
          .png()
          .toBuffer();
      } else {
        // No padding - use original size with background
        iconBuffer = await sharp(logoPath)
          .resize(iconConfig.size, iconConfig.size, {
            fit: "contain",
            background: {
              r: lightBgRGB.r,
              g: lightBgRGB.g,
              b: lightBgRGB.b,
              alpha: 1,
            },
          })
          .png()
          .toBuffer();
      }

      // Flatten to remove any remaining transparency and ensure exact dimensions
      iconBuffer = await sharp(iconBuffer)
        .flatten({ background: lightBgRGB })
        .resize(iconConfig.size, iconConfig.size, {
          fit: "cover",
          position: "center",
        })
        .toBuffer();

      await fs.promises.writeFile(outputPath, iconBuffer);

      results.light.push({
        size: iconConfig.size,
        filename: iconConfig.filename,
        path: outputPath,
      });

      // Add to Contents.json
      const imageEntry = {
        filename: iconConfig.filename,
        idiom: iconConfig.idiom,
        scale: `${iconConfig.scale}x`,
        size: iconConfig.sizeStr || `${iconConfig.size}x${iconConfig.size}`,
      };

      if (iconConfig.platform) {
        imageEntry.platform = iconConfig.platform;
      }

      imagesJson.push(imageEntry);

      console.log(
        `  ✅ ${iconConfig.filename}: ${iconConfig.size}×${iconConfig.size}`
      );
    }

    // Generate dark mode icons (iOS 18+)
    console.log(`🌙 Generating iOS dark mode icons...`);
    for (const iconConfig of IOS_ICON_SIZES) {
      const darkFilename = iconConfig.filename.replace(
        "App-Icon-",
        "App-Icon-dark-"
      );
      const outputPath = path.join(iosPath, darkFilename);

      // Calculate size with padding
      const paddedSize = Math.round(iconConfig.size * (1 - padding * 2));
      const paddingAmount = Math.round((iconConfig.size - paddedSize) / 2);

      let iconBuffer;

      if (padding > 0) {
        // Apply padding by resizing smaller and extending with background
        iconBuffer = await sharp(logoPath)
          .resize(paddedSize, paddedSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .extend({
            top: paddingAmount,
            bottom: paddingAmount,
            left: paddingAmount,
            right: paddingAmount,
            background: {
              r: darkBgRGB.r,
              g: darkBgRGB.g,
              b: darkBgRGB.b,
              alpha: 1,
            },
          })
          .png()
          .toBuffer();
      } else {
        // No padding - use original size with background
        iconBuffer = await sharp(logoPath)
          .resize(iconConfig.size, iconConfig.size, {
            fit: "contain",
            background: {
              r: darkBgRGB.r,
              g: darkBgRGB.g,
              b: darkBgRGB.b,
              alpha: 1,
            },
          })
          .png()
          .toBuffer();
      }

      // Flatten to remove any remaining transparency and ensure exact dimensions
      iconBuffer = await sharp(iconBuffer)
        .flatten({ background: darkBgRGB })
        .resize(iconConfig.size, iconConfig.size, {
          fit: "cover",
          position: "center",
        })
        .toBuffer();

      await fs.promises.writeFile(outputPath, iconBuffer);

      results.dark.push({
        size: iconConfig.size,
        filename: darkFilename,
        path: outputPath,
      });

      // Add dark mode entry to Contents.json
      const darkImageEntry = {
        appearances: [
          {
            appearance: "luminosity",
            value: "dark",
          },
        ],
        filename: darkFilename,
        idiom: iconConfig.idiom,
        scale: `${iconConfig.scale}x`,
        size: iconConfig.sizeStr || `${iconConfig.size}x${iconConfig.size}`,
      };

      if (iconConfig.platform) {
        darkImageEntry.platform = iconConfig.platform;
      }

      imagesJson.push(darkImageEntry);

      console.log(
        `  ✅ ${darkFilename}: ${iconConfig.size}×${iconConfig.size}`
      );
    }

    // Write Contents.json
    const contentsJson = {
      images: imagesJson,
      info: {
        author: "expo",
        version: 1,
      },
    };

    await fs.promises.writeFile(
      path.join(iosPath, "Contents.json"),
      JSON.stringify(contentsJson, null, 2)
    );

    console.log(`✅ Updated iOS AppIcon Contents.json with dark mode support`);

    // Generate splash screen logos
    console.log(`🖼️  Generating iOS splash screen logos...`);
    const splashPath = path.join(
      this.projectRoot,
      "ios",
      "emap",
      "Images.xcassets",
      "SplashScreenLogo.imageset"
    );
    const splashSizes = [
      { size: 200, scale: 1, filename: "image.png" },
      { size: 400, scale: 2, filename: "image@2x.png" },
      { size: 600, scale: 3, filename: "image@3x.png" },
    ];

    for (const splashConfig of splashSizes) {
      const outputPath = path.join(splashPath, splashConfig.filename);

      // Apply padding to splash screen logos too
      const paddedSize = Math.round(splashConfig.size * (1 - padding * 2));
      const paddingAmount = Math.round((splashConfig.size - paddedSize) / 2);

      let splashBuffer;

      if (padding > 0) {
        splashBuffer = await sharp(logoPath)
          .resize(paddedSize, paddedSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .extend({
            top: paddingAmount,
            bottom: paddingAmount,
            left: paddingAmount,
            right: paddingAmount,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
      } else {
        splashBuffer = await sharp(logoPath)
          .resize(splashConfig.size, splashConfig.size, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
      }

      await fs.promises.writeFile(outputPath, splashBuffer);
      console.log(
        `  ✅ ${splashConfig.filename}: ${splashConfig.size}×${splashConfig.size}`
      );
    }

    return results;
  }

  /**
   * Generate Android adaptive icons with foreground + background layers
   */
  async generateAndroidIcons(logoPath, brand, brandConfig) {
    console.log(`🤖 Generating Android adaptive icons...`);

    const results = { foreground: [], background: [], playStore: null };

    // Use light mode background color for Android (Android doesn't support separate light/dark adaptive icons)
    const backgroundColor =
      brandConfig.branding?.iconBackgroundColorLight ||
      brandConfig.branding?.iconBackgroundColor ||
      "#ffffff";

    // Get padding from config (default to 0 for no padding)
    // Clamp padding between 0 and 0.4 (0% to 40%) to prevent negative sizes
    let padding = brandConfig.branding?.iconPadding || 0;
    if (padding < 0) padding = 0;
    if (padding > 0.4) {
      console.warn(
        `⚠️  Icon padding ${padding} is too large, clamping to 0.4 (40%)`
      );
      padding = 0.4;
    }

    console.log(`  Android background color: ${backgroundColor}`);
    console.log(`  Icon padding: ${(padding * 100).toFixed(1)}%`);

    // Generate Play Store icon
    console.log(`📦 Generating Play Store icon...`);
    const playStorePath = path.join(
      this.projectRoot,
      "brands",
      brand,
      "assets",
      "icon-512.png"
    );

    // Parse background color
    const bgColor = this.parseColor(backgroundColor);

    // Calculate size with padding for Play Store icon
    const playStorePaddedSize = Math.round(512 * (1 - padding * 2));

    const playStoreBuffer = await sharp(logoPath)
      .resize(playStorePaddedSize, playStorePaddedSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: Math.round((512 - playStorePaddedSize) / 2),
        bottom: Math.round((512 - playStorePaddedSize) / 2),
        left: Math.round((512 - playStorePaddedSize) / 2),
        right: Math.round((512 - playStorePaddedSize) / 2),
        background: bgColor,
      })
      .flatten({ background: bgColor })
      .png()
      .toBuffer();

    await fs.promises.writeFile(playStorePath, playStoreBuffer);
    results.playStore = { path: playStorePath, size: 512 };
    console.log(`  ✅ Play Store icon: 512×512`);

    // Generate foreground layers for all densities
    console.log(`🎨 Generating adaptive icon foreground layers...`);
    for (const [densityKey, density] of Object.entries(ANDROID_DENSITIES)) {
      const size = Math.round(ADAPTIVE_ICON_SIZE * density.scale);

      // Android adaptive icons: 108dp total, but only 72dp (66.67%) is safe zone
      // We need to fit the logo within the safe zone, then add user padding on top
      const safeZoneRatio = 72 / 108; // 0.6667
      const safeZoneSize = Math.round(size * safeZoneRatio);

      // Apply user padding within the safe zone
      const paddedSize = Math.round(safeZoneSize * (1 - padding * 2));
      const paddingAmount = Math.round((safeZoneSize - paddedSize) / 2);

      // Calculate total padding to center within full 108dp canvas
      const totalPadding = Math.round((size - safeZoneSize) / 2);

      const outputPath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        density.folderName,
        "ic_launcher_foreground.webp"
      );

      let foregroundBuffer;

      if (padding > 0) {
        // Resize to padded size, extend to safe zone, then extend to full size
        foregroundBuffer = await sharp(logoPath)
          .resize(paddedSize, paddedSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .extend({
            top: paddingAmount,
            bottom: paddingAmount,
            left: paddingAmount,
            right: paddingAmount,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .extend({
            top: totalPadding,
            bottom: totalPadding,
            left: totalPadding,
            right: totalPadding,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .webp({ quality: 90 })
          .toBuffer();
      } else {
        // No user padding - just fit within safe zone
        foregroundBuffer = await sharp(logoPath)
          .resize(safeZoneSize, safeZoneSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .extend({
            top: totalPadding,
            bottom: totalPadding,
            left: totalPadding,
            right: totalPadding,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .webp({ quality: 90 })
          .toBuffer();
      }

      await fs.promises.writeFile(outputPath, foregroundBuffer);
      results.foreground.push({ density: densityKey, size, path: outputPath });
      console.log(
        `  ✅ Foreground ${densityKey}: ${size}×${size} (safe zone: ${safeZoneSize}×${safeZoneSize})`
      );
    }

    // Generate background layers for all densities
    console.log(`🎨 Generating adaptive icon background layers...`);
    for (const [densityKey, density] of Object.entries(ANDROID_DENSITIES)) {
      const size = Math.round(ADAPTIVE_ICON_SIZE * density.scale);
      const outputPath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        density.folderName,
        "ic_launcher_background.webp"
      );

      // Create a solid color background image
      const bgColor = this.parseColor(backgroundColor);
      const solidBackground = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: bgColor,
        },
      })
        .webp({ quality: 90 })
        .toBuffer();

      await fs.promises.writeFile(outputPath, solidBackground);
      results.background.push({ density: densityKey, size, path: outputPath });
      console.log(`  ✅ Background ${densityKey}: ${size}×${size}`);
    }

    // Generate adaptive icon XML configuration
    console.log(`📝 Generating adaptive icon XML configuration...`);
    await this.generateAdaptiveIconXML(backgroundColor);

    // Generate splash screen drawables
    console.log(`🎭 Generating Android splash screen drawables...`);

    // Get splash background color (use light mode for Android)
    const splashBgColor =
      brandConfig.branding?.iconBackgroundColorLight ||
      brandConfig.branding?.iconBackgroundColor ||
      "#ffffff";
    const splashBgRGB = this.parseColor(splashBgColor);

    console.log(`  Splash background color: ${splashBgColor}`);

    const splashSizes = {
      mdpi: 200,
      hdpi: 300,
      xhdpi: 400,
      xxhdpi: 600,
      xxxhdpi: 800,
    };

    for (const [densityKey, size] of Object.entries(splashSizes)) {
      const density = ANDROID_DENSITIES[densityKey];
      const outputPath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        density.folderName.replace("mipmap", "drawable"),
        "splashscreen_logo.png"
      );

      // For splash screens, use a more conservative approach
      // Add standard padding (20%) plus user padding for better visual balance
      const standardPadding = 0.1; // 20% standard padding for splash screens
      const totalPadding = Math.min(standardPadding + padding, 0.45); // Cap at 45%
      const paddedSize = Math.round(size * (1 - totalPadding * 2));
      const paddingAmount = Math.round((size - paddedSize) / 2);

      // Splash screen logos should have transparent background
      // The splash screen itself provides the background color
      const splashBuffer = await sharp(logoPath)
        .resize(paddedSize, paddedSize, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .extend({
          top: paddingAmount,
          bottom: paddingAmount,
          left: paddingAmount,
          right: paddingAmount,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      await fs.promises.writeFile(outputPath, splashBuffer);
      console.log(
        `  ✅ Splash ${densityKey}: ${size}×${size} (padding: ${(
          totalPadding * 100
        ).toFixed(1)}%)`
      );
    }

    return results;
  }

  /**
   * Generate Android adaptive icon XML configuration files
   */
  async generateAdaptiveIconXML(backgroundColor) {
    const androidResPath = path.join(
      this.projectRoot,
      "android",
      "app",
      "src",
      "main",
      "res"
    );
    const anydpiPath = path.join(androidResPath, "mipmap-anydpi-v26");

    // ic_launcher.xml
    const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    await fs.promises.writeFile(
      path.join(anydpiPath, "ic_launcher.xml"),
      icLauncherXml
    );
    console.log(`  ✅ Created ic_launcher.xml`);

    // ic_launcher_round.xml
    const icLauncherRoundXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    await fs.promises.writeFile(
      path.join(anydpiPath, "ic_launcher_round.xml"),
      icLauncherRoundXml
    );
    console.log(`  ✅ Created ic_launcher_round.xml`);

    // Update colors.xml with icon background color
    const colorsPath = path.join(androidResPath, "values", "colors.xml");
    if (fs.existsSync(colorsPath)) {
      let colorsXml = await fs.promises.readFile(colorsPath, "utf8");

      // Check if iconBackground color exists
      if (!colorsXml.includes('name="iconBackground"')) {
        // Add iconBackground color before closing </resources>
        colorsXml = colorsXml.replace(
          "</resources>",
          `    <color name="iconBackground">${backgroundColor}</color>\n</resources>`
        );
        await fs.promises.writeFile(colorsPath, colorsXml);
        console.log(`  ✅ Updated colors.xml with iconBackground`);
      }
    }
  }

  /**
   * Generate Expo/Web assets
   */
  async generateExpoAssets(logoPath, brand, brandConfig) {
    console.log(`🌐 Generating Expo/Web assets...`);

    const results = {};
    const padding = brandConfig.branding?.iconPadding || 0;

    const assets = [
      { name: "icon", size: 512, filename: "icon.png" },
      { name: "adaptiveIcon", size: 512, filename: "adaptive-icon.png" },
      { name: "favicon", size: 32, filename: "favicon.png" },
      { name: "splashIcon", size: 200, filename: "splash-icon.png" },
    ];

    for (const asset of assets) {
      // Generate to brand assets directory
      const brandOutputPath = path.join(
        this.projectRoot,
        "brands",
        brand,
        "assets",
        asset.filename
      );

      const bgColor =
        asset.name === "favicon"
          ? { r: 255, g: 255, b: 255, alpha: 1 }
          : { r: 0, g: 0, b: 0, alpha: 0 };

      // Calculate padded size for icons (not splash)
      const shouldPad = asset.name === "icon" || asset.name === "adaptiveIcon";
      const paddedSize = shouldPad
        ? Math.round(asset.size * (1 - padding * 2))
        : asset.size;

      let assetBuffer;

      if (shouldPad && padding > 0) {
        // Resize to padded size, then extend with background
        assetBuffer = await sharp(logoPath)
          .resize(paddedSize, paddedSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .extend({
            top: Math.round((asset.size - paddedSize) / 2),
            bottom: Math.round((asset.size - paddedSize) / 2),
            left: Math.round((asset.size - paddedSize) / 2),
            right: Math.round((asset.size - paddedSize) / 2),
            background: bgColor,
          })
          .png()
          .toBuffer();
      } else {
        // No padding - use original logic
        assetBuffer = await sharp(logoPath)
          .resize(asset.size, asset.size, {
            fit: asset.name === "splashIcon" ? "contain" : "cover",
            background: bgColor,
          })
          .png()
          .toBuffer();
      }

      // Flatten favicon to remove transparency
      if (asset.name === "favicon") {
        assetBuffer = await sharp(assetBuffer)
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .toBuffer();
      }

      await fs.promises.writeFile(brandOutputPath, assetBuffer);

      // Also copy to main assets directory
      const mainOutputPath = path.join(
        this.projectRoot,
        "assets",
        "images",
        asset.filename
      );
      await fs.promises.copyFile(brandOutputPath, mainOutputPath);

      results[asset.name] = {
        size: asset.size,
        filename: asset.filename,
        brandPath: brandOutputPath,
        mainPath: mainOutputPath,
      };

      console.log(`  ✅ ${asset.filename}: ${asset.size}×${asset.size}`);
    }

    return results;
  }

  /**
   * Parse hex color to RGB object for sharp
   */
  parseColor(hexColor) {
    // Remove # if present
    const hex = hexColor.replace("#", "");

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b, alpha: 1 };
  }

  /**
   * Clean old assets before generating new ones
   */
  async cleanOldAssets(brand) {
    console.log(`🧹 Cleaning old assets for brand: ${brand}`);

    const pathsToClean = [
      path.join(
        this.projectRoot,
        "ios",
        "emap",
        "Images.xcassets",
        "AppIcon.appiconset"
      ),
      path.join(
        this.projectRoot,
        "ios",
        "emap",
        "Images.xcassets",
        "SplashScreenLogo.imageset"
      ),
      path.join(this.projectRoot, "brands", brand, "assets"),
    ];

    for (const cleanPath of pathsToClean) {
      if (fs.existsSync(cleanPath)) {
        const files = fs.readdirSync(cleanPath);
        for (const file of files) {
          if (file.endsWith(".png") || file.endsWith(".webp")) {
            const filePath = path.join(cleanPath, file);
            await fs.promises.unlink(filePath);
          }
        }
      }
    }

    // Clean Android mipmap and drawable assets
    for (const density of Object.values(ANDROID_DENSITIES)) {
      const mipmapPath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        density.folderName
      );
      const drawablePath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        density.folderName.replace("mipmap", "drawable")
      );

      for (const cleanPath of [mipmapPath, drawablePath]) {
        if (fs.existsSync(cleanPath)) {
          const files = fs.readdirSync(cleanPath);
          for (const file of files) {
            if (
              file.startsWith("ic_launcher") ||
              file.startsWith("splashscreen_logo")
            ) {
              const filePath = path.join(cleanPath, file);
              await fs.promises.unlink(filePath);
            }
          }
        }
      }
    }

    console.log(`✅ Cleaned old assets`);
  }
}

module.exports = IconGenerator;
