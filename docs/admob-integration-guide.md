# Google AdMob Integration Guide

This guide covers the implementation of Google AdMob display ads in the EMAP multi-brand React Native app.

## Overview

The AdMob integration provides:

- Test banner ads for development
- Brand-specific ad unit configuration
- Responsive ad sizing
- Error handling and fallback states
- Loading indicators
- Integration with the existing brand system

## Architecture

### Components

1. **AdMob Service** (`services/admob.ts`)

   - Centralized ad management
   - Brand-specific configuration
   - Test/production environment switching

2. **BannerAd Component** (`components/BannerAd.tsx`)

   - Reusable banner ad component
   - Brand theming integration
   - Loading and error states

3. **App Configuration** (`app.json`)
   - AdMob plugin configuration
   - Test App IDs for development

## Current Implementation

### Test Configuration

The app is currently configured with Google's official test Ad Unit IDs:

- **Android App ID**: `ca-app-pub-3940256099942544~3347511713`
- **iOS App ID**: `ca-app-pub-3940256099942544~1458002511`
- **Banner Test ID**: `ca-app-pub-3940256099942544/6300978111`

### Integration Points

Currently implemented:

- **Article Detail Page**: Banner ad below lead text

## Setup for Production

### 1. Create AdMob Account

1. Go to [Google AdMob](https://admob.google.com/)
2. Create an account or sign in
3. Create a new app for each platform (iOS/Android)
4. Note down your App IDs

### 2. Create Ad Units

For each brand (CN/NT), create the following ad units:

- **Banner Ad** (320x50 or 320x100)
- **Interstitial Ad** (optional, for future use)
- **Rewarded Ad** (optional, for future use)

### 3. Update Configuration

#### Update App IDs in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "android_app_id": "ca-app-pub-YOUR_PUBLISHER_ID~YOUR_ANDROID_APP_ID",
          "ios_app_id": "ca-app-pub-YOUR_PUBLISHER_ID~YOUR_IOS_APP_ID"
        }
      ]
    ]
  }
}
```

#### Update Ad Unit IDs in `services/admob.ts`:

```typescript
const PRODUCTION_AD_UNITS = {
  cn: {
    banner: "ca-app-pub-YOUR_PUBLISHER_ID/YOUR_CN_BANNER_ID",
    interstitial: "ca-app-pub-YOUR_PUBLISHER_ID/YOUR_CN_INTERSTITIAL_ID",
    rewarded: "ca-app-pub-YOUR_PUBLISHER_ID/YOUR_CN_REWARDED_ID",
  },
  nt: {
    banner: "ca-app-pub-YOUR_PUBLISHER_ID/YOUR_NT_BANNER_ID",
    interstitial: "ca-app-pub-YOUR_PUBLISHER_ID/YOUR_NT_INTERSTITIAL_ID",
    rewarded: "ca-app-pub-YOUR_PUBLISHER_ID/YOUR_NT_REWARDED_ID",
  },
};
```

#### Switch to Production Mode:

In `components/BannerAd.tsx`, change:

```typescript
await adMobService.initialize({
  useTestAds: false, // Change to false for production
  brand: brandConfig?.shortcode === "cn" ? "cn" : "nt",
});
```

### 4. Testing

#### Test Device Setup

Add your test device IDs to avoid invalid traffic:

```typescript
// In your app initialization
await adMobService.setTestDeviceIds([
  "YOUR_ANDROID_DEVICE_ID",
  "YOUR_IOS_DEVICE_ID",
]);
```

#### Development Testing

1. Build the app with custom development build:
   ```bash
   expo run:ios
   # or
   expo run:android
   ```
2. Navigate to an article to see the test banner ad
3. Check console logs for ad loading status

## Usage Examples

### Basic Banner Ad

```tsx
import { BannerAd } from "@/components/BannerAd";

<BannerAd
  showLoadingIndicator={true}
  showErrorMessage={false}
  onAdLoaded={() => console.log("Ad loaded")}
  onAdFailedToLoad={(error) => console.log("Ad failed:", error)}
/>;
```

### Custom Sized Banner Ad

```tsx
import { BannerAd } from "@/components/BannerAd";
import { AdSizes } from "@/services/admob";

<BannerAd
  size={AdSizes.LARGE_BANNER} // 320x100
  style={{ marginVertical: 20 }}
/>;
```

### Programmatic Ad Management

```typescript
import { adMobService } from "@/services/admob";

// Initialize with specific configuration
await adMobService.initialize({
  useTestAds: false,
  brand: "nt",
});

// Get ad unit ID
const bannerAdId = adMobService.getBannerAdUnitId();

// Switch brands
adMobService.setBrand("cn");

// Toggle test mode
adMobService.setTestMode(true);
```

## Available Ad Sizes

- `BANNER`: 320x50 (Standard banner)
- `LARGE_BANNER`: 320x100 (Large banner)
- `MEDIUM_RECTANGLE`: 300x250 (Medium rectangle)
- `FULL_BANNER`: 468x60 (Full banner)
- `LEADERBOARD`: 728x90 (Leaderboard)

## Error Handling

The implementation includes comprehensive error handling:

- Network connectivity issues
- Invalid ad unit IDs
- Ad serving failures
- Initialization errors

Errors are logged to console and can trigger fallback UI states.

## Performance Considerations

- Ads are lazy-loaded when components mount
- Proper cleanup on component unmount
- Memory management for ad instances
- Minimal impact on app performance

## Compliance & Privacy

- GDPR compliance ready (can be configured)
- COPPA compliance support
- User consent management (to be implemented if needed)
- Non-personalized ads option available

## Future Enhancements

Potential additions:

1. **Interstitial Ads**: Full-screen ads between content
2. **Rewarded Ads**: Video ads with user rewards
3. **Native Ads**: Ads that match app content style
4. **Ad Mediation**: Multiple ad networks for better fill rates
5. **Analytics Integration**: Track ad performance
6. **A/B Testing**: Test different ad placements

## Troubleshooting

### Common Issues

1. **Ads not showing**

   - Check internet connection
   - Verify ad unit IDs
   - Check console for error messages
   - Ensure app is built with custom development build

2. **Test ads not appearing**

   - Verify test device ID is set
   - Check AdMob account status
   - Ensure proper initialization

3. **Build errors**
   - Clean and rebuild the project
   - Check plugin configuration in app.json
   - Verify package installation

### Debug Commands

```bash
# Clean and rebuild
expo run:ios --clear
expo run:android --clear

# Check logs
npx react-native log-ios
npx react-native log-android
```

## Support

For issues related to:

- **AdMob SDK**: [Google AdMob Documentation](https://developers.google.com/admob)
- **React Native Integration**: [react-native-google-mobile-ads](https://github.com/invertase/react-native-google-mobile-ads)
- **Expo Integration**: [Expo AdMob Guide](https://docs.expo.dev/versions/latest/sdk/admob/)

---

**Note**: This integration uses test ads by default. Remember to switch to production ad unit IDs and disable test mode before releasing to production.
