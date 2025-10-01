# App Store Encryption Compliance Guide

## Overview

This guide explains how to handle Apple's App Store encryption compliance requirements for the EMAP Publishing mobile apps (Construction News & Nursing Times).

## Encryption Analysis

Our apps use only standard encryption methods:

- **HTTPS Communication**: Standard TLS/SSL for API calls to WordPress backend
- **Local Storage**: React Native AsyncStorage (standard device storage)
- **No Custom Encryption**: No proprietary or non-standard encryption algorithms

**Compliance Category**: "None of the algorithms mentioned above"

## Apple's Encryption Compliance Requirements

When submitting to the App Store, Apple asks about encryption usage:

> **What type of encryption algorithms does your app implement?**
>
> - [ ] Encryption algorithms that are proprietary or not accepted as standard by international standard bodies (IEEE, IETF, ITU, etc.)
> - [ ] Standard encryption algorithms instead of, or in addition to, using or accessing the encryption within Apple's operating system
> - [ ] Both algorithms mentioned above
> - [x] **None of the algorithms mentioned above**

## Solution Implementation

### 1. iOS Info.plist Configuration

The following keys have been added to `ios/ConstructionNews/Info.plist`:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

**Explanation**:

- `ITSAppUsesNonExemptEncryption`: Set to `false` because our app only uses standard HTTPS and doesn't implement any non-exempt encryption

### 2. Expo app.json Configuration

The following configuration has been added to `app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

**Benefits**:

- Automatically configures the Info.plist during Expo builds
- Prevents encryption compliance prompts during App Store Connect submission
- Ensures consistent configuration across all builds

### 3. Multi-Brand Considerations

Since this is a multi-brand app (Construction News & Nursing Times), the encryption compliance settings apply to both brands:

- Both apps use identical encryption methods (HTTPS only)
- Both qualify for the same compliance category
- The configuration will be applied to both brand builds automatically

## App Store Connect Submission

### During Submission

With the proper configuration in place:

1. **No Encryption Prompt**: App Store Connect will not prompt for encryption compliance information
2. **Automatic Processing**: The submission will proceed without manual intervention
3. **Faster Review**: Eliminates potential delays from encryption compliance questions

### If Prompted (Fallback)

If for any reason you're still prompted about encryption:

**Question**: "Does your app use encryption?"
**Answer**: Select "No" - because we only use standard HTTPS

**Question**: "Does your app implement any encryption algorithms?"
**Answer**: Select "None of the algorithms mentioned above"

## Technical Details

### What Qualifies as "Non-Exempt" Encryption

Apps that would need export compliance documentation:

- ❌ Custom encryption algorithms
- ❌ End-to-end messaging encryption
- ❌ Proprietary data encryption
- ❌ Authentication protocols beyond standard HTTPS
- ❌ VPN or tunneling protocols

### What Our App Uses (Exempt)

- ✅ Standard HTTPS/TLS for API communication
- ✅ React Native AsyncStorage (standard device storage)
- ✅ Standard iOS/Android system encryption
- ✅ No custom cryptographic implementations

## Verification Steps

### 1. Build Verification

After implementing the configuration:

```bash
# Build the app
eas build --platform ios --profile production

# Verify Info.plist contains the encryption keys
# Check build logs or download the IPA to inspect
```

### 2. App Store Connect Verification

1. Upload the build to App Store Connect
2. Create a new app version
3. Verify no encryption compliance prompts appear
4. Proceed with normal app review submission

### 3. Testing Checklist

- [ ] Build completes without encryption warnings
- [ ] Info.plist contains `ITSAppUsesNonExemptEncryption: false`
- [ ] App Store Connect submission proceeds without encryption prompts
- [ ] App functions normally (HTTPS API calls work)

## Troubleshooting

### If You Still Get Encryption Prompts

1. **Verify Info.plist**: Ensure the encryption keys are present in the built app
2. **Check Expo Configuration**: Verify `app.json` has the correct iOS config
3. **Clean Build**: Try a clean build with `eas build --clear-cache`
4. **Manual Override**: If needed, manually answer "No" to encryption questions

### Common Issues

**Issue**: "App uses encryption but no compliance info provided"
**Solution**: Verify `ITSAppUsesNonExemptEncryption` is set to `false` in Info.plist

**Issue**: "Encryption compliance required"
**Solution**: Double-check that no custom encryption libraries are included in dependencies

## Compliance Documentation

### For Apple Review

If Apple requests additional information:

**App Description**: "This app is a news reader that uses only standard HTTPS for communication with our WordPress backend. No custom encryption algorithms are implemented."

**Encryption Usage**: "The app uses only standard HTTPS/TLS encryption provided by the iOS operating system for API communication. No additional encryption algorithms are implemented."

### For Internal Records

- **Compliance Category**: ITSAppUsesNonExemptEncryption = false
- **Encryption Methods**: Standard HTTPS only
- **Export Classification**: No export license required
- **Review Date**: [Current Date]
- **Reviewed By**: [Your Name/Team]

## Future Considerations

### Adding New Features

If you plan to add features that might involve encryption:

- **Push Notifications**: Standard APNs is exempt
- **User Authentication**: Standard OAuth/JWT is typically exempt
- **File Encryption**: Would require compliance review
- **Messaging Features**: End-to-end encryption would require compliance

### Regular Reviews

- Review encryption usage annually
- Update compliance documentation when adding new features
- Monitor Apple's encryption policy changes

## References

- [Apple's Encryption Export Compliance](https://developer.apple.com/documentation/security/complying_with_encryption_export_regulations)
- [Expo Encryption Compliance Guide](https://docs.expo.dev/distribution/app-stores/#encryption-compliance)
- [U.S. Export Administration Regulations](https://www.bis.doc.gov/index.php/policy-guidance/encryption)

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Applies To**: Construction News & Nursing Times mobile apps
