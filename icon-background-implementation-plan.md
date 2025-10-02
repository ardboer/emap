# Icon Background Color Implementation Plan

## Overview

Implement brand-specific background colors for app icons and splash screen icons:

- **NT (Nursing Times)**: `#00334c` background
- **CN (Construction News)**: `#000000` (black) background

## Implementation Steps

### 1. Update Brand Configuration Files

#### NT Brand Config (`brands/nt/config.json`)

Add `iconBackgroundColor` property to the branding section:

```json
{
  "branding": {
    "logo": "./logo.svg",
    "icon": "./assets/icon.png",
    "splash": "./assets/splash.png",
    "iconBackgroundColor": "#00334c"
  }
}
```

#### CN Brand Config (`brands/cn/config.json`)

Add `iconBackgroundColor` property to the branding section:

```json
{
  "branding": {
    "logo": "./logo.svg",
    "icon": "./assets/icon.png",
    "splash": "./assets/splash.png",
    "iconBackgroundColor": "#000000"
  }
}
```

### 2. Update TypeScript Interface

#### Update `brands/index.ts`

Add `iconBackgroundColor` to the `BrandConfig` interface:

```typescript
export interface BrandConfig {
  // ... existing properties
  branding: {
    logo: string;
    icon: string;
    splash: string;
    iconBackgroundColor?: string; // New optional property
  };
  // ... rest of interface
}
```

### 3. Modify Asset Generator

#### Update `scripts/assetGenerator.js`

##### 3.1 Update ASSET_TYPES Configuration

Modify the asset type configurations to support brand-specific backgrounds:

```javascript
const ASSET_TYPES = {
  appIcon: {
    padding: 0,
    backgroundColor: "brand", // Changed from "transparent"
    removeAlpha: false,
  },
  splashIcon: {
    padding: 20,
    backgroundColor: "brand", // Changed from "transparent"
    removeAlpha: false,
  },
  adaptiveIcon: {
    padding: 25,
    backgroundColor: "brand", // Changed from "transparent"
    removeAlpha: false,
  },
};
```

##### 3.2 Update generateAsset Method

Modify the `generateAsset` method to apply brand-specific background colors:

1. **Extract background color from brand config**:

   ```javascript
   const backgroundColorHex =
     brandConfig?.branding?.iconBackgroundColor || "transparent";
   const backgroundColor =
     backgroundColorHex === "transparent"
       ? { r: 0, g: 0, b: 0, alpha: 0 }
       : this.hexToRgb(backgroundColorHex);
   ```

2. **Apply background for app icons**:

   ```javascript
   if (type === "appIcon" && backgroundColorHex !== "transparent") {
     sharpInstance = sharpInstance.flatten({ background: backgroundColor });
   }
   ```

3. **Apply background for splash icons**:

   ```javascript
   if (type === "splashIcon" && backgroundColorHex !== "transparent") {
     sharpInstance = sharpInstance.flatten({ background: backgroundColor });
   }
   ```

4. **Apply background for adaptive icons**:
   ```javascript
   if (type === "adaptiveIcon" && backgroundColorHex !== "transparent") {
     sharpInstance = sharpInstance.flatten({ background: backgroundColor });
   }
   ```

##### 3.3 Update hexToRgb Method

Ensure the `hexToRgb` method handles the new colors correctly:

```javascript
hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 }; // Default to white if parsing fails
}
```

### 4. Implementation Details

#### Background Application Strategy

1. **For App Icons**: Apply solid background color behind the logo
2. **For Splash Icons**: Apply solid background color behind the logo
3. **For Adaptive Icons**: Apply solid background color behind the logo

#### Color Specifications

- **NT**: `#00334c` (Dark blue-green)
- **CN**: `#000000` (Pure black)

#### Asset Types Affected

- iOS App Icons (all sizes)
- iOS Splash Screen Logos (all scales)
- Android Mipmaps (all densities)
- Android Drawables (all densities)
- Expo/Web Assets (favicon, icon, adaptive-icon, splash-icon)

### 5. Testing Strategy

#### Test Cases

1. **NT Brand Assets**:

   - Verify all app icons have `#00334c` background
   - Verify all splash icons have `#00334c` background
   - Check iOS, Android, and Web assets

2. **CN Brand Assets**:
   - Verify all app icons have `#000000` background
   - Verify all splash icons have `#000000` background
   - Check iOS, Android, and Web assets

#### Testing Commands

```bash
# Test NT brand asset generation
node scripts/prebuild.js nt

# Test CN brand asset generation
node scripts/prebuild.js cn

# Direct asset generator testing
node scripts/assetGenerator.js nt
node scripts/assetGenerator.js cn
```

### 6. Validation

#### Visual Inspection

- Check generated assets in brand directories
- Verify background colors are applied correctly
- Ensure logo visibility on colored backgrounds

#### File Locations to Check

- `brands/nt/assets/` - NT brand assets
- `brands/cn/assets/` - CN brand assets
- `ios/emap/Images.xcassets/AppIcon.appiconset/` - iOS app icons
- `ios/emap/Images.xcassets/SplashScreenLogo.imageset/` - iOS splash logos
- `android/app/src/main/res/mipmap-*/` - Android mipmaps
- `android/app/src/main/res/drawable-*/` - Android drawables

## Implementation Order

1. Update brand configuration files (NT and CN)
2. Update TypeScript interface
3. Modify asset generator logic
4. Test with NT brand
5. Test with CN brand
6. Verify all generated assets

## Notes

- The implementation maintains backward compatibility by making `iconBackgroundColor` optional
- If no `iconBackgroundColor` is specified, assets will use transparent backgrounds (current behavior)
- The prebuild script will automatically use the new background colors when generating assets
- All existing asset generation workflows remain unchanged
