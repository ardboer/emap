#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/**
 * Comprehensive SVG-to-Asset Generation System
 * Generates all required iOS, Android, and web assets from brand logo SVGs
 */

// Asset configuration for all platforms and formats
const ASSET_CONFIGS = {
  ios: {
    appIcons: [
      {
        size: 1024,
        filename: "App-Icon-1024x1024@1x.png",
        noAlpha: true,
        description: "App Store",
      },
      {
        size: 180,
        filename: "App-Icon-180x180@1x.png",
        description: "iPhone Large (6s Plus+)",
      },
      {
        size: 120,
        filename: "App-Icon-120x120@1x.png",
        description: "iPhone Standard",
      },
      {
        size: 167,
        filename: "App-Icon-167x167@1x.png",
        description: 'iPad Pro 12.9"',
      },
      { size: 152, filename: "App-Icon-152x152@1x.png", description: "iPad" },
      {
        size: 76,
        filename: "App-Icon-76x76@1x.png",
        description: "iPad Legacy",
      },
    ],
    splashLogos: [
      {
        size: 200,
        scale: 1,
        filename: "image.png",
        description: "Splash Logo 1x",
      },
      {
        size: 400,
        scale: 2,
        filename: "image@2x.png",
        description: "Splash Logo 2x",
      },
      {
        size: 600,
        scale: 3,
        filename: "image@3x.png",
        description: "Splash Logo 3x",
      },
    ],
  },
  android: {
    playStoreIcon: {
      size: 512,
      filename: "icon-512.png",
      description: "Google Play Store Icon",
    },
    mipmaps: {
      mdpi: { size: 48, density: "mdpi", description: "Medium density" },
      hdpi: { size: 72, density: "hdpi", description: "High density" },
      xhdpi: { size: 96, density: "xhdpi", description: "Extra high density" },
      xxhdpi: {
        size: 144,
        density: "xxhdpi",
        description: "Extra extra high density",
      },
      xxxhdpi: {
        size: 192,
        density: "xxxhdpi",
        description: "Extra extra extra high density",
      },
    },
    drawables: {
      mdpi: {
        size: 200,
        density: "mdpi",
        description: "Splash medium density",
      },
      hdpi: { size: 300, density: "hdpi", description: "Splash high density" },
      xhdpi: {
        size: 400,
        density: "xhdpi",
        description: "Splash extra high density",
      },
      xxhdpi: {
        size: 600,
        density: "xxhdpi",
        description: "Splash extra extra high density",
      },
      xxxhdpi: {
        size: 800,
        density: "xxxhdpi",
        description: "Splash extra extra extra high density",
      },
    },
  },
  expo: {
    favicon: { size: 32, filename: "favicon.png", description: "Web favicon" },
    icon: { size: 512, filename: "icon.png", description: "Main app icon" },
    adaptiveIcon: {
      size: 512,
      filename: "adaptive-icon.png",
      description: "Android adaptive icon",
    },
    splashIcon: {
      size: 200,
      filename: "splash-icon.png",
      description: "Splash screen icon",
    },
  },
};

// Asset type configurations for different use cases
const ASSET_TYPES = {
  appIcon: {
    padding: 10, // Optimal padding for better logo spacing
    backgroundColor: "transparent",
    removeAlpha: false, // Will be overridden per asset if needed
  },
  splashIcon: {
    padding: 20,
    backgroundColor: "transparent",
    removeAlpha: false,
  },
  adaptiveIcon: {
    padding: 25, // Adjusted padding for Android adaptive icons
    backgroundColor: "transparent",
    removeAlpha: false,
  },
};

class AssetGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate all assets for a specific brand
   */
  async generateBrandAssets(brand, brandConfig) {
    console.log(`🎨 Generating assets for brand: ${brandConfig.displayName}`);

    const logoPath = path.join(this.projectRoot, "brands", brand, "logo.svg");

    if (!fs.existsSync(logoPath)) {
      throw new Error(`Logo SVG not found: ${logoPath}`);
    }

    // Create output directories
    await this.createOutputDirectories(brand);

    // Generate all asset types
    const results = {
      ios: await this.generateIOSAssets(logoPath, brand, brandConfig),
      android: await this.generateAndroidAssets(logoPath, brand, brandConfig),
      expo: await this.generateExpoAssets(logoPath, brand, brandConfig),
    };

    // Update iOS AppIcon Contents.json
    await this.updateIOSAppIconContents(brand);

    console.log(
      `✅ Generated ${this.getTotalAssetCount(results)} assets for ${
        brandConfig.displayName
      }`
    );
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

      // Android directories
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "mipmap-mdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "mipmap-hdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "mipmap-xhdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "mipmap-xxhdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "mipmap-xxxhdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "drawable-mdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "drawable-hdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "drawable-xhdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "drawable-xxhdpi"
      ),
      path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "drawable-xxxhdpi"
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
   * Generate iOS app icons and splash logos
   */
  async generateIOSAssets(logoPath, brand, brandConfig) {
    const results = { appIcons: [], splashLogos: [] };

    // Generate App Icons
    console.log(`📱 Generating iOS app icons...`);
    for (const iconConfig of ASSET_CONFIGS.ios.appIcons) {
      const outputPath = path.join(
        this.projectRoot,
        "ios",
        "emap",
        "Images.xcassets",
        "AppIcon.appiconset",
        iconConfig.filename
      );

      await this.generateAsset(logoPath, outputPath, {
        size: iconConfig.size,
        type: "appIcon",
        removeAlpha: iconConfig.noAlpha || false,
        brandConfig,
      });

      results.appIcons.push({
        size: iconConfig.size,
        filename: iconConfig.filename,
        description: iconConfig.description,
        path: outputPath,
      });

      console.log(
        `  ✅ ${iconConfig.description}: ${iconConfig.size}×${iconConfig.size}`
      );
    }

    // Generate Splash Screen Logos
    console.log(`🖼️  Generating iOS splash screen logos...`);
    for (const splashConfig of ASSET_CONFIGS.ios.splashLogos) {
      const outputPath = path.join(
        this.projectRoot,
        "ios",
        "emap",
        "Images.xcassets",
        "SplashScreenLogo.imageset",
        splashConfig.filename
      );

      await this.generateAsset(logoPath, outputPath, {
        size: splashConfig.size,
        type: "splashIcon",
        brandConfig,
      });

      results.splashLogos.push({
        size: splashConfig.size,
        scale: splashConfig.scale,
        filename: splashConfig.filename,
        description: splashConfig.description,
        path: outputPath,
      });

      console.log(
        `  ✅ ${splashConfig.description}: ${splashConfig.size}×${splashConfig.size}`
      );
    }

    return results;
  }

  /**
   * Generate Android icons and splash screens
   */
  async generateAndroidAssets(logoPath, brand, brandConfig) {
    const results = { playStoreIcon: null, mipmaps: [], drawables: [] };

    // Generate Play Store Icon (stored in brand assets)
    console.log(`🤖 Generating Android Play Store icon...`);
    const playStoreConfig = ASSET_CONFIGS.android.playStoreIcon;
    const playStoreOutputPath = path.join(
      this.projectRoot,
      "brands",
      brand,
      "assets",
      playStoreConfig.filename
    );

    await this.generateAsset(logoPath, playStoreOutputPath, {
      size: playStoreConfig.size,
      type: "appIcon",
      brandConfig,
    });

    results.playStoreIcon = {
      size: playStoreConfig.size,
      filename: playStoreConfig.filename,
      description: playStoreConfig.description,
      path: playStoreOutputPath,
    };

    console.log(
      `  ✅ ${playStoreConfig.description}: ${playStoreConfig.size}×${playStoreConfig.size}`
    );

    // Generate Mipmap Icons
    console.log(`📐 Generating Android mipmap icons...`);
    for (const [densityKey, mipmapConfig] of Object.entries(
      ASSET_CONFIGS.android.mipmaps
    )) {
      const outputPath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        `mipmap-${mipmapConfig.density}`,
        "ic_launcher_foreground.webp"
      );

      await this.generateAsset(logoPath, outputPath, {
        size: mipmapConfig.size,
        type: "adaptiveIcon",
        brandConfig,
        format: "webp",
      });

      results.mipmaps.push({
        density: mipmapConfig.density,
        size: mipmapConfig.size,
        description: mipmapConfig.description,
        path: outputPath,
      });

      console.log(
        `  ✅ ${mipmapConfig.description} (${mipmapConfig.density}): ${mipmapConfig.size}×${mipmapConfig.size}`
      );
    }

    // Generate Drawable Splash Screens
    console.log(`🎭 Generating Android drawable splash screens...`);
    for (const [densityKey, drawableConfig] of Object.entries(
      ASSET_CONFIGS.android.drawables
    )) {
      const outputPath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        `drawable-${drawableConfig.density}`,
        "splashscreen_logo.png"
      );

      await this.generateAsset(logoPath, outputPath, {
        size: drawableConfig.size,
        type: "splashIcon",
        brandConfig,
      });

      results.drawables.push({
        density: drawableConfig.density,
        size: drawableConfig.size,
        description: drawableConfig.description,
        path: outputPath,
      });

      console.log(
        `  ✅ ${drawableConfig.description} (${drawableConfig.density}): ${drawableConfig.size}×${drawableConfig.size}`
      );
    }

    return results;
  }

  /**
   * Generate Expo/Web assets
   */
  async generateExpoAssets(logoPath, brand, brandConfig) {
    const results = {};

    console.log(`🌐 Generating Expo/Web assets...`);

    for (const [assetKey, assetConfig] of Object.entries(ASSET_CONFIGS.expo)) {
      // Generate to brand assets directory
      const brandOutputPath = path.join(
        this.projectRoot,
        "brands",
        brand,
        "assets",
        assetConfig.filename
      );

      // Also generate to main assets directory for immediate use
      const mainOutputPath = path.join(
        this.projectRoot,
        "assets",
        "images",
        assetConfig.filename
      );

      const assetType =
        assetKey === "adaptiveIcon"
          ? "adaptiveIcon"
          : assetKey === "splashIcon"
          ? "splashIcon"
          : "appIcon";

      await this.generateAsset(logoPath, brandOutputPath, {
        size: assetConfig.size,
        type: assetType,
        brandConfig,
      });

      // Copy to main assets directory
      fs.copyFileSync(brandOutputPath, mainOutputPath);

      results[assetKey] = {
        size: assetConfig.size,
        filename: assetConfig.filename,
        description: assetConfig.description,
        brandPath: brandOutputPath,
        mainPath: mainOutputPath,
      };

      console.log(
        `  ✅ ${assetConfig.description}: ${assetConfig.size}×${assetConfig.size}`
      );
    }

    return results;
  }

  /**
   * Generate a single asset from SVG
   */
  async generateAsset(svgPath, outputPath, options) {
    const {
      size,
      type = "appIcon",
      removeAlpha = false,
      brandConfig,
      format = "png",
    } = options;

    const typeConfig = ASSET_TYPES[type] || ASSET_TYPES.appIcon;

    // Get brand-specific background color
    const backgroundColorHex = brandConfig?.branding?.iconBackgroundColor;
    const hasCustomBackground =
      backgroundColorHex && backgroundColorHex !== "transparent";
    const backgroundColor = hasCustomBackground
      ? this.hexToRgb(backgroundColorHex)
      : { r: 0, g: 0, b: 0, alpha: 0 };

    try {
      // Use brand background color from the start if available
      const initialBackground = hasCustomBackground
        ? backgroundColor
        : { r: 0, g: 0, b: 0, alpha: 0 };

      let sharpInstance = sharp(svgPath).resize(size, size, {
        fit: "contain",
        background: initialBackground,
      });

      // Apply padding if specified
      if (typeConfig.padding > 0) {
        const paddedSize = size - typeConfig.padding * 2;

        // Ensure paddedSize is positive and reasonable
        if (paddedSize > 10) {
          sharpInstance = sharpInstance
            .resize(paddedSize, paddedSize, {
              fit: "contain",
              background: initialBackground,
            })
            .extend({
              top: typeConfig.padding,
              bottom: typeConfig.padding,
              left: typeConfig.padding,
              right: typeConfig.padding,
              background: initialBackground,
            });
        } else {
          // If padding would make size too small, use percentage-based padding
          const paddingPercent = Math.min(0.15, typeConfig.padding / size); // Max 15% padding
          const actualPadding = Math.floor(size * paddingPercent);
          const actualPaddedSize = size - actualPadding * 2;

          if (actualPaddedSize > 10) {
            sharpInstance = sharpInstance
              .resize(actualPaddedSize, actualPaddedSize, {
                fit: "contain",
                background: initialBackground,
              })
              .extend({
                top: actualPadding,
                bottom: actualPadding,
                left: actualPadding,
                right: actualPadding,
                background: initialBackground,
              });
          }
          // If still too small, skip padding entirely
        }
      }

      // Only apply flatten if we need to remove alpha channel or ensure solid background
      if (
        hasCustomBackground &&
        (type === "appIcon" || type === "splashIcon" || type === "adaptiveIcon")
      ) {
        // Flatten to ensure solid background (removes any remaining transparency)
        sharpInstance = sharpInstance.flatten({ background: backgroundColor });
      }

      // Remove alpha channel if required (App Store icons)
      if (removeAlpha) {
        sharpInstance = sharpInstance.flatten({
          background: { r: 255, g: 255, b: 255 },
        });
      }

      // Set output format
      if (format === "webp") {
        sharpInstance = sharpInstance.webp({ quality: 90 });
      } else {
        sharpInstance = sharpInstance.png({ quality: 90 });
      }

      await sharpInstance.toFile(outputPath);

      // Validate the generated asset
      await this.validateAsset(outputPath, size, format);
    } catch (error) {
      throw new Error(
        `Failed to generate asset ${outputPath}: ${error.message}`
      );
    }
  }

  /**
   * Update iOS AppIcon Contents.json with all generated icons
   */
  async updateIOSAppIconContents(brand) {
    const contentsPath = path.join(
      this.projectRoot,
      "ios",
      "emap",
      "Images.xcassets",
      "AppIcon.appiconset",
      "Contents.json"
    );

    const contents = {
      images: [
        {
          filename: "App-Icon-1024x1024@1x.png",
          idiom: "universal",
          platform: "ios",
          size: "1024x1024",
        },
        {
          filename: "App-Icon-180x180@1x.png",
          idiom: "iphone",
          scale: "3x",
          size: "60x60",
        },
        {
          filename: "App-Icon-120x120@1x.png",
          idiom: "iphone",
          scale: "2x",
          size: "60x60",
        },
        {
          filename: "App-Icon-167x167@1x.png",
          idiom: "ipad",
          scale: "2x",
          size: "83.5x83.5",
        },
        {
          filename: "App-Icon-152x152@1x.png",
          idiom: "ipad",
          scale: "2x",
          size: "76x76",
        },
        {
          filename: "App-Icon-76x76@1x.png",
          idiom: "ipad",
          scale: "1x",
          size: "76x76",
        },
      ],
      info: {
        author: "expo",
        version: 1,
      },
    };

    fs.writeFileSync(contentsPath, JSON.stringify(contents, null, 2));
    console.log(`✅ Updated iOS AppIcon Contents.json`);
  }

  /**
   * Validate generated asset
   */
  async validateAsset(assetPath, expectedSize, format = "png") {
    try {
      const metadata = await sharp(assetPath).metadata();

      if (metadata.width !== expectedSize || metadata.height !== expectedSize) {
        throw new Error(
          `Size mismatch: expected ${expectedSize}x${expectedSize}, got ${metadata.width}x${metadata.height}`
        );
      }

      if (format === "png" && metadata.format !== "png") {
        throw new Error(
          `Format mismatch: expected PNG, got ${metadata.format}`
        );
      }

      if (format === "webp" && metadata.format !== "webp") {
        throw new Error(
          `Format mismatch: expected WebP, got ${metadata.format}`
        );
      }

      return true;
    } catch (error) {
      throw new Error(
        `Asset validation failed for ${assetPath}: ${error.message}`
      );
    }
  }

  /**
   * Convert hex color to RGB object
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  }

  /**
   * Get total count of generated assets
   */
  getTotalAssetCount(results) {
    let count = 0;
    if (results.ios) {
      count += results.ios.appIcons.length + results.ios.splashLogos.length;
    }
    if (results.android) {
      count +=
        1 + results.android.mipmaps.length + results.android.drawables.length; // +1 for Play Store icon
    }
    if (results.expo) {
      count += Object.keys(results.expo).length;
    }
    return count;
  }

  /**
   * Clean old assets before generating new ones
   */
  async cleanOldAssets(brand) {
    console.log(`🧹 Cleaning old assets for brand: ${brand}`);

    const pathsToClean = [
      // iOS AppIcon assets
      path.join(
        this.projectRoot,
        "ios",
        "emap",
        "Images.xcassets",
        "AppIcon.appiconset"
      ),
      // iOS SplashScreen assets
      path.join(
        this.projectRoot,
        "ios",
        "emap",
        "Images.xcassets",
        "SplashScreenLogo.imageset"
      ),
      // Brand assets
      path.join(this.projectRoot, "brands", brand, "assets"),
    ];

    for (const cleanPath of pathsToClean) {
      if (fs.existsSync(cleanPath)) {
        const files = fs.readdirSync(cleanPath);
        for (const file of files) {
          if (file.endsWith(".png") || file.endsWith(".webp")) {
            const filePath = path.join(cleanPath, file);
            fs.unlinkSync(filePath);
          }
        }
      }
    }

    // Clean Android mipmap and drawable assets
    const androidDensities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
    for (const density of androidDensities) {
      // Clean mipmaps
      const mipmapPath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        `mipmap-${density}`
      );
      if (fs.existsSync(mipmapPath)) {
        const mipmapFiles = [
          "ic_launcher_foreground.webp",
          "ic_launcher.webp",
          "ic_launcher_round.webp",
        ];
        for (const file of mipmapFiles) {
          const filePath = path.join(mipmapPath, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      // Clean drawables
      const drawablePath = path.join(
        this.projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        `drawable-${density}`
      );
      if (fs.existsSync(drawablePath)) {
        const splashFile = path.join(drawablePath, "splashscreen_logo.png");
        if (fs.existsSync(splashFile)) {
          fs.unlinkSync(splashFile);
        }
      }
    }

    console.log(`✅ Cleaned old assets`);
  }
}

module.exports = AssetGenerator;

// CLI usage
if (require.main === module) {
  const brand = process.argv[2];
  const projectRoot = process.cwd();

  if (!brand) {
    console.error("❌ Brand parameter is required");
    console.error("Usage: node scripts/assetGenerator.js <brand>");
    process.exit(1);
  }

  const generator = new AssetGenerator(projectRoot);

  // Load brand configuration
  const brandConfigPath = path.join(
    projectRoot,
    "brands",
    brand,
    "config.json"
  );
  if (!fs.existsSync(brandConfigPath)) {
    console.error(`❌ Brand configuration not found: ${brandConfigPath}`);
    process.exit(1);
  }

  const brandConfig = JSON.parse(fs.readFileSync(brandConfigPath, "utf8"));

  generator
    .cleanOldAssets(brand)
    .then(() => generator.generateBrandAssets(brand, brandConfig))
    .then((results) => {
      console.log(`🎉 Asset generation completed successfully!`);
      console.log(
        `📊 Generated ${generator.getTotalAssetCount(results)} total assets`
      );
    })
    .catch((error) => {
      console.error(`❌ Asset generation failed: ${error.message}`);
      process.exit(1);
    });
}
