# Google Ad Manager (GAM) Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from AdMob to Google Ad Manager (GAM) in the EMAP multi-brand React Native app.

**Current Setup:**

- SDK: `react-native-google-mobile-ads` v15.8.0
- Platform: AdMob
- Brands: CN, NT, JNL
- Ad Types: Banner (implemented), Interstitial & Rewarded (prepared)

**Good News:** The same SDK supports both AdMob and GAM - no package changes needed!

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GAM Account Setup](#gam-account-setup)
3. [Code Changes Required](#code-changes-required)
4. [Configuration Updates](#configuration-updates)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Checklist](#deployment-checklist)
7. [Rollback Plan](#rollback-plan)

---

## Prerequisites

### What You Need Before Starting

- [ ] Google Ad Manager account access
- [ ] GAM Network Code (6-10 digits)
- [ ] Ad unit IDs created in GAM for each brand
- [ ] Test environment set up
- [ ] Backup of current working code

### GAM vs AdMob: Key Differences

| Feature            | AdMob                    | GAM                           |
| ------------------ | ------------------------ | ----------------------------- |
| **Ad Unit Format** | `ca-app-pub-XXXXX/XXXXX` | `/NETWORK_CODE/ad-unit-code`  |
| **Targeting**      | Basic                    | Advanced (custom, contextual) |
| **Direct Sales**   | ❌ No                    | ✅ Yes                        |
| **Reporting**      | Basic                    | Comprehensive                 |
| **Mediation**      | Basic                    | Advanced with priority        |
| **Best For**       | Simple monetization      | Publishers with direct sales  |

---

## GAM Account Setup

### Step 1: Create GAM Account

1. Go to [Google Ad Manager](https://admanager.google.com/)
2. Sign in with your Google account
3. Create a new network (or use existing)
4. Note your **Network Code** (e.g., `21775744923`)

### Step 2: Create Ad Units for Each Brand

Create the following ad units in GAM:

#### Construction News (CN)

```
/YOUR_NETWORK_CODE/cn_banner_320x50
/YOUR_NETWORK_CODE/cn_banner_320x100
/YOUR_NETWORK_CODE/cn_banner_300x250
/YOUR_NETWORK_CODE/cn_interstitial
/YOUR_NETWORK_CODE/cn_rewarded
```

#### Nursing Times (NT)

```
/YOUR_NETWORK_CODE/nt_banner_320x50
/YOUR_NETWORK_CODE/nt_banner_320x100
/YOUR_NETWORK_CODE/nt_banner_300x250
/YOUR_NETWORK_CODE/nt_interstitial
/YOUR_NETWORK_CODE/nt_rewarded
```

#### Journalism (JNL)

```
/YOUR_NETWORK_CODE/jnl_banner_320x50
/YOUR_NETWORK_CODE/jnl_banner_320x100
/YOUR_NETWORK_CODE/jnl_banner_300x250
/YOUR_NETWORK_CODE/jnl_interstitial
/YOUR_NETWORK_CODE/jnl_rewarded
```

### Step 3: Configure Ad Unit Settings

For each ad unit:

1. Set **Size**: Match the ad unit name (320x50, 320x100, etc.)
2. Set **Target Platform**: Mobile app
3. Enable **Refresh**: Optional, based on your needs
4. Add **Description**: Include brand name for clarity

### Step 4: Create Line Items

1. Create a line item for each ad unit
2. Set **Type**: Price priority or Network
3. Set **Priority**: 12 (standard)
4. Add **Targeting**: Use custom targeting for brands
5. Upload **Creatives**: Test creatives for development

---

## Code Changes Required

### Change 1: Rename Service File

**Action:** Rename `services/admob.ts` to `services/gam.ts`

```bash
mv services/admob.ts services/gam.ts
```

### Change 2: Update Service Implementation

**File:** `services/gam.ts`

**Changes:**

1. **Update Test Ad Units:**

```typescript
// BEFORE (AdMob)
const TEST_AD_UNITS = {
  banner: TestIds.BANNER,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
};

// AFTER (GAM)
const TEST_AD_UNITS = {
  banner: "/6499/example/banner", // Google's GAM test network
  interstitial: "/6499/example/interstitial",
  rewarded: "/6499/example/rewarded",
};
```

2. **Update Production Ad Units:**

```typescript
// BEFORE (AdMob)
const PRODUCTION_AD_UNITS = {
  cn: {
    banner: "ca-app-pub-xxxxxxxx/xxxxxxxx",
    interstitial: "ca-app-pub-xxxxxxxx/xxxxxxxx",
    rewarded: "ca-app-pub-xxxxxxxx/xxxxxxxx",
  },
  nt: {
    banner: "ca-app-pub-xxxxxxxx/xxxxxxxx",
    interstitial: "ca-app-pub-xxxxxxxx/xxxxxxxx",
    rewarded: "ca-app-pub-xxxxxxxx/xxxxxxxx",
  },
};

// AFTER (GAM) - Replace YOUR_NETWORK_CODE with your actual network code
const PRODUCTION_AD_UNITS = {
  cn: {
    banner: "/YOUR_NETWORK_CODE/cn_banner_320x50",
    largeBanner: "/YOUR_NETWORK_CODE/cn_banner_320x100",
    mediumRectangle: "/YOUR_NETWORK_CODE/cn_banner_300x250",
    interstitial: "/YOUR_NETWORK_CODE/cn_interstitial",
    rewarded: "/YOUR_NETWORK_CODE/cn_rewarded",
  },
  nt: {
    banner: "/YOUR_NETWORK_CODE/nt_banner_320x50",
    largeBanner: "/YOUR_NETWORK_CODE/nt_banner_320x100",
    mediumRectangle: "/YOUR_NETWORK_CODE/nt_banner_300x250",
    interstitial: "/YOUR_NETWORK_CODE/nt_interstitial",
    rewarded: "/YOUR_NETWORK_CODE/nt_rewarded",
  },
  jnl: {
    banner: "/YOUR_NETWORK_CODE/jnl_banner_320x50",
    largeBanner: "/YOUR_NETWORK_CODE/jnl_banner_320x100",
    mediumRectangle: "/YOUR_NETWORK_CODE/jnl_banner_300x250",
    interstitial: "/YOUR_NETWORK_CODE/jnl_interstitial",
    rewarded: "/YOUR_NETWORK_CODE/jnl_rewarded",
  },
};
```

3. **Add Targeting Support (NEW):**

```typescript
// ADD THIS - Brand-specific targeting configuration
const BRAND_TARGETING = {
  cn: {
    keywords: ["construction", "building", "infrastructure", "engineering"],
    customTargeting: {
      brand: "cn",
      industry: "construction",
      audience: "professionals",
    },
  },
  nt: {
    keywords: ["nursing", "healthcare", "medical", "patient-care"],
    customTargeting: {
      brand: "nt",
      industry: "healthcare",
      audience: "nurses",
    },
  },
  jnl: {
    keywords: ["journalism", "media", "news", "publishing"],
    customTargeting: {
      brand: "jnl",
      industry: "media",
      audience: "journalists",
    },
  },
};
```

4. **Update Interface:**

```typescript
// BEFORE
export interface AdMobConfig {
  useTestAds: boolean;
  brand: "cn" | "nt";
}

// AFTER - Add JNL brand
export interface GAMConfig {
  useTestAds: boolean;
  brand: "cn" | "nt" | "jnl";
}
```

5. **Add New Method for Request Options:**

```typescript
// ADD THIS METHOD to the service class
getRequestOptions(additionalTargeting?: Record<string, string>): RequestOptions {
  const targeting = BRAND_TARGETING[this.config.brand];

  return {
    requestNonPersonalizedAdsOnly: false,
    keywords: targeting.keywords,
    customTargeting: {
      ...targeting.customTargeting,
      app_version: Constants.expoConfig?.version || '1.0.0',
      platform: Platform.OS,
      ...additionalTargeting,
    },
  };
}
```

6. **Add Methods for Different Banner Sizes:**

```typescript
// ADD THESE METHODS
getLargeBannerAdUnitId(): string {
  if (this.config.useTestAds) {
    return TEST_AD_UNITS.banner;
  }
  return PRODUCTION_AD_UNITS[this.config.brand].largeBanner;
}

getMediumRectangleAdUnitId(): string {
  if (this.config.useTestAds) {
    return TEST_AD_UNITS.banner;
  }
  return PRODUCTION_AD_UNITS[this.config.brand].mediumRectangle;
}
```

7. **Update Class Name:**

```typescript
// BEFORE
class AdMobService {
  // ...
}
export const adMobService = new AdMobService();

// AFTER
class GAMService {
  // ...
}
export const gamService = new GAMService();
```

### Change 3: Update Component Imports

**File:** `components/BannerAd.tsx`

**Changes:**

```typescript
// BEFORE
import { adMobService, AdSizes } from "@/services/admob";

// AFTER
import { gamService, AdSizes } from "@/services/gam";
```

### Change 4: Update Component Implementation

**File:** `components/BannerAd.tsx`

**Changes:**

1. **Update Initialization:**

```typescript
// BEFORE
await adMobService.initialize({
  useTestAds: true,
  brand: brandConfig?.shortcode === "cn" ? "cn" : "nt",
});

// AFTER
await gamService.initialize({
  useTestAds: true,
  brand: brandConfig?.shortcode as "cn" | "nt" | "jnl",
});
```

2. **Update Ad Unit ID Retrieval:**

```typescript
// BEFORE
const unitId = adMobService.getBannerAdUnitId();

// AFTER
const unitId = gamService.getBannerAdUnitId();
```

3. **Update Initialization Check:**

```typescript
// BEFORE
if (!adMobService.isInitialized() || !adUnitId) {
  return null;
}

// AFTER
if (!gamService.isInitialized() || !adUnitId) {
  return null;
}
```

4. **Update Banner Ad with Request Options:**

```typescript
// BEFORE
<GoogleBannerAd
  unitId={adUnitId}
  size={size}
  requestOptions={{
    requestNonPersonalizedAdsOnly: false,
  }}
  onAdLoaded={handleAdLoaded}
  onAdFailedToLoad={handleAdFailedToLoad}
  onAdOpened={handleAdClicked}
/>

// AFTER
<GoogleBannerAd
  unitId={adUnitId}
  size={size}
  requestOptions={gamService.getRequestOptions()}
  onAdLoaded={handleAdLoaded}
  onAdFailedToLoad={handleAdFailedToLoad}
  onAdOpened={handleAdClicked}
/>
```

### Change 5: Update All Import References

**Files to Update:**

Search for all files importing from `@/services/admob` and update to `@/services/gam`:

```bash
# Find all files that import admob
grep -r "from '@/services/admob'" .

# Update each file found
```

**Common files that may need updates:**

- Any screen files using banner ads
- Test files
- Configuration files

---

## Configuration Updates

### No Changes Required in app.json

**Important:** The `app.json` configuration remains the same! GAM uses the same Mobile Ads SDK initialization.

**Current configuration (keep as-is):**

```json
{
  "plugins": [
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": "ca-app-pub-3940256099942544~3347511713",
        "iosAppId": "ca-app-pub-3940256099942544~1458002511"
      }
    ]
  ]
}
```

**Note:** These are still AdMob App IDs used for SDK initialization. GAM ad unit IDs are used at the component level.

---

## Testing Strategy

### Phase 1: Local Testing with Test Network

1. **Update Test Configuration:**

```typescript
// In services/gam.ts
const TEST_AD_UNITS = {
  banner: "/6499/example/banner", // Google's test network
  interstitial: "/6499/example/interstitial",
  rewarded: "/6499/example/rewarded",
};
```

2. **Build and Run:**

```bash
# iOS
expo run:ios

# Android
expo run:android
```

3. **Verify:**
   - [ ] App launches without errors
   - [ ] Banner ads load with GAM test network
   - [ ] Console shows GAM ad unit IDs (not AdMob format)
   - [ ] All three brands work (CN, NT, JNL)

### Phase 2: Testing with Your GAM Network

1. **Update to Your Network Code:**

```typescript
// In services/gam.ts
const PRODUCTION_AD_UNITS = {
  cn: {
    banner: "/21775744923/cn_banner_320x50", // Use your actual network code
    // ... rest of ad units
  },
  // ... other brands
};
```

2. **Enable Test Mode:**

```typescript
// In components/BannerAd.tsx
await gamService.initialize({
  useTestAds: false, // Use production ad units
  brand: brandConfig?.shortcode as "cn" | "nt" | "jnl",
});
```

3. **Add Test Device IDs:**

```typescript
// In app initialization or service
await mobileAds().setRequestConfiguration({
  testDeviceIdentifiers: ["YOUR_ANDROID_DEVICE_ID", "YOUR_IOS_DEVICE_ID"],
});
```

4. **Verify in GAM Dashboard:**
   - [ ] Check "Delivery" tab for ad requests
   - [ ] Verify impressions are recorded
   - [ ] Check targeting is working correctly
   - [ ] Verify brand-specific ad units are being called

### Phase 3: Integration Testing

Test each brand separately:

**CN Brand:**

```bash
# Build CN app
npm run build:cn

# Test banner ads in articles
# Verify targeting: brand=cn, industry=construction
```

**NT Brand:**

```bash
# Build NT app
npm run build:nt

# Test banner ads in articles
# Verify targeting: brand=nt, industry=healthcare
```

**JNL Brand:**

```bash
# Build JNL app
npm run build:jnl

# Test banner ads in articles
# Verify targeting: brand=jnl, industry=media
```

### Testing Checklist

- [ ] Banner ads load successfully
- [ ] Correct GAM ad unit IDs are used
- [ ] Targeting parameters are sent correctly
- [ ] Error handling works (test with invalid ad unit)
- [ ] Loading states display properly
- [ ] Ads refresh correctly (if enabled)
- [ ] No console errors or warnings
- [ ] Performance is acceptable
- [ ] Memory usage is normal

---

## Deployment Checklist

### Pre-Deployment

- [ ] All code changes committed and pushed
- [ ] Tests passing
- [ ] GAM account fully configured
- [ ] Line items and creatives ready
- [ ] Test devices verified
- [ ] Documentation updated

### Deployment Steps

1. **Update Environment Variables (if using):**

```bash
# .env or similar
GAM_NETWORK_CODE=21775744923
GAM_USE_TEST_ADS=false
```

2. **Build Production Apps:**

```bash
# CN
eas build --platform all --profile production-cn

# NT
eas build --platform all --profile production-nt

# JNL
eas build --platform all --profile production-jnl
```

3. **Deploy to TestFlight/Internal Testing:**

```bash
# iOS
eas submit --platform ios --profile production-cn
eas submit --platform ios --profile production-nt
eas submit --platform ios --profile production-jnl

# Android
eas submit --platform android --profile production-cn
eas submit --platform android --profile production-nt
eas submit --platform android --profile production-jnl
```

4. **Monitor Initial Rollout:**
   - Check GAM dashboard for impressions
   - Monitor error rates
   - Verify revenue tracking
   - Check user feedback

### Post-Deployment

- [ ] Verify ads are serving in production
- [ ] Check GAM reporting dashboard
- [ ] Monitor app performance metrics
- [ ] Review error logs
- [ ] Collect user feedback
- [ ] Document any issues

---

## Rollback Plan

### If Issues Occur

1. **Quick Rollback (Revert to AdMob):**

```bash
# Revert the service file
git checkout HEAD~1 services/gam.ts

# Rename back to admob.ts
mv services/gam.ts services/admob.ts

# Revert component changes
git checkout HEAD~1 components/BannerAd.tsx

# Rebuild and redeploy
```

2. **Partial Rollback (Feature Flag):**

Add a feature flag to switch between AdMob and GAM:

```typescript
// config/features.ts
export const USE_GAM = false; // Set to false to use AdMob

// In components/BannerAd.tsx
import { USE_GAM } from "@/config/features";

const service = USE_GAM ? gamService : adMobService;
```

3. **Emergency Hotfix:**

If ads completely fail:

```typescript
// Temporarily disable ads
const DISABLE_ADS = true;

if (DISABLE_ADS) {
  return null;
}
```

### Rollback Checklist

- [ ] Identify the issue
- [ ] Determine rollback scope (full or partial)
- [ ] Execute rollback steps
- [ ] Test rollback build
- [ ] Deploy rollback version
- [ ] Verify ads working again
- [ ] Document issue for future reference

---

## Summary of Changes

### Files to Modify

1. ✏️ **`services/admob.ts`** → Rename to `services/gam.ts`

   - Update test ad units to GAM format
   - Update production ad units to GAM format
   - Add JNL brand support
   - Add targeting configuration
   - Add `getRequestOptions()` method
   - Add size-specific methods

2. ✏️ **`components/BannerAd.tsx`**

   - Update import from `admob` to `gam`
   - Update service references
   - Add request options to GoogleBannerAd

3. ✏️ **Any other files importing `@/services/admob`**
   - Update imports to `@/services/gam`

### Files That DON'T Change

- ✅ `app.json` - No changes needed
- ✅ `package.json` - No changes needed
- ✅ Native iOS/Android code - No changes needed
- ✅ EAS build configuration - No changes needed

---

## Quick Reference

### Ad Unit ID Format

```
AdMob:  ca-app-pub-3940256099942544/6300978111
GAM:    /21775744923/cn_banner_320x50
```

### Test Ad Units

```typescript
// Google's GAM test network
banner: "/6499/example/banner";
interstitial: "/6499/example/interstitial";
rewarded: "/6499/example/rewarded";
```

### Your Production Ad Units Template

```typescript
cn: {
  banner: "/YOUR_NETWORK_CODE/cn_banner_320x50",
  largeBanner: "/YOUR_NETWORK_CODE/cn_banner_320x100",
  mediumRectangle: "/YOUR_NETWORK_CODE/cn_banner_300x250",
  interstitial: "/YOUR_NETWORK_CODE/cn_interstitial",
  rewarded: "/YOUR_NETWORK_CODE/cn_rewarded",
}
```

---

## Support & Resources

- **GAM Help Center:** https://support.google.com/admanager
- **SDK Documentation:** https://docs.page/invertase/react-native-google-mobile-ads
- **Google Mobile Ads SDK:** https://developers.google.com/admob
- **Internal Documentation:** `docs/admob-integration-guide.md`

---

## Migration Timeline

**Estimated Time:** 1-2 weeks

- **Week 1:** GAM setup, code changes, local testing
- **Week 2:** Integration testing, deployment, monitoring

**Recommended Approach:** Gradual rollout with feature flags for easy rollback if needed.

---

_Last Updated: 2025-10-27_
_Version: 1.0_
