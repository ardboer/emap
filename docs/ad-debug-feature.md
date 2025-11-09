# Ad Debug Feature Documentation

## Overview

The Ad Debug feature provides developers with detailed information about ad loading and display across all ad types in the application. This feature helps troubleshoot ad-related issues and verify ad configurations.

## Features

### Debug Toggle

- Located in **Settings → Debug section**
- Toggle switch to enable/disable ad debug information
- Setting persists across app sessions via AsyncStorage
- Key: `debug_ads_enabled`

### Debug Information Displayed

For all ad types, the debug info includes:

- **Ad Unit ID**: The specific ad unit being used
- **Ad Type**: banner, native_list, or native_carousel
- **Request Result**: success, failed, or loading
- **Load Time**: Time taken to load the ad (in milliseconds)
- **Test Mode**: Whether test ads or production ads are being used
- **Platform**: iOS or Android
- **Error Message**: Detailed error if ad failed to load
- **Position**: For native ads, the position in the list/carousel
- **View Type**: For list native ads, the view type (news, clinical, events, trending)

## Display Variants

### 1. Banner/Display Ads (Inline)

- Debug info appears **below the ad**
- Compact card layout with all information
- Color-coded status badge (green=success, red=failed, orange=loading)

### 2. Native List Ads (Inline)

- Debug info appears **below the ad item**
- Same compact card layout as banner ads
- Includes position and view type information

### 3. Native Carousel Ads (Overlay)

- Debug info appears as a **semi-transparent badge overlay** on top of the ad
- Positioned at top-left of the ad
- Minimal design to not obstruct ad content
- Shows: Status, Test/Prod mode, and Load time

## Implementation Details

### Components Modified

1. **`components/AdDebugInfo.tsx`** (NEW)

   - Reusable component for displaying debug information
   - Supports two variants: `inline` and `overlay`
   - Automatically color-codes status

2. **`components/SettingsContent.tsx`**

   - Added `debugAdsEnabled` state
   - Added AsyncStorage persistence
   - Added toggle switch in Debug section
   - Shows alert when toggled

3. **`components/BannerAd.tsx`**

   - Tracks load start time and load duration
   - Captures error messages
   - Conditionally renders `AdDebugInfo` when debug enabled

4. **`components/NativeAdListItem.tsx`**

   - Tracks load metrics
   - Retrieves ad unit ID from variant manager
   - Conditionally renders `AdDebugInfo` inline

5. **`components/NativeAdCarouselItem.tsx`**
   - Tracks load metrics
   - Retrieves ad unit ID from variant manager
   - Conditionally renders `AdDebugInfo` as overlay

### AsyncStorage Key

```typescript
const DEBUG_ADS_KEY = "debug_ads_enabled";
```

### Usage Example

```typescript
// Check if debug is enabled
const debugEnabled = await AsyncStorage.getItem("debug_ads_enabled");
const isDebugMode = debugEnabled === "true";

// Prepare debug data
const debugData: AdDebugData = {
  adUnitId: "ca-app-pub-xxxxx",
  adType: "banner",
  requestResult: "success",
  loadTimeMs: 1250,
  isTestAd: true,
  position: 5,
  viewType: "news",
};

// Render debug info
{
  isDebugMode && <AdDebugInfo data={debugData} variant="inline" />;
}
```

## Testing

### To Enable Debug Mode:

1. Open the app
2. Navigate to Settings (hamburger menu)
3. Scroll to the **Debug** section
4. Toggle **"Debug Ads"** switch ON
5. An alert will confirm the setting is enabled

### To Verify:

1. Navigate to any screen with ads:
   - Article detail pages (banner ads)
   - News/Clinical/Events lists (native list ads)
   - Highlights carousel (native carousel ads)
2. Debug information should appear on all ads
3. Verify all fields are populated correctly

### To Disable:

1. Return to Settings → Debug
2. Toggle **"Debug Ads"** switch OFF
3. Debug info will be hidden immediately

## Troubleshooting

### Debug info not showing

- Verify the toggle is ON in Settings
- Check AsyncStorage: `await AsyncStorage.getItem("debug_ads_enabled")`
- Ensure you're in the Debug section (visible in **DEV** or when debug_mode_enabled is set)

### Missing information in debug display

- Some fields may be undefined if ad hasn't loaded yet
- Error messages only appear when ad fails to load
- Load time is 0ms for cached ads

### Overlay not visible on carousel ads

- Check z-index positioning
- Verify the ad has loaded successfully
- Overlay appears at top-left with semi-transparent background

## Future Enhancements

Potential improvements:

- Add network request details
- Show ad refresh count
- Display viewability metrics
- Add export/share debug logs
- Show ad targeting parameters (if available)

## Related Files

- `components/AdDebugInfo.tsx` - Debug info component
- `components/SettingsContent.tsx` - Settings UI
- `components/BannerAd.tsx` - Banner ad implementation
- `components/DisplayAd.tsx` - Display ad wrapper
- `components/NativeAdListItem.tsx` - List native ad
- `components/NativeAdCarouselItem.tsx` - Carousel native ad
- `services/admob.ts` - AdMob service
- `services/displayAdManager.ts` - Display ad manager
- `services/nativeAdVariantManager.ts` - Native ad variant manager

## Notes

- Debug mode is only visible in development builds or when `debug_mode_enabled` is set
- Test ads are always used by default (configured in ad services)
- Debug info does not affect ad performance or user experience
- The feature is designed to be non-intrusive and easily toggleable
