# Quick Start: Testing Deep Links

## The Fix Applied

✅ **Info.plist Updated**: Added `nt` URL scheme to iOS configuration
✅ **Prebuild Script Enhanced**: Now automatically updates URL schemes

## Test Your Deep Link Now

### Step 1: Rebuild the App

```bash
# In Xcode: Product > Clean Build Folder (Cmd+Shift+K)
# Then: Product > Build (Cmd+B)

# Or use command line:
npx expo run:ios
```

### Step 2: Wait for App to Load

Make sure the app is fully loaded in the simulator before testing.

### Step 3: Test the Deep Link

```bash
./scripts/test-deep-link-simulator.sh "nt://community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"
```

## What Should Happen

1. ✅ App opens (if not already open)
2. ✅ Article loads with correct content
3. ✅ Console shows:
   ```
   🔗 Resolving slug to ID: community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025
   ✅ Resolved slug "..." to ID: 345162
   ```

## Alternative: Test HTTPS URL

```bash
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"
```

**Note**: HTTPS URLs may open Safari in development builds. This is normal. They will work properly in production builds.

## If It Still Doesn't Work

### 1. Verify Info.plist

Check that `ios/emap/Info.plist` contains:

```xml
<key>CFBundleURLSchemes</key>
<array>
  <string>nt</string>
  <string>emap</string>
  <string>com.emap.app</string>
</array>
```

### 2. Clean Build

```bash
# Stop Metro bundler
# In Xcode: Product > Clean Build Folder
# Delete app from simulator
# Rebuild: npx expo run:ios
```

### 3. Check Logs

Look for these in Metro bundler output:

```
🔗 Resolving slug to ID: ...
🔗 API call: ...
✅ Resolved slug "..." to ID: ...
```

## Testing Other URLs

```bash
# Different article
./scripts/test-deep-link-simulator.sh "nt://clinical-archive/infection-control/article-name/"

# With trailing slash
./scripts/test-deep-link-simulator.sh "nt://community-nursing/article/"

# Without trailing slash
./scripts/test-deep-link-simulator.sh "nt://community-nursing/article"
```

## For Future Brand Switches

When switching brands, always run:

```bash
# 1. Run prebuild for the brand
node scripts/prebuild.js cn  # or jnl, nt

# 2. Rebuild iOS
npx expo run:ios

# 3. Test deep link
./scripts/test-deep-link-simulator.sh "cn://article-slug/"
```

The prebuild script now automatically updates the URL scheme in Info.plist!

## Verification

Run the automated tests:

```bash
node scripts/test-deep-linking.js
```

Should show: **🎉 All tests passed!**

## Need Help?

See detailed guides:

- [Deep Linking Simulator Testing Steps](./deep-linking-simulator-testing-steps.md)
- [Deep Linking Testing Guide](./deep-linking-testing-guide.md)
- [Deep Linking Setup Guide](./deep-linking-setup-guide.md)
