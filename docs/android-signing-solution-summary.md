# Android Signing Issue - Solution Summary

## Problem Solved ✅

**Issue**: When building Construction News brand after using prebuild script, Google Play Console rejected the AAB with error:

- Expected SHA1: `2F:61:DF:B5:4C:88:39:29:F6:58:3D:2F:18:49:29:63:CD:0C:78:0F`
- Received SHA1: `53:38:F9:D4:D2:98:17:E6:D7:C1:68:01:0D:EF:89:48:1D:A1:0A:17`

**Root Cause**: The prebuild script was correctly switching the keystore alias, but there was a configuration mismatch causing the wrong certificate to be used.

## Solution Implemented

### 1. Keystore Analysis ✅

- Verified keystore contains both required aliases:
  - `construction-news-key` (SHA1: `2F:61:DF:B5:4C:88:39:29:F6:58:3D:2F:18:49:29:63:CD:0C:78:0F`)
  - `nursing-times-key` (SHA1: `53:38:F9:D4:D2:98:17:E6:D7:C1:68:01:0D:EF:89:48:1D:A1:0A:17`)

### 2. Configuration Fix ✅

- Fixed gradle.properties alias switching in prebuild script
- Added verification that correct alias is being used
- Implemented proper build artifact cleaning

### 3. Build Process Fix ✅

- Fixed AAB renaming logic to prevent duplicate suffixes
- Ensured clean builds use correct signing configuration
- Verified AAB files are signed with correct certificates

### 4. Verification Tools ✅

Created comprehensive verification and troubleshooting scripts:

- `scripts/verify-keystore-config.js` - Diagnose configuration issues
- `scripts/fix-signing-issue.js` - Automatically fix common problems

### 5. Documentation ✅

- Complete keystore management guide
- Troubleshooting procedures
- Emergency response protocols

## Quick Fix Commands

### For Construction News Build

```bash
# 1. Switch to Construction News brand
node scripts/prebuild.js cn

# 2. Fix any signing issues
node scripts/fix-signing-issue.js

# 3. Clean build
cd android && rm -rf .gradle build app/build app/.cxx && cd ..

# 4. Build release bundle
cd android && ./gradlew bundleRelease

# 5. Verify signing (should show Construction News certificate)
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release_cn.aab
```

### For Nursing Times Build

```bash
# 1. Switch to Nursing Times brand
node scripts/prebuild.js nt

# 2. Fix any signing issues
node scripts/fix-signing-issue.js

# 3. Clean build
cd android && rm -rf .gradle build app/build app/.cxx && cd ..

# 4. Build release bundle
cd android && ./gradlew bundleRelease

# 5. Verify signing (should show Nursing Times certificate)
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release_nt.aab
```

## Verification Commands

### Check Current Configuration

```bash
# Show current brand
cat config/brandKey.ts

# Show gradle signing config
grep "MYAPP_RELEASE" android/gradle.properties

# Verify keystore aliases
keytool -list -keystore android/app/emap-master-upload-key.keystore -storepass If435i34344df8T
```

### Get Certificate Fingerprints

```bash
# Construction News fingerprint
keytool -list -v -alias construction-news-key -keystore android/app/emap-master-upload-key.keystore -storepass If435i34344df8T | grep "SHA1:"

# Nursing Times fingerprint
keytool -list -v -alias nursing-times-key -keystore android/app/emap-master-upload-key.keystore -storepass If435i34344df8T | grep "SHA1:"
```

### Verify AAB Signing

```bash
# Check which certificate was used to sign the AAB
jarsigner -verify -verbose -certs /path/to/app-release_cn.aab | grep "CN="
```

## Expected Results

### Construction News (CN)

- **Keystore Alias**: `construction-news-key`
- **SHA1 Fingerprint**: `2F:61:DF:B5:4C:88:39:29:F6:58:3D:2F:18:49:29:63:CD:0C:78:0F`
- **Bundle ID**: `metropolis.co.uk.constructionnews`
- **AAB File**: `app-release_cn.aab`

### Nursing Times (NT)

- **Keystore Alias**: `nursing-times-key`
- **SHA1 Fingerprint**: `53:38:F9:D4:D2:98:17:E6:D7:C1:68:01:0D:EF:89:48:1D:A1:0A:17`
- **Bundle ID**: `metropolis.net.nursingtimes`
- **AAB File**: `app-release_nt.aab`

## Test Results ✅

Successfully built and verified Construction News AAB:

- ✅ Correct alias used: `construction-news-key`
- ✅ Correct SHA1 fingerprint: `2F:61:DF:B5:4C:88:39:29:F6:58:3D:2F:18:49:29:63:CD:0C:78:0F`
- ✅ AAB file signed and verified
- ✅ File copied to Desktop: `app-release_cn.aab`

## Files Modified/Created

### Scripts Created

- `scripts/verify-keystore-config.js` - Configuration verification
- `scripts/fix-signing-issue.js` - Automatic problem resolution

### Configuration Fixed

- `android/app/build.gradle` - Fixed AAB renaming logic
- `android/gradle.properties` - Verified signing configuration

### Documentation Created

- `docs/android-keystore-management-guide.md` - Comprehensive guide
- `docs/android-signing-solution-summary.md` - This summary

## Next Steps

1. **Upload to Google Play Console**: Use the correctly signed `app-release_cn.aab` file
2. **Test Both Brands**: Verify both CN and NT builds work correctly
3. **Update CI/CD**: Integrate verification scripts into build pipeline
4. **Team Training**: Share documentation with development team

## Prevention

To prevent this issue in the future:

1. Always run `node scripts/verify-keystore-config.js` before building
2. Use `node scripts/fix-signing-issue.js` if any issues are detected
3. Verify AAB signing before uploading to stores
4. Keep keystore and certificates backed up securely

---

**Status**: ✅ RESOLVED
**Date**: October 2, 2025
**Verified**: Construction News AAB successfully signed with correct certificate
