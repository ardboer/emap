# Android Keystore Management Guide

## Overview

This guide covers the Android keystore setup for the multi-brand EMAP application. The app supports two brands (Construction News and Nursing Times) using a single keystore with different aliases.

## Keystore Structure

### File Location

- **Keystore File**: `android/app/emap-master-upload-key.keystore`
- **Type**: PKCS12
- **Password**: `If435i34344df8T` (stored in `android/gradle.properties`)

### Key Aliases

The keystore contains two aliases for the different brands:

#### Construction News (CN)

- **Alias**: `construction-news-key`
- **SHA1 Fingerprint**: `2F:61:DF:B5:4C:88:39:29:F6:58:3D:2F:18:49:29:63:CD:0C:78:0F`
- **Bundle ID**: `metropolis.co.uk.constructionnews`
- **Google Play Console**: Expects this SHA1 fingerprint

#### Nursing Times (NT)

- **Alias**: `nursing-times-key`
- **SHA1 Fingerprint**: `53:38:F9:D4:D2:98:17:E6:D7:C1:68:01:0D:EF:89:48:1D:A1:0A:17`
- **Bundle ID**: `metropolis.net.nursingtimes`
- **App Store**: Uses this certificate for signing

## Certificate Details

Both certificates share the same issuer information:

- **Owner/Issuer**: `CN=EMAP Publishing Ltd, OU=Mobile Development, O=EMAP Publishing Ltd, L=London, ST=England, C=GB`
- **Algorithm**: SHA384withRSA
- **Key Size**: 2048-bit
- **Valid From**: October 1, 2025
- **Valid Until**: February 16, 2053

## Build Configuration

### Gradle Properties

The signing configuration is managed in `android/gradle.properties`:

```properties
# Release keystore configuration
MYAPP_RELEASE_STORE_FILE=emap-master-upload-key.keystore
MYAPP_RELEASE_KEY_ALIAS=construction-news-key  # Changes based on brand
MYAPP_RELEASE_STORE_PASSWORD=If435i34344df8T
MYAPP_RELEASE_KEY_PASSWORD=If435i34344df8T
```

### Brand Switching

The prebuild script (`scripts/prebuild.js`) automatically updates the key alias based on the active brand:

```javascript
// Determine the correct key alias based on brand
const keyAlias = brand === "cn" ? "construction-news-key" : "nursing-times-key";

// Update the key alias in gradle.properties
gradleContent = gradleContent.replace(
  /MYAPP_RELEASE_KEY_ALIAS=.*/,
  `MYAPP_RELEASE_KEY_ALIAS=${keyAlias}`
);
```

## Verification Commands

### List Keystore Contents

```bash
keytool -list -v -keystore android/app/emap-master-upload-key.keystore -storepass If435i34344df8T
```

### Check Specific Alias

```bash
# Construction News
keytool -list -v -alias construction-news-key -keystore android/app/emap-master-upload-key.keystore -storepass If435i34344df8T

# Nursing Times
keytool -list -v -alias nursing-times-key -keystore android/app/emap-master-upload-key.keystore -storepass If435i34344df8T
```

### Verify AAB Signing

```bash
jarsigner -verify -verbose -certs /path/to/app-release_cn.aab
```

## Troubleshooting

### Common Issues

#### 1. Wrong SHA1 Fingerprint Error

**Error**: Google Play Console shows "signed with wrong key" error.

**Solution**:

1. Verify current brand: `cat config/brandKey.ts`
2. Check gradle.properties has correct alias
3. Run the fix script: `node scripts/fix-signing-issue.js`
4. Clean and rebuild: `cd android && ./gradlew clean bundleRelease`

#### 2. Keystore Not Found

**Error**: `Keystore file not found`

**Solution**:

1. Ensure keystore is in `android/app/emap-master-upload-key.keystore`
2. Check file permissions
3. Verify path in `gradle.properties`

#### 3. Alias Not Found

**Error**: `Alias does not exist`

**Solution**:

1. List keystore contents to verify aliases exist
2. Check spelling of alias name
3. Ensure prebuild script ran successfully

### Verification Scripts

#### Quick Verification

```bash
node scripts/verify-keystore-config.js
```

#### Fix Signing Issues

```bash
node scripts/fix-signing-issue.js
```

## Build Process

### For Construction News

```bash
# 1. Switch to CN brand
node scripts/prebuild.js cn

# 2. Verify configuration
node scripts/verify-keystore-config.js

# 3. Build release bundle
cd android && ./gradlew bundleRelease

# 4. Verify signing
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release_cn.aab
```

### For Nursing Times

```bash
# 1. Switch to NT brand
node scripts/prebuild.js nt

# 2. Verify configuration
node scripts/verify-keystore-config.js

# 3. Build release bundle
cd android && ./gradlew bundleRelease

# 4. Verify signing
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release_nt.aab
```

## Security Notes

1. **Never commit keystore passwords** to version control
2. **Backup the keystore file** securely - losing it means you cannot update the apps
3. **Store passwords** in a secure password manager
4. **Limit access** to the keystore file to authorized personnel only
5. **Monitor certificate expiration** (expires February 16, 2053)

## File Locations

```
android/
├── app/
│   ├── emap-master-upload-key.keystore  # Main keystore file
│   └── build.gradle                     # Build configuration
├── gradle.properties                    # Signing properties
scripts/
├── prebuild.js                         # Brand switching script
├── verify-keystore-config.js           # Verification script
└── fix-signing-issue.js                # Troubleshooting script
```

## Emergency Procedures

### If Keystore is Corrupted

1. **DO NOT PANIC** - you have backups (right?)
2. Restore from secure backup
3. Verify integrity with `keytool -list`
4. Test signing with a debug build

### If Wrong App is Uploaded

1. **DO NOT RELEASE** to production
2. Build correct brand version
3. Verify SHA1 fingerprint matches expected
4. Upload correct AAB file
5. Test thoroughly before release

## Maintenance

### Regular Tasks

- [ ] Verify keystore integrity monthly
- [ ] Check certificate expiration annually
- [ ] Update documentation when adding new brands
- [ ] Test signing process after major Android updates

### Before Each Release

- [ ] Run verification script
- [ ] Check SHA1 fingerprint matches store expectations
- [ ] Verify bundle ID is correct for brand
- [ ] Test AAB file installation

## Support

For keystore-related issues:

1. Run diagnostic scripts first
2. Check this documentation
3. Verify against Google Play Console requirements
4. Contact development team if issues persist

---

**Last Updated**: October 2, 2025
**Version**: 1.0.0
