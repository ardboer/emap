# Firebase iOS Device Configuration Fix

## Problem

When running the app on an iOS physical device, the app crashes with:

```
*** Terminating app due to uncaught exception 'com.firebase.core', reason: '`FirebaseApp.configure()` could not find a valid GoogleService-Info.plist in your project.
```

## Root Cause

The `GoogleService-Info.plist` file existed in the filesystem at `ios/emap/GoogleService-Info.plist` but was **not included in the Xcode project build resources**. This meant:

- ✅ The file was physically present in the directory
- ❌ The file was not referenced in `project.pbxproj`
- ❌ The file was not bundled with the app during device builds
- ✅ Simulator builds might work (different build process)

## Solution

Updated the `scripts/prebuild.js` script to automatically add `GoogleService-Info.plist` to the Xcode project when copying Firebase configuration files.

### Changes Made

Added a new function `addGoogleServiceInfoToXcode()` that:

1. Checks if the file is already in the Xcode project
2. Generates unique IDs for file references
3. Adds the file to four critical sections of `project.pbxproj`:
   - **PBXFileReference**: Creates the file reference
   - **PBXBuildFile**: Marks it for inclusion in resources
   - **PBXGroup**: Adds it to the emap group (visible in Xcode)
   - **Resources Build Phase**: Ensures it's copied to the app bundle

### How It Works

When you run the prebuild script for any brand:

```bash
node scripts/prebuild.js nt
```

The script now:

1. Copies the brand-specific `GoogleService-Info.plist` from `brands/{brand}/` to `ios/emap/`
2. Automatically adds it to the Xcode project if not already present
3. Ensures the file will be bundled with the app on device builds

## Verification

After running the prebuild script, you can verify the fix:

```bash
# Search for GoogleService-Info.plist in the Xcode project
grep -n "GoogleService-Info.plist" ios/emap.xcodeproj/project.pbxproj
```

You should see 4 references:

1. In PBXBuildFile section (line ~17)
2. In PBXFileReference section (line ~35)
3. In PBXGroup section (line ~58)
4. In Resources build phase (line ~202)

## Testing

1. Run the prebuild script: `node scripts/prebuild.js nt`
2. Build and run on a physical iOS device
3. Firebase should initialize successfully without crashes

## Multi-Brand Support

This fix works automatically for all brands:

- Each brand can have its own `GoogleService-Info.plist` in `brands/{brand}/`
- The prebuild script copies the correct file when switching brands
- The file is automatically added to Xcode project if needed

## Notes

- The fix only adds the file if it's not already present (idempotent)
- Works with the existing multi-brand architecture
- No manual Xcode intervention required
- Compatible with both local builds and EAS builds
