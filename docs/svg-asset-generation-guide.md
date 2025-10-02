# SVG-Based Asset Generation System

## Overview

The SVG-based asset generation system automatically creates all required app icons and splash screens for iOS, Android, and web platforms from a single brand logo SVG file. This system is fully integrated into the multi-brand prebuild process and generates **24 assets per brand** covering all platform requirements.

## Features

- ✅ **Complete iOS Support**: 6 app icon sizes + 3 splash logo scales
- ✅ **Complete Android Support**: Play Store icon + 5 mipmap densities + 5 drawable densities
- ✅ **Web/Expo Support**: favicon, main icon, adaptive icon, splash icon
- ✅ **Automatic Integration**: Seamlessly integrated into existing prebuild workflow
- ✅ **Quality Validation**: Automatic size and format validation
- ✅ **Smart Padding**: Adaptive padding system for different asset types
- ✅ **Brand Consistency**: Single source of truth from SVG logo
- ✅ **Error Handling**: Graceful fallback to existing PNG assets

## Generated Assets

### iOS Assets (9 total)

#### App Icons (6 sizes)

- **1024×1024** - App Store (PNG, no alpha)
- **180×180** - iPhone Large (6s Plus and newer large phones)
- **120×120** - iPhone Standard (6s and standard phones)
- **167×167** - iPad Pro (12.9" 2nd gen and later)
- **152×152** - iPad (iPad, iPad 2, iPad mini)
- **76×76** - iPad Legacy (iPad, iPad 2, iPad mini)

#### Splash Screen Logos (3 scales)

- **200×200** - 1x scale
- **400×400** - 2x scale
- **600×600** - 3x scale

### Android Assets (11 total)

#### Play Store Icon

- **512×512** - Google Play Store listing

#### Mipmap Icons (5 densities)

- **48×48** - mdpi (medium density)
- **72×72** - hdpi (high density)
- **96×96** - xhdpi (extra high density)
- **144×144** - xxhdpi (extra extra high density)
- **192×192** - xxxhdpi (extra extra extra high density)

#### Drawable Splash Screens (5 densities)

- **200×200** - mdpi (medium density)
- **300×300** - hdpi (high density)
- **400×400** - xhdpi (extra high density)
- **600×600** - xxhdpi (extra extra high density)
- **800×800** - xxxhdpi (extra extra extra high density)

### Web/Expo Assets (4 total)

- **32×32** - Web favicon
- **512×512** - Main app icon
- **512×512** - Android adaptive icon
- **200×200** - Splash screen icon

## Usage

### Integrated with Prebuild (Recommended)

The asset generation is automatically triggered during the prebuild process:

```bash
# Generate assets for Construction News
node scripts/prebuild.js cn

# Generate assets for Nursing Times
node scripts/prebuild.js nt
```

### Standalone Asset Generation

You can also generate assets independently:

```bash
# Generate assets for a specific brand
node scripts/assetGenerator.js cn
node scripts/assetGenerator.js nt
```

## File Structure

### Input Files

```
brands/
├── cn/
│   ├── logo.svg          # Construction News logo
│   └── config.json       # Brand configuration
└── nt/
    ├── logo.svg          # Nursing Times logo
    └── config.json       # Brand configuration
```

### Generated Output Files

#### iOS Assets

```
ios/emap/Images.xcassets/
├── AppIcon.appiconset/
│   ├── App-Icon-1024x1024@1x.png
│   ├── App-Icon-180x180@1x.png
│   ├── App-Icon-120x120@1x.png
│   ├── App-Icon-167x167@1x.png
│   ├── App-Icon-152x152@1x.png
│   ├── App-Icon-76x76@1x.png
│   └── Contents.json     # Auto-updated
└── SplashScreenLogo.imageset/
    ├── image.png         # 1x
    ├── image@2x.png      # 2x
    └── image@3x.png      # 3x
```

#### Android Assets

```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher_foreground.webp
├── mipmap-hdpi/ic_launcher_foreground.webp
├── mipmap-xhdpi/ic_launcher_foreground.webp
├── mipmap-xxhdpi/ic_launcher_foreground.webp
├── mipmap-xxxhdpi/ic_launcher_foreground.webp
├── drawable-mdpi/splashscreen_logo.png
├── drawable-hdpi/splashscreen_logo.png
├── drawable-xhdpi/splashscreen_logo.png
├── drawable-xxhdpi/splashscreen_logo.png
└── drawable-xxxhdpi/splashscreen_logo.png
```

#### Brand Assets

```
brands/{brand}/assets/
├── icon-512.png          # Play Store icon
├── favicon.png           # Web favicon
├── icon.png              # Main app icon
├── adaptive-icon.png     # Adaptive icon
└── splash-icon.png       # Splash screen icon
```

#### Main Assets (Copied for immediate use)

```
assets/images/
├── favicon.png
├── icon.png
├── adaptive-icon.png
└── splash-icon.png
```

## Technical Implementation

### Core Technology

- **Sharp.js**: High-performance SVG-to-PNG conversion
- **Node.js**: Server-side processing
- **Automatic validation**: Size and format verification

### Asset Types and Configurations

#### App Icons

- **Padding**: None (0px)
- **Background**: Transparent
- **Alpha Channel**: Removed for App Store icons (1024×1024)

#### Splash Icons

- **Padding**: 20px
- **Background**: Transparent
- **Alpha Channel**: Preserved

#### Adaptive Icons

- **Padding**: Smart padding (25px or 15% of size, whichever is smaller)
- **Background**: Transparent
- **Alpha Channel**: Preserved
- **Format**: WebP for Android mipmaps

### Smart Padding System

The system uses intelligent padding calculations to ensure assets look good at all sizes:

```javascript
// For small sizes (like 48px), use percentage-based padding
if (paddedSize <= 10) {
  const paddingPercent = Math.min(0.15, typeConfig.padding / size);
  const actualPadding = Math.floor(size * paddingPercent);
}
```

## Quality Assurance

### Automatic Validation

- ✅ Correct dimensions for each asset
- ✅ Proper file formats (PNG/WebP)
- ✅ Alpha channel handling
- ✅ File size verification

### Error Handling

- **Graceful Fallback**: If SVG generation fails, continues with existing PNG assets
- **Detailed Logging**: Clear success/error messages for each asset
- **Validation Checks**: Ensures all generated assets meet platform requirements

## Brand Integration

### Brand Configuration Support

The system reads brand-specific settings from `config.json`:

```json
{
  "theme": {
    "colors": {
      "light": {
        "primary": "#FFDD00" // Used for potential background colors
      }
    }
  }
}
```

### Brand-Specific Output

Each brand generates assets in its own directory structure, ensuring complete isolation and preventing cross-brand contamination.

## Performance

### Generation Speed

- **24 assets per brand** generated in ~2-3 seconds
- **Parallel processing** for multiple asset sizes
- **Efficient memory usage** with Sharp.js

### Build Integration

- **Zero cache invalidation**: Assets generated fresh each time
- **No build slowdown**: Runs in parallel with other prebuild tasks
- **Fallback safety**: Never blocks the build process

## Maintenance

### Adding New Asset Sizes

To add new asset requirements, update the `ASSET_CONFIGS` object in `scripts/assetGenerator.js`:

```javascript
const ASSET_CONFIGS = {
  ios: {
    appIcons: [
      // Add new size here
      {
        size: 87,
        filename: "App-Icon-87x87@1x.png",
        description: "New requirement",
      },
    ],
  },
};
```

### Modifying Asset Types

Asset behavior is controlled by the `ASSET_TYPES` configuration:

```javascript
const ASSET_TYPES = {
  newAssetType: {
    padding: 10,
    backgroundColor: "transparent",
    removeAlpha: false,
  },
};
```

## Troubleshooting

### Common Issues

#### SVG Not Found

```
❌ Logo SVG not found: /path/to/logo.svg
```

**Solution**: Ensure `logo.svg` exists in the brand directory

#### Invalid SVG Format

```
❌ Failed to generate asset: Input file is missing
```

**Solution**: Verify SVG file is valid and not corrupted

#### Permission Issues

```
❌ EACCES: permission denied
```

**Solution**: Check file/directory permissions

### Debug Mode

Run with verbose logging:

```bash
DEBUG=1 node scripts/assetGenerator.js cn
```

## Future Enhancements

### Planned Features

- [ ] **Custom background colors** per asset type
- [ ] **SVG optimization** before processing
- [ ] **Batch processing** for multiple brands
- [ ] **Asset preview generation** for verification
- [ ] **Custom padding per brand** configuration

### Extensibility

The system is designed to be easily extensible:

- Add new platforms (Windows, macOS, etc.)
- Support additional image formats
- Integrate with design systems
- Add automated testing

## Dependencies

### Required Packages

```json
{
  "sharp": "^0.33.0" // High-performance image processing
}
```

### Installation

```bash
npm install sharp --save-dev
```

## Conclusion

The SVG-based asset generation system provides a robust, automated solution for maintaining consistent brand assets across all platforms. By generating **24 high-quality assets** from a single SVG source, it eliminates manual asset creation, reduces errors, and ensures perfect brand consistency.

The system's integration with the existing prebuild workflow makes brand switching seamless while maintaining the highest quality standards for app store submissions.
