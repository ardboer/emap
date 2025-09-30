# EAS Build Configuration for Multi-Brand Deployment

This document provides the specific EAS Build configurations needed to deploy both Construction News and Nursing Times apps to their respective app stores.

## EAS Configuration Files

### Updated `eas.json`

```json
{
  "cli": {
    "version": ">= 16.9.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production-cn": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_BRAND": "cn"
      },
      "ios": {
        "bundleIdentifier": "com.emappublishing.constructionnews"
      },
      "android": {
        "package": "com.emappublishing.constructionnews"
      }
    },
    "production-nt": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_BRAND": "nt"
      },
      "ios": {
        "bundleIdentifier": "com.emappublishing.nursingtimes"
      },
      "android": {
        "package": "com.emappublishing.nursingtimes"
      }
    }
  },
  "submit": {
    "production-cn": {
      "ios": {
        "appleId": "your-apple-id@emappublishing.com",
        "ascAppId": "CONSTRUCTION_NEWS_ASC_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    },
    "production-nt": {
      "ios": {
        "appleId": "your-apple-id@emappublishing.com",
        "ascAppId": "NURSING_TIMES_ASC_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Brand-Specific `app.json` Configurations

#### Construction News (`app.cn.json`)

```json
{
  "expo": {
    "name": "Construction News",
    "owner": "emap-publishing",
    "slug": "construction-news",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./brands/cn/assets/icon.png",
    "scheme": "constructionnews",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.emappublishing.constructionnews",
      "buildNumber": "1",
      "infoPlist": {
        "CFBundleDisplayName": "Construction News",
        "NSUserTrackingUsageDescription": "This app uses tracking to provide personalized content and advertisements."
      }
    },
    "android": {
      "package": "com.emappublishing.constructionnews",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./brands/cn/assets/adaptive-icon.png",
        "backgroundColor": "#FFDD00"
      },
      "edgeToEdgeEnabled": true,
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "updates": {
      "url": "https://u.expo.dev/17cbc49f-0d9b-4eb4-a9ff-4b3981b607bb"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./brands/cn/assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./brands/cn/assets/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#FFDD00"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "17cbc49f-0d9b-4eb4-a9ff-4b3981b607bb"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

#### Nursing Times (`app.nt.json`)

```json
{
  "expo": {
    "name": "Nursing Times",
    "owner": "emap-publishing",
    "slug": "nursing-times",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./brands/nt/assets/icon.png",
    "scheme": "nursingtimes",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.emappublishing.nursingtimes",
      "buildNumber": "1",
      "infoPlist": {
        "CFBundleDisplayName": "Nursing Times",
        "NSUserTrackingUsageDescription": "This app uses tracking to provide personalized content and advertisements."
      }
    },
    "android": {
      "package": "com.emappublishing.nursingtimes",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./brands/nt/assets/adaptive-icon.png",
        "backgroundColor": "#00AECA"
      },
      "edgeToEdgeEnabled": true,
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "updates": {
      "url": "https://u.expo.dev/17cbc49f-0d9b-4eb4-a9ff-4b3981b607bb"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./brands/nt/assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./brands/nt/assets/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#00AECA"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "17cbc49f-0d9b-4eb4-a9ff-4b3981b607bb"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

## Build Commands

### Construction News

```bash
# Development build
eas build --platform all --profile development --non-interactive

# Production build
eas build --platform all --profile production-cn --non-interactive

# iOS only
eas build --platform ios --profile production-cn --non-interactive

# Android only
eas build --platform android --profile production-cn --non-interactive

# Submit to stores
eas submit --platform all --profile production-cn
```

### Nursing Times

```bash
# Development build
eas build --platform all --profile development --non-interactive

# Production build
eas build --platform all --profile production-nt --non-interactive

# iOS only
eas build --platform ios --profile production-nt --non-interactive

# Android only
eas build --platform android --profile production-nt --non-interactive

# Submit to stores
eas submit --platform all --profile production-nt
```

## Environment Variables

Create separate `.env` files for each brand:

### `.env.cn` (Construction News)

```bash
EXPO_PUBLIC_BRAND=cn
EXPO_PUBLIC_APP_NAME="Construction News"
EXPO_PUBLIC_BUNDLE_ID=com.emappublishing.constructionnews
EXPO_PUBLIC_PACKAGE_NAME=com.emappublishing.constructionnews
```

### `.env.nt` (Nursing Times)

```bash
EXPO_PUBLIC_BRAND=nt
EXPO_PUBLIC_APP_NAME="Nursing Times"
EXPO_PUBLIC_BUNDLE_ID=com.emappublishing.nursingtimes
EXPO_PUBLIC_PACKAGE_NAME=com.emappublishing.nursingtimes
```

## Build Scripts

Add these scripts to your [`package.json`](package.json):

```json
{
  "scripts": {
    "build:cn:dev": "EXPO_PUBLIC_BRAND=cn eas build --platform all --profile development",
    "build:cn:prod": "EXPO_PUBLIC_BRAND=cn eas build --platform all --profile production-cn",
    "build:nt:dev": "EXPO_PUBLIC_BRAND=nt eas build --platform all --profile development",
    "build:nt:prod": "EXPO_PUBLIC_BRAND=nt eas build --platform all --profile production-nt",
    "submit:cn": "eas submit --platform all --profile production-cn",
    "submit:nt": "eas submit --platform all --profile production-nt"
  }
}
```

## Credential Management

### iOS Credentials

```bash
# Configure credentials for Construction News
EXPO_PUBLIC_BRAND=cn eas credentials:configure --platform ios

# Configure credentials for Nursing Times
EXPO_PUBLIC_BRAND=nt eas credentials:configure --platform ios
```

### Android Credentials

```bash
# Configure credentials for Construction News
EXPO_PUBLIC_BRAND=cn eas credentials:configure --platform android

# Configure credentials for Nursing Times
EXPO_PUBLIC_BRAND=nt eas credentials:configure --platform android
```

## Pre-Build Hooks

Create a pre-build script to dynamically set the correct app configuration:

### `scripts/pre-build.js`

```javascript
const fs = require("fs");
const path = require("path");

const brand = process.env.EXPO_PUBLIC_BRAND;

if (!brand) {
  console.error("EXPO_PUBLIC_BRAND environment variable is required");
  process.exit(1);
}

const appConfigPath = path.join(__dirname, "..", `app.${brand}.json`);
const targetPath = path.join(__dirname, "..", "app.json");

if (!fs.existsSync(appConfigPath)) {
  console.error(`App configuration not found: ${appConfigPath}`);
  process.exit(1);
}

// Copy brand-specific app.json
fs.copyFileSync(appConfigPath, targetPath);
console.log(`✅ Copied ${appConfigPath} to app.json`);

// Verify the configuration
const config = JSON.parse(fs.readFileSync(targetPath, "utf8"));
console.log(`✅ Building for: ${config.expo.name} (${brand})`);
```

Add to [`package.json`](package.json):

```json
{
  "scripts": {
    "prebuild": "node scripts/pre-build.js"
  }
}
```

## Troubleshooting

### Common Issues

1. **Bundle ID Conflicts**

   - Ensure bundle IDs are unique and registered in Apple Developer Portal
   - Check that package names don't conflict in Google Play Console

2. **Asset Path Issues**

   - Verify all asset paths in brand-specific app.json files
   - Ensure assets exist in the specified locations

3. **Environment Variable Issues**

   - Confirm EXPO_PUBLIC_BRAND is set correctly
   - Check that brand configurations exist

4. **Credential Issues**
   - Verify certificates are valid and not expired
   - Ensure provisioning profiles include correct bundle IDs

### Build Verification

Before submitting to stores, verify:

```bash
# Check app configuration
cat app.json | grep -E "(name|bundleIdentifier|package)"

# Verify environment
echo $EXPO_PUBLIC_BRAND

# Test build locally
npx expo run:ios --device
npx expo run:android --device
```

This configuration ensures clean separation between brands while maintaining the shared codebase architecture.
