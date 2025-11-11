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

    // Generate light mode icons
    for (const iconConfig of IOS_ICON_SIZES) {
      const outputPath = path.join(iosPath, iconConfig.filename);

      // Use sharp directly for SVG to PNG conversion
      let iconBuffer = await sharp(logoPath)
        .resize(iconConfig.size, iconConfig.size, {
          fit: "contain",
          background: {
            r: 255,
            g: 255,
            b: 255,
            alpha: iconConfig.size === 1024 ? 1 : 0,
          },
        })
        .png()
        .toBuffer();

      // Remove transparency for App Store icon
      if (iconConfig.size === 1024) {
        iconBuffer = await sharp(iconBuffer)
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .toBuffer();
      }

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

      // Use sharp directly for SVG to PNG conversion with transparency preserved
      const iconBuffer = await sharp(logoPath)
        .resize(iconConfig.size, iconConfig.size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
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

      // Use sharp directly for SVG to PNG conversion
      const splashBuffer = await sharp(logoPath)
        .resize(splashConfig.size, splashConfig.size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

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
    const backgroundColor =
      brandConfig.branding?.iconBackgroundColor || "#ffffff";

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

    const playStoreBuffer = await sharp(logoPath)
      .resize(512, 512, {
        fit: "contain",
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

      const foregroundBuffer = await sharp(logoPath)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 90 })
        .toBuffer();

      await fs.promises.writeFile(outputPath, foregroundBuffer);
      results.foreground.push({ density: densityKey, size, path: outputPath });
      console.log(`  ✅ Foreground ${densityKey}: ${size}×${size}`);
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

      const splashBuffer = await sharp(logoPath)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      await fs.promises.writeFile(outputPath, splashBuffer);
      console.log(`  ✅ Splash ${densityKey}: ${size}×${size}`);
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

      let assetBuffer = await sharp(logoPath)
        .resize(asset.size, asset.size, {
          fit: asset.name === "splashIcon" ? "contain" : "cover",
          background: bgColor,
        })
        .png()
        .toBuffer();

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
