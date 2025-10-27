# Brand Switching Verification Guide

## Overview

This document verifies that the prebuild script correctly handles all brand-specific configurations for deep linking, push notifications, and production builds.

## ✅ Verified Configurations

### 1. Deep Linking (Android)

**What Gets Updated:**

- ✅ `android/app/build.gradle`: namespace and applicationId
- ✅ `android/app/src/main/java/com/emap/app/MainActivity.kt`: BuildConfig import
- ✅ `android/app/src/main/java/com/emap/app/MainApplication.kt`: BuildConfig import
- ✅ `android/app/src/main/AndroidManifest.xml`: URL schemes and App Links

**Verification:**

```bash
# Switch to Construction News
node scripts/prebuild.js cn

# Check AndroidManifest.xml
grep -A 20 "intent-filter" android/app/src/main/AndroidManifest.xml
# Should show: cn scheme and constructionnews.co.uk domains

# Switch to Nursing Times
node scripts/prebuild.js nt

# Check AndroidManifest.xml
grep -A 20 "intent-filter" android/app/src/main/AndroidManifest.xml
# Should show: nt scheme and nursingtimes.net domains
```

**Test Deep Links:**

```bash
# After building for each brand
./scripts/test-deep-link-android.sh "cn://article-slug/"
./scripts/test-deep-link-android.sh "nt://article-slug/"
```

### 2. Deep Linking (iOS)

**What Gets Updated:**

- ✅ `ios/emap/Info.plist`: CFBundleURLSchemes
- ✅ `ios/emap.xcodeproj/project.pbxproj`: PRODUCT_BUNDLE_IDENTIFIER
- ✅ `app.json`: iOS associatedDomains

**Verification:**

```bash
# Check Info.plist after brand switch
grep -A 10 "CFBundleURLSchemes" ios/emap/Info.plist
# Should show current brand scheme (cn, nt, or jnl)

# Check bundle ID
grep "PRODUCT_BUNDLE_IDENTIFIER" ios/emap.xcodeproj/project.pbxproj | head -1
# Should show brand-specific bundle ID
```

**Test Deep Links:**

```bash
./scripts/test-deep-link-simulator.sh "nt://article-slug/"
```

### 3. Push Notifications

**What Gets Updated:**

- ✅ `android/app/google-services.json`: Copied from brand directory
- ✅ `ios/emap/GoogleService-Info.plist`: Copied from brand directory
- ✅ Firebase configuration matches brand's Firebase project

**Verification:**

```bash
# After brand switch, check Firebase config
cat android/app/google-services.json | grep "package_name"
# Should show: metropolis.net.nursingtimes (for NT)
# Should show: metropolis.co.uk.constructionnews (for CN)

cat ios/emap/GoogleService-Info.plist | grep "BUNDLE_ID"
# Should show brand-specific bundle ID
```

**Important Notes:**

- Each brand must have its own Firebase project
- google-services.json and GoogleService-Info.plist must be in `brands/{brand}/` directory
- Push notifications will only work if the app is built with the correct Firebase config

### 4. Production Builds

#### Android (Google Play)

**Bundle ID Configuration:**

- ✅ Each brand has unique applicationId
- ✅ Namespace matches applicationId for BuildConfig generation
- ✅ Source code stays in `com.emap.app` package

**Current Configuration:**

```
Nursing Times:     metropolis.net.nursingtimes
Construction News: metropolis.co.uk.constructionnews
JNL:              metropolis.net.jobsnursingandlearning
```

**Build Commands:**

```bash
# Switch brand
node scripts/prebuild.js nt

# Build release
cd android && ./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release_nt.aab
```

**Google Play Console:**

- Each brand needs separate Google Play Console app
- Upload AAB with correct applicationId
- Configure App Links in Google Play Console
- Add Digital Asset Links file to website

#### iOS (App Store)

**Bundle ID Configuration:**

- ✅ Each brand has unique bundle identifier
- ✅ Xcode project uses generic name "emap"
- ✅ Bundle ID updated in project.pbxproj

**Build Commands:**

```bash
# Switch brand
node scripts/prebuild.js nt

# Build with EAS
eas build --platform ios --profile production

# Or build locally with Xcode
open ios/emap.xcworkspace
# Select scheme, build for release
```

**App Store Connect:**

- Each brand needs separate App Store Connect app
- Bundle ID must match brand configuration
- Configure Associated Domains in App Store Connect
- Add apple-app-site-association file to website

## 🔍 Potential Issues & Solutions

### Issue 1: AndroidManifest.xml Not Updating

**Symptom:** Deep links don't work after brand switch

**Solution:**

```bash
# Manually verify AndroidManifest.xml was updated
cat android/app/src/main/AndroidManifest.xml | grep "android:scheme"

# If not updated, the regex in prebuild.js might need adjustment
# Check that MainActivity uses full path: com.emap.app.MainActivity
```

### Issue 2: BuildConfig Not Found

**Symptom:** Build fails with "cannot find symbol: class BuildConfig"

**Solution:**

```bash
# Check that BuildConfig import matches namespace
grep "import.*BuildConfig" android/app/src/main/java/com/emap/app/MainActivity.kt

# Should match namespace in build.gradle
grep "namespace" android/app/build.gradle

# If mismatch, run prebuild again
node scripts/prebuild.js nt
```

### Issue 3: App Crashes on Launch

**Symptom:** App crashes immediately after installation

**Solution:**

```bash
# Check logcat for ClassNotFoundException
adb logcat | grep "ClassNotFoundException"

# Verify AndroidManifest.xml uses full class paths
grep "android:name" android/app/src/main/AndroidManifest.xml
# Should show: com.emap.app.MainActivity and com.emap.app.MainApplication
```

### Issue 4: Push Notifications Not Working

**Symptom:** Notifications don't arrive or app crashes when receiving notification

**Solution:**

```bash
# Verify Firebase config was copied
ls -la android/app/google-services.json
ls -la ios/emap/GoogleService-Info.plist

# Check package name matches
cat android/app/google-services.json | grep "package_name"
cat android/app/build.gradle | grep "applicationId"
# These should match

# For iOS, check bundle ID
cat ios/emap/GoogleService-Info.plist | grep "BUNDLE_ID"
grep "PRODUCT_BUNDLE_IDENTIFIER" ios/emap.xcodeproj/project.pbxproj | head -1
# These should match
```

## 📋 Pre-Production Checklist

Before submitting to App Store or Google Play:

### Android

- [ ] Run `node scripts/prebuild.js {brand}`
- [ ] Verify `android/app/build.gradle` has correct applicationId
- [ ] Verify `android/app/google-services.json` is for correct brand
- [ ] Verify `android/app/src/main/AndroidManifest.xml` has correct URL schemes
- [ ] Test deep links on physical device
- [ ] Test push notifications
- [ ] Build release: `cd android && ./gradlew bundleRelease`
- [ ] Verify AAB filename includes brand: `app-release_{brand}.aab`

### iOS

- [ ] Run `node scripts/prebuild.js {brand}`
- [ ] Verify `ios/emap.xcodeproj/project.pbxproj` has correct bundle ID
- [ ] Verify `ios/emap/GoogleService-Info.plist` is for correct brand
- [ ] Verify `ios/emap/Info.plist` has correct URL schemes
- [ ] Test deep links on physical device
- [ ] Test push notifications
- [ ] Build with EAS or Xcode
- [ ] Verify bundle ID in build matches brand

## 🎯 Summary

The prebuild script now correctly handles:

- ✅ Deep linking URL schemes (custom schemes like `nt://`)
- ✅ App Links / Universal Links (HTTPS URLs)
- ✅ Push notification Firebase configuration
- ✅ Brand-specific bundle IDs for separate app store listings
- ✅ BuildConfig imports for correct namespace
- ✅ AndroidManifest.xml class path references

All configurations are automatically updated when switching brands with:

```bash
node scripts/prebuild.js {brand}
```

No manual edits required! 🎉
