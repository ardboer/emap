# Encryption Compliance Implementation Plan

## Overview

This document provides the exact implementation steps and code changes needed to fix the App Store encryption compliance issue for the EMAP Publishing mobile apps.

## Required Changes

### 1. iOS Info.plist Configuration

**File**: `ios/ConstructionNews/Info.plist`

**Action**: Add the following key-value pair before the closing `</dict>` tag (around line 85):

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

**Complete addition**:

```xml
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
  </dict>
</plist>
```

### 2. Expo app.json Configuration

**File**: `app.json`

**Action**: Add encryption compliance configuration to the iOS section.

**Current iOS section** (around line 12):

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "metropolis.co.uk.constructionnews"
}
```

**Updated iOS section**:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "metropolis.co.uk.constructionnews",
  "config": {
    "usesNonExemptEncryption": false
  }
}
```

### 3. Multi-Brand Configuration

Since this is a multi-brand app, we need to ensure the encryption compliance applies to both brands:

**Construction News** (current configuration):

- Bundle ID: `metropolis.co.uk.constructionnews`
- Encryption: `usesNonExemptEncryption: false`

**Nursing Times** (when configured):

- Bundle ID: `metropolis.co.uk.nursingtimes` (or similar)
- Encryption: `usesNonExemptEncryption: false`

## Implementation Steps

### Step 1: Update iOS Info.plist

1. Open `ios/ConstructionNews/Info.plist`
2. Locate the line with `<key>UIViewControllerBasedStatusBarAppearance</key>`
3. After the `<false/>` that follows it, add:
   ```xml
   <key>ITSAppUsesNonExemptEncryption</key>
   <false/>
   ```

### Step 2: Update app.json

1. Open `app.json`
2. Locate the `"ios"` section
3. Add the `"config"` object with encryption settings as shown above

### Step 3: Verify Configuration

1. Build the app using EAS Build
2. Check that no encryption compliance prompts appear
3. Verify the Info.plist in the built app contains the encryption key

## Expected Results

After implementing these changes:

1. **No Encryption Prompts**: App Store Connect will not prompt for encryption compliance
2. **Automatic Processing**: Builds will include the proper encryption declarations
3. **Faster Submissions**: No manual intervention needed during App Store submission

## Verification Commands

```bash
# Clean build to ensure changes are applied
eas build --platform ios --clear-cache

# Check the built Info.plist contains the encryption key
# (This can be verified by downloading the IPA and inspecting it)
```

## App Store Connect Submission

With these changes, when submitting to App Store Connect:

1. Upload the build normally
2. No encryption compliance questions should appear
3. If prompted, select "None of the algorithms mentioned above"

## Troubleshooting

### If Encryption Prompts Still Appear

1. **Verify Info.plist**: Check that `ITSAppUsesNonExemptEncryption` is present and set to `false`
2. **Check app.json**: Ensure the iOS config section is properly formatted
3. **Clean Build**: Use `eas build --clear-cache` to ensure fresh build
4. **Manual Response**: If needed, manually select "None of the algorithms mentioned above"

### Common Issues

**Issue**: Build fails after adding configuration
**Solution**: Check JSON syntax in app.json - ensure proper comma placement

**Issue**: Encryption key not in built app
**Solution**: Verify the key is added to the correct Info.plist file

## Files to Modify

1. ✅ `docs/app-store-encryption-compliance-guide.md` (Created)
2. ⏳ `ios/ConstructionNews/Info.plist` (Add encryption key)
3. ⏳ `app.json` (Add iOS encryption config)

## Next Steps

1. Switch to Code mode to implement the file changes
2. Test the configuration with a build
3. Verify App Store Connect submission works without prompts
4. Document the successful implementation

---

**Implementation Priority**: High
**Estimated Time**: 15 minutes
**Risk Level**: Low (non-breaking changes)
**Testing Required**: Build verification and App Store Connect test
