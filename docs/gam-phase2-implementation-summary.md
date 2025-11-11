# GAM Migration - Phase 2 Implementation Summary

## Overview

Phase 2 of the Google Ad Manager (GAM) migration has been completed. This phase focused on updating all remaining ad components and services to use the GAM service with integrated consent management.

## Completed Updates

### 1. **BannerAd Component** (`components/BannerAd.tsx`)

**Changes:**

- ✅ Changed import from `adMobService` to `gamService`
- ✅ Changed `BannerAd` to `GAMBannerAd` component
- ✅ Added consent check before ad requests (`canRequestAds`)
- ✅ Added `format` prop to support both banner and MPU
- ✅ Added `targeting` prop for ad targeting parameters
- ✅ Updated to use `GAMBannerAd` with `sizes` array and `customTargeting`
- ✅ Blocks ad rendering if consent not obtained

**New Features:**

```typescript
<BannerAd
  format="mpu" // 'banner' or 'mpu'
  targeting={{
    POS: "top",
    category: "clinical",
    tags: ["nursing", "healthcare"],
  }}
/>
```

### 2. **DisplayAd Component** (`components/DisplayAd.tsx`)

**Changes:**

- ✅ Changed import from `adMobService` to `gamService`
- ✅ Added `targeting` prop support
- ✅ Automatically determines ad format based on size (MPU vs banner)
- ✅ Passes targeting parameters to BannerAd component
- ✅ Updated logging to use `[DisplayAd]` prefix

**New Features:**

```typescript
<DisplayAd
  context="article_detail"
  size="MEDIUM_RECTANGLE"
  targeting={{
    POS: "article_top",
    content_type: "article",
    category: "clinical",
  }}
/>
```

### 3. **Native Ads Service** (`services/nativeAds.ts`)

**Changes:**

- ✅ Removed direct `mobileAds()` import
- ✅ Integrated with `gamService` for initialization
- ✅ Added `canRequestAds` state tracking
- ✅ Updated `initialize()` to use GAM service with consent check
- ✅ Updated `isEnabled()` to include consent check
- ✅ Updated `getAdUnitId()` to use `gamService.getNativeAdUnitId()`
- ✅ Updated `shouldShowAdAtIndex()` to include consent check
- ✅ Updated `calculateAdPositions()` to include consent check
- ✅ Added `canRequest()` method
- ✅ Added `refreshConsentStatus()` method
- ✅ Updated all logging to use `[NativeAds]` prefix

**Key Changes:**

```typescript
// Before
await mobileAds().initialize();
const unitId = Platform.OS === "ios" ? adUnitIds.ios : adUnitIds.android;

// After
await gamService.initialize({ useTestAds, brand });
this.canRequestAds = gamService.canRequestAds();
const unitId = gamService.getNativeAdUnitId();
```

### 4. **Display Ad Manager Service** (`services/displayAdManager.ts`)

**Changes:**

- ✅ Integrated with `gamService` for initialization
- ✅ Added `canRequestAds` state tracking
- ✅ Changed `initialize()` to async and added GAM service initialization
- ✅ Updated `isEnabled()` to include consent check
- ✅ Updated `getAdUnitId()` to use GAM service with format parameter
- ✅ Updated `calculateArticleAdPlacements()` to include consent check
- ✅ Updated `calculateListAdPlacements()` to include consent check
- ✅ Added `canRequest()` method
- ✅ Added `refreshConsentStatus()` method
- ✅ Updated all logging to use `[DisplayAdManager]` prefix

**Key Changes:**

```typescript
// Before
getAdUnitId(): string | null {
  const platform = Platform.OS as "ios" | "android";
  return this.config.adUnitIds[platform] || null;
}

// After
getAdUnitId(format: 'banner' | 'mpu' = 'banner'): string | null {
  return format === 'mpu'
    ? gamService.getMPUAdUnitId()
    : gamService.getBannerAdUnitId();
}
```

## Architecture Changes

### Consent Flow Integration

All ad services and components now follow this flow:

```
1. Initialize GAM Service
   ↓
2. Check Consent Status
   ↓
3. If consent obtained → Allow ad requests
   ↓
4. If consent not obtained → Block ad requests
   ↓
5. Show consent form if required
   ↓
6. Refresh consent status
   ↓
7. Allow ad requests after consent
```

### Service Initialization Order

```typescript
// Recommended initialization in App.tsx
useEffect(() => {
  const initializeAds = async () => {
    // 1. Initialize GAM (includes consent)
    await gamService.initialize({
      useTestAds: __DEV__,
      brand: "nt",
    });

    // 2. Initialize display ad manager
    if (brandConfig?.displayAds) {
      await displayAdManager.initialize(brandConfig.displayAds);
    }

    // 3. Initialize native ad service
    await nativeAdService.initialize();

    // 4. Check if ads can be requested
    if (gamService.canRequestAds()) {
      console.log("✅ Ads ready to serve");
    } else {
      console.log("⏳ Waiting for consent");
    }
  };

  initializeAds();
}, []);
```

### Consent Status Refresh

When consent status changes (e.g., user updates preferences):

```typescript
// Refresh consent status across all services
gamService.refreshConsentStatus();
displayAdManager.refreshConsentStatus();
nativeAdService.refreshConsentStatus();
```

## Ad Unit ID Mapping

### GAM Service Provides All Ad Unit IDs

```typescript
// Banner (320x100)
gamService.getBannerAdUnitId();
// Returns: 'nursingtimes_app_ios/banner' or 'nursingtimes_app_android/banner'

// MPU (300x250)
gamService.getMPUAdUnitId();
// Returns: 'nursingtimes_app_ios/mpu' or 'nursingtimes_app_android/mpu'

// Native (Fluid, 1x1)
gamService.getNativeAdUnitId();
// Returns: 'nursingtimes_app_ios/native' or 'nursingtimes_app_android/native'

// Video (Out-of-Page)
gamService.getVideoAdUnitId();
// Returns: 'nursingtimes_app_ios/video' or 'nursingtimes_app_android/video'
```

### Test Mode

In test mode, GAM service automatically returns Google's test ad unit IDs:

```typescript
gamService.setTestMode(true);
// All ad unit ID methods return TestIds.BANNER, TestIds.NATIVE, etc.
```

## Targeting Support

### Slot-Level Targeting

Every ad can now include a `POS` parameter:

```typescript
<BannerAd
  targeting={{ POS: 'article_top' }}
/>

<DisplayAd
  targeting={{ POS: 'list_item_3' }}
/>
```

### Page-Level Targeting

Ads can include content metadata:

```typescript
<DisplayAd
  targeting={{
    POS: "article_mid",
    content_type: "article",
    category: "clinical",
    tags: ["nursing", "healthcare", "patient-care"],
    author: "John Doe",
    brand: "nt",
    section: "news",
  }}
/>
```

### Default Targeting

Set default targeting for all ads:

```typescript
gamService.setDefaultTargeting({
  brand: "nt",
  app_version: "1.0.0",
});
```

## Backward Compatibility

### Legacy AdMob Service

The old `services/admob.ts` file is still present but no longer used. It can be:

- Kept for reference during migration
- Removed after successful testing
- Renamed to `admob.ts.backup`

### Native Ad Components

Native ad components (`NativeAdCarouselItem.tsx`, `NativeAdListItem.tsx`) don't need changes because:

- They use `NativeAd` and `NativeAdView` which already support GAM
- The service layer (`nativeAds.ts`) handles ad unit IDs
- Consent checks happen at the service level

## Testing Checklist

### Unit Testing

- [ ] Test GAM service initialization
- [ ] Test consent flow (obtain, deny, reset)
- [ ] Test ad unit ID retrieval for all formats
- [ ] Test targeting parameter building
- [ ] Test consent status refresh

### Integration Testing

- [ ] Test banner ad loading with consent
- [ ] Test MPU ad loading with consent
- [ ] Test native ad loading with consent
- [ ] Test ad blocking without consent
- [ ] Test consent form display
- [ ] Test targeting parameters in ad requests

### Platform Testing

- [ ] Test on iOS simulator
- [ ] Test on iOS device
- [ ] Test on Android emulator
- [ ] Test on Android device
- [ ] Test in EEA region (consent required)
- [ ] Test in non-EEA region (consent not required)

### Ad Format Testing

- [ ] Banner (320x100) loads correctly
- [ ] MPU (300x250) loads correctly
- [ ] Native carousel ads load correctly
- [ ] Native list ads load correctly
- [ ] Test mode shows Google test ads
- [ ] Production mode uses GAM ad units

## Known Limitations

### Not Yet Implemented

1. **Video Ads** - Service supports it, but no component yet (Phase 5)
2. **Native Fluid (1x1)** - Service supports it, but not configured (Phase 5)
3. **Brand Config Updates** - Brand configs still have old ad unit IDs (Phase 3)
4. **Full Targeting Implementation** - Targeting infrastructure ready, but not fully integrated (Phase 4)

### Requires Manual Testing

1. **Consent Form Display** - Must test in EEA/UK regions
2. **Ad Fill Rates** - Monitor after going live
3. **Targeting Accuracy** - Verify parameters reach GAM correctly
4. **Performance Impact** - Monitor app performance with new SDK

## Migration Impact

### Breaking Changes

- `adMobService` replaced with `gamService`
- `BannerAd` component now uses `GAMBannerAd`
- Display ad manager `initialize()` is now async
- All ad services require consent before serving ads

### Non-Breaking Changes

- Native ad components unchanged
- Ad placement logic unchanged
- Lazy loading functionality unchanged
- Analytics tracking unchanged

## Files Modified in Phase 2

1. `components/BannerAd.tsx` - Updated to use GAMBannerAd with targeting
2. `components/DisplayAd.tsx` - Added targeting support
3. `services/nativeAds.ts` - Integrated with GAM service
4. `services/displayAdManager.ts` - Integrated with GAM service

**Total Lines Changed:** ~200 lines across 4 files

## Next Steps (Phase 3)

### Update Brand Configurations

1. Update `brands/jnl/config.json` with GAM ad unit IDs
2. Update `brands/cn/config.json` with GAM ad unit IDs (if exists)
3. Add targeting configuration to brand configs
4. Add CMP configuration to brand configs

### Implement Full Targeting

1. Extract article metadata for page-level targeting
2. Calculate slot positions for slot-level targeting
3. Pass targeting to all ad components
4. Test targeting parameters in GAM

### Documentation

1. Update deployment guides with GAM requirements
2. Create targeting configuration guide
3. Update testing guides for GAM
4. Create troubleshooting guide for common issues

## Success Criteria

Phase 2 is considered complete when:

- ✅ All ad components use GAM service
- ✅ All ad services integrate with consent management
- ✅ Consent blocks ads until obtained
- ✅ Ad unit IDs come from GAM service
- ✅ Targeting infrastructure is in place
- ✅ No compilation errors
- ✅ Backward compatibility maintained where possible

All criteria have been met. Ready to proceed to Phase 3.
