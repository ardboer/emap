# Deep Linking Testing Guide

## Quick Start

### Testing in iOS Simulator

Use the provided script to test deep links:

```bash
# Test a Universal Link (HTTPS)
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"

# Test a Custom Scheme
./scripts/test-deep-link-simulator.sh "nt://community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"
```

### Prerequisites

1. **Start the app in simulator**:

   ```bash
   npm run ios
   ```

2. **Wait for app to load** completely before testing deep links

## Testing Methods

### Method 1: Using the Test Script (Recommended)

The easiest way to test deep links:

```bash
./scripts/test-deep-link-simulator.sh "YOUR_URL_HERE"
```

**Example**:

```bash
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/community-nursing/article-title-24-10-2025/"
```

### Method 2: Using xcrun simctl Directly

```bash
# Get booted device ID
xcrun simctl list devices | grep Booted

# Open URL (replace DEVICE_ID with actual ID)
xcrun simctl openurl DEVICE_ID "https://www.nursingtimes.net/community-nursing/article-title/"
```

### Method 3: Using Safari in Simulator

1. Open Safari in the iOS Simulator
2. Type or paste the URL in the address bar
3. Press Enter
4. If Universal Links are configured correctly, the app should open

### Method 4: Using Notes App in Simulator

1. Open Notes app in simulator
2. Create a new note
3. Type or paste the URL
4. Tap the link
5. App should open if deep linking is configured

## What to Expect

### ✅ Successful Deep Link

When a deep link works correctly:

1. **App opens** (if not already open)
2. **Article loads** with the correct content
3. **Console shows** deep link handling logs:
   ```
   🔗 Resolving slug to ID: community-nursing/article-title-24-10-2025
   🔗 API call: https://www.nursingtimes.net/wp-json/mbm-apps/v1/get-post-by-slug/...
   ✅ Resolved slug "..." to ID: 12345
   ```

### ❌ Common Issues

#### Issue: Safari Opens Instead of App

**Cause**: Universal Links not properly configured

**Solutions**:

1. Check `app.json` has correct `associatedDomains`:

   ```json
   "ios": {
     "associatedDomains": [
       "applinks:www.nursingtimes.net",
       "applinks:nursingtimes.net"
     ]
   }
   ```

2. Verify website has `apple-app-site-association` file at:

   ```
   https://www.nursingtimes.net/.well-known/apple-app-site-association
   ```

3. Rebuild the app:
   ```bash
   npm run ios
   ```

#### Issue: App Opens But No Article Loads

**Cause**: Deep link handling code issue

**Solutions**:

1. Check Metro bundler logs for errors
2. Verify `getPostBySlug()` API is working
3. Check the slug extraction logic
4. Ensure article ID is being passed to navigation

#### Issue: Nothing Happens

**Cause**: App not installed or custom scheme not registered

**Solutions**:

1. Ensure app is installed in simulator
2. Check `app.json` has correct `scheme`:
   ```json
   "scheme": "nt"
   ```
3. Rebuild the app

## Testing Different URL Formats

### Universal Links (HTTPS)

```bash
# With www
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/community-nursing/article/"

# Without www
./scripts/test-deep-link-simulator.sh "https://nursingtimes.net/community-nursing/article/"

# With trailing slash
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/article/"

# Without trailing slash
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/article"

# With query parameters
./scripts/test-deep-link-simulator.sh "https://www.nursingtimes.net/article/?utm_source=test"
```

### Custom Schemes

```bash
# Basic format
./scripts/test-deep-link-simulator.sh "nt://community-nursing/article/"

# Without trailing slash
./scripts/test-deep-link-simulator.sh "nt://community-nursing/article"

# Nested categories
./scripts/test-deep-link-simulator.sh "nt://clinical-archive/infection-control/article/"
```

## Testing on Physical Devices

### iOS Device

1. **Build and install** the app on your device
2. **Send yourself** the URL via:
   - iMessage
   - Email
   - Notes (synced via iCloud)
3. **Tap the link** in the message/email/note
4. App should open and load the article

### Android Device

1. **Build and install** the app on your device
2. **Send yourself** the URL via:
   - SMS
   - Email
   - Any messaging app
3. **Tap the link**
4. Android may show a dialog asking which app to open with
5. Select your app
6. Article should load

## Debugging Deep Links

### Enable Debug Logging

Check Metro bundler output for deep link logs:

```bash
# In your terminal running Metro
# Look for these log messages:
🔗 Resolving slug to ID: ...
🔗 API call: ...
✅ Resolved slug "..." to ID: ...
```

### Check API Response

Test the API endpoint directly:

```bash
curl "https://www.nursingtimes.net/wp-json/mbm-apps/v1/get-post-by-slug/?slug=community-nursing/article-title-24-10-2025&hash=YOUR_HASH&_fields=id"
```

### Verify URL Parsing

Use the test script to verify URL parsing:

```bash
node scripts/test-deep-linking.js
```

## Testing Checklist

Before deploying, test these scenarios:

- [ ] Universal Link with www
- [ ] Universal Link without www
- [ ] Universal Link with trailing slash
- [ ] Universal Link without trailing slash
- [ ] Universal Link with query parameters
- [ ] Custom scheme URL
- [ ] Article from different categories
- [ ] Event URLs (if applicable)
- [ ] Invalid/non-existent article URLs
- [ ] URLs from different brands (CN, JNL, NT)

## Automated Testing

Run the automated test suite:

```bash
node scripts/test-deep-linking.js
```

This verifies:

- URL parsing logic
- app.json configuration
- Brand domain mappings

## Additional Resources

- [Deep Linking Setup Guide](./deep-linking-setup-guide.md) - Complete setup instructions
- [Apple Universal Links Documentation](https://developer.apple.com/ios/universal-links/)
- [Android App Links Documentation](https://developer.android.com/training/app-links)

## Support

If deep linking isn't working:

1. Run the test script: `node scripts/test-deep-linking.js`
2. Check the troubleshooting section above
3. Review Metro bundler logs
4. Verify API endpoint is accessible
5. Ensure app.json configuration is correct
