# Modern Icon Generation Guide

## Overview

The modern icon generation system creates complete icon sets for iOS, Android, and web platforms from a single SVG logo file. This system now includes support for:

- ✅ **iOS 18 Dark Mode Icons** - Separate icon variants for dark mode
- ✅ **Android Adaptive Icons** - Complete foreground + background layers with XML configuration
- ✅ **All Platform Icons** - iOS, Android, and web assets
- ✅ **Automatic Fallback** - Falls back to legacy generator if needed

## What Gets Generated

### iOS Icons (24 total)

**Light Mode Icons (12):**

- App Store icon (1024×1024)
- iPhone icons (180×180, 120×120, 60×60, 58×58, 87×87, 80×80, 40×40)
- iPad icons (167×167, 152×152, 76×76, 58×58)

**Dark Mode Icons (12):**

- Same sizes as light mode, with `-dark-` in filename
- Transparency preserved for better dark mode appearance
- Automatically included in Contents.json with appearance tags

### Android Adaptive Icons

**Foreground Layers (5 densities):**

- mdpi: 108×108
- hdpi: 162×162
- xhdpi: 216×216
- xxhdpi: 324×324
- xxxhdpi: 432×432

**Background Layers (5 densities):**

- Same sizes as foreground
- Solid color from brand configuration
- Separate layer for proper adaptive icon support

**XML Configuration:**

- `ic_launcher.xml` - Main adaptive icon configuration
- `ic_launcher_round.xml` - Round adaptive icon configuration
- Both reference foreground and background layers

### Additional Assets

- Play Store icon (512×512)
- Splash screen drawables (5 densities)
- Web favicon (32×32)
- Expo assets (icon, adaptive-icon, splash-icon)

## Usage

### Basic Usage

The icon generator runs automatically during prebuild:

```bash
node scripts/prebuild.js cn
```

This will:

1. Clean old assets
2. Generate all iOS icons (light + dark)
3. Generate all Android adaptive icon layers
4. Create Android XML configuration
5. Generate web/Expo assets
6. Fall back to legacy generator if any errors occur

### Brand Requirements

Each brand must have:

```
brands/
└── cn/
    ├── logo.svg              # Required: Source logo
    └── config.json           # Required: Brand configuration
```

**config.json must include:**

```json
{
  "branding": {
    "iconBackgroundColor": "#ffffff" // Used for adaptive icon backgrounds
  }
}
```

## Generated File Structure

### iOS

```
ios/emap/Images.xcassets/AppIcon.appiconset/
├── App-Icon-1024x1024@1x.png
├── App-Icon-180x180@1x.png
├── ... (10 more light mode icons)
├── App-Icon-dark-1024x1024@1x.png
├── App-Icon-dark-180x180@1x.png
├── ... (10 more dark mode icons)
└── Contents.json  # Includes appearance tags for dark mode
```

### Android

```
android/app/src/main/res/
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml
│   └── ic_launcher_round.xml
├── mipmap-mdpi/
│   ├── ic_launcher_foreground.webp
│   └── ic_launcher_background.webp
├── mipmap-hdpi/
│   ├── ic_launcher_foreground.webp
│   └── ic_launcher_background.webp
└── ... (3 more density folders)
```

## Technical Details

### Icon Generator (`scripts/iconGenerator.js`)

The new icon generator uses Sharp directly for SVG processing:

**Key Features:**

- Direct SVG to PNG/WebP conversion
- No dependency on @expo/image-utils for SVG
- Proper transparency handling for dark mode
- Separate foreground/background layer generation
- Automatic XML configuration file creation

**Processing Pipeline:**

1. Read SVG from `brands/{brand}/logo.svg`
2. For each icon size:
   - Resize with Sharp
   - Apply appropriate background
   - Convert to PNG or WebP
   - Write to correct location
3. Generate XML configuration files
4. Update Contents.json with metadata

### Legacy Fallback

If the new generator fails, the system automatically falls back to the legacy generator (`scripts/assetGenerator.legacy.js`):

```javascript
try {
  // Try new icon generator
  await iconGenerator.generateAllIcons(brand, brandConfig);
} catch (error) {
  // Fall back to legacy generator
  await assetGeneratorLegacy.generateBrandAssets(brand, brandConfig);
}
```

**Note:** Legacy generator does NOT support:

- iOS dark mode icons
- Android adaptive icon background layers
- Android adaptive icon XML configuration

## iOS Dark Mode Support

### How It Works

iOS 18+ supports different app icons for light and dark appearance modes. The system generates both variants:

**Light Mode Icons:**

- White background for App Store icon
- Transparent background for other sizes
- Standard naming: `App-Icon-{size}.png`

**Dark Mode Icons:**

- Fully transparent backgrounds
- Preserves logo transparency
- Dark mode naming: `App-Icon-dark-{size}.png`

### Contents.json Structure

```json
{
  "images": [
    {
      "filename": "App-Icon-1024x1024@1x.png",
      "idiom": "universal",
      "platform": "ios",
      "size": "1024x1024"
    },
    {
      "appearances": [
        {
          "appearance": "luminosity",
          "value": "dark"
        }
      ],
      "filename": "App-Icon-dark-1024x1024@1x.png",
      "idiom": "universal",
      "platform": "ios",
      "size": "1024x1024"
    }
  ]
}
```

## Android Adaptive Icons

### How They Work

Android adaptive icons consist of two layers:

1. **Foreground Layer** - The logo with transparent background
2. **Background Layer** - Solid color or pattern

The system combines these layers and applies different masks (circle, squircle, rounded square) based on the device launcher.

### XML Configuration

**ic_launcher.xml:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

This configuration:

- References both foreground and background layers
- Allows Android to apply launcher-specific masks
- Enables icon animations and effects

### Safe Zone

Adaptive icons use a 108dp canvas with a 72dp safe zone:

- Full canvas: 108×108dp
- Safe zone: 72×72dp (center)
- Logo should fit within safe zone to avoid clipping

## Troubleshooting

### Icons Not Generating

**Symptom:** No icons created, falls back to legacy generator

**Solutions:**

1. Check that `logo.svg` exists in brand directory
2. Verify Sharp is installed: `npm list sharp`
3. Check SVG file is valid (open in browser/editor)
4. Review console output for specific errors

### Dark Mode Icons Not Showing

**Symptom:** Only light mode icons visible on iOS

**Solutions:**

1. Verify iOS 18+ is being used
2. Check that dark mode icon files exist with `-dark-` prefix
3. Verify Contents.json includes appearance tags
4. Test on actual device in dark mode

### Android Adaptive Icons Not Working

**Symptom:** Icons appear as squares or don't animate

**Solutions:**

1. Verify both foreground AND background layers exist
2. Check XML files exist in `mipmap-anydpi-v26/`
3. Verify XML references correct drawable resources
4. Test on device with different launcher (Pixel, Samsung, etc.)

### Wrong Background Color

**Symptom:** Adaptive icon background is wrong color

**Solutions:**

1. Check `branding.iconBackgroundColor` in brand config
2. Ensure color is valid hex format (e.g., `#FFFFFF`)
3. Verify colors.xml was updated (if using color resource)

## Best Practices

### Logo Design

1. **Vector Graphics** - Use pure SVG, avoid embedded raster images
2. **Safe Zone** - Design logo to fit within 72dp safe zone for adaptive icons
3. **Contrast** - Ensure logo works on both light and dark backgrounds
4. **Simplicity** - Avoid fine details that may not scale well

### Testing

1. **iOS Testing:**

   - Test on iOS 18+ devices
   - Verify both light and dark mode
   - Check all icon sizes in Settings, Spotlight, Home Screen

2. **Android Testing:**

   - Test on multiple launchers (Pixel, Samsung, OnePlus)
   - Verify adaptive icon animations
   - Check icon appears correctly in all shapes

3. **Build Testing:**
   - Always run prebuild after logo changes
   - Verify generated files exist
   - Check file sizes are reasonable

### Version Control

1. Commit generated assets to repository
2. Include both light and dark mode icons
3. Include all adaptive icon layers
4. Commit XML configuration files

## Migration from Legacy Generator

The new icon generator is a drop-in replacement:

1. **No Changes Required** - Existing brands work automatically
2. **Automatic Fallback** - Legacy generator used if new one fails
3. **Enhanced Output** - Gets dark mode and adaptive icons automatically
4. **Same Configuration** - Uses existing brand config

### What's Different

**New Generator:**

- ✅ iOS dark mode icons
- ✅ Android adaptive icon backgrounds
- ✅ Android XML configuration
- ✅ Uses Sharp directly

**Legacy Generator:**

- ❌ No dark mode icons
- ❌ No adaptive icon backgrounds
- ❌ No XML configuration
- ✅ Still available as fallback

## Performance

- **Generation Time:** ~3-5 seconds per brand
- **Total Icons:** 40+ files per brand
- **File Sizes:** Optimized with Sharp compression
- **Memory Usage:** Efficient streaming with Sharp

## Related Documentation

- [Implementation Plan](./icon-generation-implementation-plan.md) - Technical implementation details
- [SVG Asset Generation Guide](./svg-asset-generation-guide.md) - Legacy documentation
- [Brand Configuration Guide](./brand-fonts-guide.md) - Brand setup

## Support

For issues or questions:

1. Check this documentation
2. Review console output during prebuild
3. Verify all requirements are met
4. Check that Sharp is properly installed
