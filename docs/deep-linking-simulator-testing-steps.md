# Testing Deep Links in iOS Simulator - Step by Step

## The Issue You're Seeing

Error `-10814` means the app isn't registered to handle the custom scheme (`nt://`) yet. This happens because the iOS project needs to be rebuilt after changing the scheme in `app.json`.

## Solution: Rebuild the iOS Project

### Step 1: Clean and Rebuild

```bash
# Stop any running Metro bundler (Ctrl+C)

# Clean the iOS build
cd ios
rm -rf build
pod install
cd ..

# Rebuild and run
npx expo run:ios
```

### Step 2: Wait for App to Load

Wait for the app to fully load in the simulator before testing deep links.

### Step 3: Test Deep Links

Now you can test deep links using any of these methods:

#### Method A: Using the Test Script (Recommended)

```bash
# Test Universal Link (HTTPS)
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"

# Test Custom Scheme
./scripts/test-deep-link-simulator.sh "nt://community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"
```

#### Method B: Using Safari in Simulator

1. Open Safari in the iOS Simulator
2. Type the URL in the address bar:
   ```
   https://www.nursingtimes.net/community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/
   ```
3. Press Enter
4. The app should open and load the article

#### Method C: Using Notes App

1. Open Notes app in simulator
2. Create a new note
3. Paste the URL
4. Tap the link
5. App should open

## What Should Happen

### ✅ Success Indicators

1. **App opens** (if not already open)
2. **Article loads** with the correct content
3. **Console logs show**:
   ```
   🔗 Resolving slug to ID: community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025
   🔗 API call: https://www.nursingtimes.net/wp-json/mbm-apps/v1/get-post-by-slug/...
   ✅ Resolved slug "..." to ID: 345162
   ```

### ❌ If Safari Opens Instead

This means Universal Links aren't working yet. This is expected because:

1. **Server-side configuration needed**: The website needs to host the `apple-app-site-association` file
2. **Production builds only**: Universal Links only work in production builds, not development builds

**For now, use custom schemes** (`nt://`) which work in development.

## Quick Test Commands

```bash
# 1. Rebuild the app
npx expo run:ios

# 2. Wait for app to load completely

# 3. Test custom scheme (works in development)
./scripts/test-deep-link-simulator.sh "nt://community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"

# 4. Test Universal Link (may open Safari in development)
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"
```

## Understanding Development vs Production

### Development Builds (Expo Go / `expo run:ios`)

- ✅ Custom schemes work (`nt://`)
- ❌ Universal Links may not work (opens Safari)
- Reason: iOS requires production builds for Universal Links

### Production Builds (TestFlight / App Store)

- ✅ Custom schemes work (`nt://`)
- ✅ Universal Links work (`https://`)
- Requires: Server-side configuration (`.well-known/apple-app-site-association`)

## Troubleshooting

### Error: "Simulator device failed to open nt://"

**Solution**: Rebuild the iOS project

```bash
npx expo run:ios
```

### Error: "Opening com.emap.app://"

**Solution**: The scheme in app.json doesn't match. Run:

```bash
node scripts/prebuild.js nt
npx expo run:ios
```

### Safari Opens Instead of App

**Expected in development**. Universal Links require:

1. Production build
2. Server-side configuration
3. Valid SSL certificate

**For development testing**, use custom schemes: `nt://`

### App Opens But No Article Loads

Check Metro bundler logs for errors:

```
🔗 Resolving slug to ID: ...
❌ Error fetching post by slug: ...
```

Possible causes:

- Invalid article slug
- API endpoint not accessible
- Network error

## Testing Checklist

Before considering deep linking "working":

- [ ] Rebuild iOS project after scheme change
- [ ] App opens with custom scheme (`nt://`)
- [ ] Article loads with correct content
- [ ] Console shows successful slug resolution
- [ ] Test with different article URLs
- [ ] Test with/without trailing slashes
- [ ] Test with query parameters

## Next Steps

Once custom schemes work in development:

1. **Deploy to TestFlight** to test Universal Links
2. **Configure server-side** `.well-known/apple-app-site-association`
3. **Test on physical device** via TestFlight
4. **Verify Universal Links** work in production

## Additional Resources

- [Deep Linking Setup Guide](./deep-linking-setup-guide.md)
- [Deep Linking Testing Guide](./deep-linking-testing-guide.md)
- [Apple Universal Links Documentation](https://developer.apple.com/ios/universal-links/)
