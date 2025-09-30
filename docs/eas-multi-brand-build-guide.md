# EAS Multi-Brand Build Configuration Guide

This guide explains how to build brand-specific versions of the EMAP app using EAS Build.

## Overview

The EAS build system has been configured to support multi-brand deployment for:

- **Construction News** (brand: `cn`)
- **Nursing Times** (brand: `nt`)

Each brand has its own bundle identifier, assets, and configuration.

## Bundle Identifiers

### iOS Bundle Identifiers

- **Construction News**: `metropolis.co.uk.constructionnews`
- **Nursing Times**: `metropolis.net.nursingtimes`

### Android Package Names

- **Construction News**: `metropolis.co.uk.constructionnews`
- **Nursing Times**: `metropolis.net.nursingtimes`

## Build Commands

### Construction News Builds

```bash
# iOS Production Build
EXPO_PUBLIC_BRAND=cn eas build --platform ios --profile production-cn

# Android Production Build
EXPO_PUBLIC_BRAND=cn eas build --platform android --profile production-cn

# Both Platforms
EXPO_PUBLIC_BRAND=cn eas build --platform all --profile production-cn
```

### Nursing Times Builds

```bash
# iOS Production Build
EXPO_PUBLIC_BRAND=nt eas build --platform ios --profile production-nt

# Android Production Build
EXPO_PUBLIC_BRAND=nt eas build --platform android --profile production-nt

# Both Platforms
EXPO_PUBLIC_BRAND=nt eas build --platform all --profile production-nt
```

## Configuration Files

### EAS Configuration (`eas.json`)

- Contains brand-specific build profiles
- Sets environment variables for each brand
- Configures bundle identifiers
- Runs prebuild scripts automatically

### Environment Files

- `.env.cn` - Construction News environment variables
- `.env.nt` - Nursing Times environment variables
- `.env.example` - Template with all available variables

### Prebuild Script (`scripts/prebuild.js`)

- Automatically runs before each build
- Copies brand-specific assets
- Updates `app.json` with brand configuration
- Sets correct bundle identifiers

## Build Process Flow

1. **EAS Build Starts** - User runs build command with brand environment variable
2. **Prebuild Script Executes** - `node scripts/prebuild.js <brand>`
   - Loads brand configuration from `brands/<brand>/config.json`
   - Loads environment variables from `.env.<brand>`
   - Updates `app.json` with brand-specific settings
   - Copies brand assets to main assets directory
3. **Expo Prebuild** - Generates native code with brand configuration
4. **Native Build** - Compiles iOS/Android app with correct bundle ID and assets

## Brand-Specific Assets

Each brand has its own asset directory:

```
brands/
├── cn/
│   ├── config.json
│   ├── logo.svg
│   └── assets/
│       ├── icon.png
│       ├── adaptive-icon.png
│       ├── favicon.png
│       ├── splash-icon.png
│       └── ...
└── nt/
    ├── config.json
    ├── logo.svg
    └── assets/
        ├── icon.png
        ├── adaptive-icon.png
        ├── favicon.png
        ├── splash-icon.png
        └── ...
```

## Environment Variables

Key environment variables set during build:

```bash
# Brand identification
EXPO_PUBLIC_BRAND=cn|nt

# Brand details
EXPO_PUBLIC_BRAND_NAME=Construction News|Nursing Times
EXPO_PUBLIC_BRAND_DISPLAY_NAME=Construction News|Nursing Times
EXPO_PUBLIC_BRAND_DOMAIN=https://www.constructionnews.co.uk/|nursingtimes.net

# API configuration
EXPO_PUBLIC_API_BASE_URL=<brand-specific-api-url>
EXPO_PUBLIC_API_HASH=<brand-specific-hash>
EXPO_PUBLIC_API_MENU_ID=<brand-specific-menu-id>

# Theme colors (light/dark mode)
EXPO_PUBLIC_PRIMARY_COLOR_LIGHT=<brand-color>
EXPO_PUBLIC_PRIMARY_COLOR_DARK=<brand-color>
# ... additional color variables

# Feature flags
EXPO_PUBLIC_ENABLE_PODCASTS=true|false
EXPO_PUBLIC_ENABLE_PAPER=true|false
EXPO_PUBLIC_ENABLE_CLINICAL=true|false
EXPO_PUBLIC_ENABLE_EVENTS=true|false
EXPO_PUBLIC_ENABLE_ASK=true|false

# Bundle configuration
EXPO_PUBLIC_BUNDLE_ID=<brand-bundle-id>
```

## Testing the Configuration

Test the prebuild script locally:

```bash
# Test Construction News configuration
node scripts/prebuild.js cn

# Test Nursing Times configuration
node scripts/prebuild.js nt
```

## Troubleshooting

### Common Issues

1. **Bundle ID Conflicts**: Ensure each brand has unique bundle identifiers
2. **Asset Missing**: Check that all required assets exist in `brands/<brand>/assets/`
3. **Environment Variables**: Verify `.env.<brand>` files contain all required variables
4. **Prebuild Failures**: Check script permissions with `chmod +x scripts/prebuild.js`

### Verification Steps

1. Run prebuild script manually to check for errors
2. Verify `app.json` is updated correctly after prebuild
3. Check that brand assets are copied to main assets directory
4. Confirm environment variables are loaded correctly

## Adding New Brands

To add a new brand:

1. Create brand directory: `brands/<new-brand>/`
2. Add brand configuration: `brands/<new-brand>/config.json`
3. Add brand assets: `brands/<new-brand>/assets/`
4. Create environment file: `.env.<new-brand>`
5. Update `eas.json` with new build profiles
6. Update prebuild script if needed
7. Test configuration with `node scripts/prebuild.js <new-brand>`

## App Store Deployment

Each brand will be deployed as a separate app:

### Construction News

- **iOS**: App Store with bundle ID `metropolis.co.uk.constructionnews`
- **Android**: Google Play with package `metropolis.co.uk.constructionnews`

### Nursing Times

- **iOS**: App Store with bundle ID `metropolis.net.nursingtimes`
- **Android**: Google Play with package `metropolis.net.nursingtimes`

## Security Notes

- Environment files contain sensitive API keys and hashes
- Ensure `.env.*` files are properly gitignored in production
- Bundle identifiers must match App Store/Play Store configurations
- Test builds thoroughly before production deployment
