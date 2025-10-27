# Deep Linking Setup Guide for Website

## Overview

Deep linking allows mobile apps to open specific content directly from web URLs. When a user clicks a link on a website or in an email, the mobile app can intercept that link and open the relevant content within the app instead of the mobile browser.

This guide covers the **website-side configuration** required to enable:

- **iOS Universal Links** - Apple's deep linking mechanism
- **Android App Links** - Google's deep linking mechanism

Both platforms require specific JSON configuration files to be hosted on your web server to verify app ownership and enable deep linking.

---

## Server-Side Configuration Requirements

### Brand Information

| Brand                             | Domain                     | Bundle ID (iOS)                   | Package Name (Android)            |
| --------------------------------- | -------------------------- | --------------------------------- | --------------------------------- |
| **Construction News (CN)**        | www.constructionnews.co.uk | metropolis.co.uk.constructionnews | metropolis.co.uk.constructionnews |
| **Jobs Nursing & Learning (JNL)** | jnl.nursingtimes.net       | metropolis.net.jnl                | metropolis.net.jnl                |
| **Nursing Times (NT)**            | www.nursingtimes.net       | metropolis.net.nursingtimes       | metropolis.net.nursingtimes       |

### Required Files

Each domain must host two files in the `/.well-known/` directory:

1. **`/.well-known/apple-app-site-association`** (iOS Universal Links)
2. **`/.well-known/assetlinks.json`** (Android App Links)

> ⚠️ **Important**: Both files must be accessible via HTTPS without authentication.

---

## iOS Universal Links Setup

### Apple App Site Association (AASA) File

The AASA file tells iOS which apps are authorized to handle links from your domain.

#### File Location

```
https://your-domain.com/.well-known/apple-app-site-association
```

#### Requirements

- ✅ Must be served over **HTTPS**
- ✅ Content-Type: **application/json**
- ✅ **No file extension** (file name is exactly `apple-app-site-association`)
- ✅ Must be accessible without redirects
- ✅ Must not require authentication

#### Getting Your Apple Team ID

The Apple Team ID is required for the AASA file. To find it:

1. Log in to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Membership** section
3. Your **Team ID** is displayed (10-character alphanumeric string, e.g., `A1B2C3D4E5`)

Alternatively, you can find it in Xcode:

1. Open your project in Xcode
2. Select your target
3. Go to **Signing & Capabilities** tab
4. The Team ID is shown next to your team name

### AASA File Examples

#### Construction News (CN)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID_HERE.metropolis.co.uk.constructionnews",
        "paths": ["/article/*", "/event/*"]
      }
    ]
  }
}
```

**File location**: `https://www.constructionnews.co.uk/.well-known/apple-app-site-association`

#### Jobs Nursing & Learning (JNL)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID_HERE.metropolis.net.jnl",
        "paths": ["/article/*", "/event/*"]
      }
    ]
  }
}
```

**File location**: `https://jnl.nursingtimes.net/.well-known/apple-app-site-association`

#### Nursing Times (NT)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID_HERE.metropolis.net.nursingtimes",
        "paths": ["/article/*", "/event/*"]
      }
    ]
  }
}
```

**File location**: `https://www.nursingtimes.net/.well-known/apple-app-site-association`

> 📝 **Note**: Replace `TEAM_ID_HERE` with your actual Apple Team ID (e.g., `A1B2C3D4E5.metropolis.co.uk.constructionnews`)

### Path Patterns

The `paths` array defines which URL patterns should open in the app:

- `/article/*` - All article pages
- `/event/*` - All event pages
- `*` - All pages (use with caution)
- `NOT /admin/*` - Exclude specific paths

---

## Android App Links Setup

### Asset Links JSON File

The assetlinks.json file tells Android which apps are authorized to handle links from your domain.

#### File Location

```
https://your-domain.com/.well-known/assetlinks.json
```

#### Requirements

- ✅ Must be served over **HTTPS**
- ✅ Content-Type: **application/json**
- ✅ Must be accessible without redirects
- ✅ Must not require authentication

#### Getting SHA-256 Fingerprints

SHA-256 fingerprints come from your app's signing certificates. You need fingerprints for:

- **Production certificate** (used for Play Store releases)
- **Debug certificate** (used for development/testing)

The mobile development team will provide these. They can generate them using:

```bash
# For production keystore
keytool -list -v -keystore production.keystore -alias production-key

# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey
```

The SHA-256 fingerprint looks like:

```
A1:B2:C3:D4:E5:F6:78:90:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF
```

> ⚠️ **Important**: You need to convert the fingerprint format by removing colons. The format in assetlinks.json should be:
> `A1B2C3D4E5F67890123456789012ABCDEF1234567890ABCDEF1234567890ABCDEF`

### Asset Links File Examples

#### Construction News (CN)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "metropolis.co.uk.constructionnews",
      "sha256_cert_fingerprints": [
        "PRODUCTION_SHA256_FINGERPRINT_HERE",
        "DEBUG_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**File location**: `https://www.constructionnews.co.uk/.well-known/assetlinks.json`

#### Jobs Nursing & Learning (JNL)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "metropolis.net.jnl",
      "sha256_cert_fingerprints": [
        "PRODUCTION_SHA256_FINGERPRINT_HERE",
        "DEBUG_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**File location**: `https://jnl.nursingtimes.net/.well-known/assetlinks.json`

#### Nursing Times (NT)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "metropolis.net.nursingtimes",
      "sha256_cert_fingerprints": [
        "PRODUCTION_SHA256_FINGERPRINT_HERE",
        "DEBUG_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**File location**: `https://www.nursingtimes.net/.well-known/assetlinks.json`

> 📝 **Note**: Replace the placeholder fingerprints with actual SHA-256 certificate fingerprints from your mobile team (without colons).

---

## Server Configuration

### HTTPS Requirements

Both iOS and Android require HTTPS for deep linking verification:

- Valid SSL/TLS certificate
- No certificate errors
- No redirects from HTTP to HTTPS for the `.well-known` files

### Content-Type Headers

Ensure your web server returns the correct Content-Type header for JSON files.

#### Apache Configuration

Add to your `.htaccess` or Apache configuration:

```apache
<IfModule mod_mime.c>
  # iOS Universal Links
  <Files "apple-app-site-association">
    Header set Content-Type "application/json"
  </Files>

  # Android App Links
  <Files "assetlinks.json">
    Header set Content-Type "application/json"
  </Files>
</IfModule>
```

#### Nginx Configuration

Add to your Nginx server block:

```nginx
location /.well-known/apple-app-site-association {
    default_type application/json;
    add_header Content-Type application/json;
}

location /.well-known/assetlinks.json {
    default_type application/json;
    add_header Content-Type application/json;
}
```

### CORS Headers (Optional but Recommended)

While not strictly required, CORS headers can help with validation tools:

```apache
# Apache
Header set Access-Control-Allow-Origin "*"
```

```nginx
# Nginx
add_header Access-Control-Allow-Origin "*";
```

### No Authentication

The `.well-known` directory must be publicly accessible without:

- HTTP Basic Authentication
- IP restrictions
- Login requirements
- Rate limiting (for validation tools)

---

## Verification Steps

### iOS Universal Links Verification

#### Apple's AASA Validator

Use Apple's official validator tool:

- **URL**: https://search.developer.apple.com/appsearch-validation-tool/

**Steps**:

1. Enter your domain URL (e.g., `https://www.constructionnews.co.uk`)
2. Click "Validate"
3. Check for any errors or warnings

#### Manual Testing

```bash
# Download and inspect the AASA file
curl -I https://www.constructionnews.co.uk/.well-known/apple-app-site-association

# Should return:
# HTTP/2 200
# content-type: application/json
```

#### Testing URLs for Each Brand

| Brand   | Validation URL                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------- |
| **CN**  | https://search.developer.apple.com/appsearch-validation-tool/?url=https://www.constructionnews.co.uk |
| **JNL** | https://search.developer.apple.com/appsearch-validation-tool/?url=https://jnl.nursingtimes.net       |
| **NT**  | https://search.developer.apple.com/appsearch-validation-tool/?url=https://www.nursingtimes.net       |

### Android App Links Verification

#### Google's Digital Asset Links Tester

Use Google's official testing tool:

- **URL**: https://digitalassetlinks.googleapis.com/v1/statements:list

**Steps**:

1. Construct the API URL:
   ```
   https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.constructionnews.co.uk&relation=delegate_permission/common.handle_all_urls
   ```
2. Open in browser or use curl
3. Verify the response includes your package name and fingerprints

#### Manual Testing

```bash
# Download and inspect the assetlinks.json file
curl -I https://www.constructionnews.co.uk/.well-known/assetlinks.json

# Should return:
# HTTP/2 200
# content-type: application/json
```

#### Testing URLs for Each Brand

**Construction News (CN)**:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.constructionnews.co.uk&relation=delegate_permission/common.handle_all_urls
```

**Jobs Nursing & Learning (JNL)**:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://jnl.nursingtimes.net&relation=delegate_permission/common.handle_all_urls
```

**Nursing Times (NT)**:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.nursingtimes.net&relation=delegate_permission/common.handle_all_urls
```

---

## Information Needed from Mobile Team

Before you can complete the configuration files, you need the following information from the mobile development team:

### For iOS (All Brands)

- [ ] **Apple Team ID** (10-character alphanumeric string)
  - Example: `A1B2C3D4E5`
  - Found in Apple Developer Portal under Membership

### For Android (Each Brand)

- [ ] **Production SHA-256 Fingerprint** (for Play Store builds)
  - Format: 64-character hex string without colons
  - Example: `A1B2C3D4E5F67890123456789012ABCDEF1234567890ABCDEF1234567890ABCDEF`
- [ ] **Debug SHA-256 Fingerprint** (for development/testing)
  - Format: Same as production
  - Used for testing deep links before production release

### Checklist Template for Mobile Team

Send this to your mobile team:

```
Hi Mobile Team,

We need the following information to set up deep linking on the website:

iOS Universal Links:
- [ ] Apple Team ID: _______________

Android App Links (Construction News):
- [ ] Production SHA-256 fingerprint: _______________
- [ ] Debug SHA-256 fingerprint: _______________

Android App Links (Jobs Nursing & Learning):
- [ ] Production SHA-256 fingerprint: _______________
- [ ] Debug SHA-256 fingerprint: _______________

Android App Links (Nursing Times):
- [ ] Production SHA-256 fingerprint: _______________
- [ ] Debug SHA-256 fingerprint: _______________

Please provide fingerprints without colons (64-character hex string).

Thanks!
```

---

## Troubleshooting

### iOS Universal Links Not Working

#### Issue: AASA file not found (404)

**Solution**:

- Verify file is at exact path: `/.well-known/apple-app-site-association`
- Check file has no extension
- Ensure no redirects are happening

#### Issue: Wrong Content-Type

**Solution**:

- Verify Content-Type header is `application/json`
- Check server configuration (Apache/Nginx)
- Test with: `curl -I https://your-domain.com/.well-known/apple-app-site-association`

#### Issue: Invalid Team ID

**Solution**:

- Verify Team ID is correct 10-character string
- Check Apple Developer Portal membership section
- Format should be: `TEAMID123.com.example.app`

#### Issue: Links open in Safari instead of app

**Possible causes**:

- AASA file not properly configured
- App not installed on device
- User previously chose to open in Safari (long-press link → "Open in Safari")
- iOS cached old AASA file (wait 24 hours or reinstall app)

**Solution**:

- Validate AASA file with Apple's tool
- Reinstall app to clear cache
- Test with a fresh device

### Android App Links Not Working

#### Issue: assetlinks.json not found (404)

**Solution**:

- Verify file is at exact path: `/.well-known/assetlinks.json`
- Ensure file is accessible via HTTPS
- Check for redirects

#### Issue: Wrong Content-Type

**Solution**:

- Verify Content-Type header is `application/json`
- Check server configuration
- Test with: `curl -I https://your-domain.com/.well-known/assetlinks.json`

#### Issue: Invalid SHA-256 fingerprint

**Solution**:

- Verify fingerprint format (no colons, 64 hex characters)
- Ensure you're using the correct certificate fingerprint
- Production and debug certificates have different fingerprints
- Test with Google's Digital Asset Links API

#### Issue: Links open in browser instead of app

**Possible causes**:

- assetlinks.json not properly configured
- App not installed on device
- Wrong SHA-256 fingerprint
- Package name mismatch

**Solution**:

- Validate with Google's Digital Asset Links tester
- Verify package name matches exactly
- Ensure fingerprints are from correct certificates
- Clear app data and reinstall

### Certificate/Fingerprint Issues

#### Issue: Can't find SHA-256 fingerprint

**Solution**:
Mobile team should run:

```bash
keytool -list -v -keystore path/to/keystore -alias key-alias
```

Look for "SHA256:" in the output.

#### Issue: Fingerprint format incorrect

**Solution**:

- Remove all colons from fingerprint
- Should be 64 continuous hex characters
- Example: `A1B2C3...` not `A1:B2:C3:...`

#### Issue: Multiple certificates/fingerprints

**Solution**:

- Include all fingerprints in the `sha256_cert_fingerprints` array
- Typically need both production and debug
- Can include multiple production certificates if you've rotated keys

### General Debugging Tips

1. **Test with curl**:

   ```bash
   # Check if files are accessible
   curl -v https://your-domain.com/.well-known/apple-app-site-association
   curl -v https://your-domain.com/.well-known/assetlinks.json
   ```

2. **Validate JSON syntax**:

   - Use [JSONLint](https://jsonlint.com/) to validate JSON
   - Check for trailing commas, missing brackets

3. **Check SSL certificate**:

   ```bash
   openssl s_client -connect your-domain.com:443 -servername your-domain.com
   ```

4. **Clear caches**:

   - iOS: Reinstall app or wait 24 hours
   - Android: Clear app data or reinstall

5. **Test on fresh device**:
   - Devices cache deep link configurations
   - Testing on a device that's never had the app installed gives cleanest results

---

## Implementation Checklist

Use this checklist to track your implementation:

### Pre-Implementation

- [ ] Obtain Apple Team ID from mobile team
- [ ] Obtain Android SHA-256 fingerprints (production + debug) for all brands
- [ ] Verify HTTPS is working on all domains
- [ ] Verify `.well-known` directory is accessible

### iOS Universal Links

- [ ] Create AASA file for Construction News
- [ ] Create AASA file for Jobs Nursing & Learning
- [ ] Create AASA file for Nursing Times
- [ ] Configure server Content-Type headers
- [ ] Upload files to production servers
- [ ] Validate with Apple's tool (CN)
- [ ] Validate with Apple's tool (JNL)
- [ ] Validate with Apple's tool (NT)

### Android App Links

- [ ] Create assetlinks.json for Construction News
- [ ] Create assetlinks.json for Jobs Nursing & Learning
- [ ] Create assetlinks.json for Nursing Times
- [ ] Configure server Content-Type headers
- [ ] Upload files to production servers
- [ ] Validate with Google's tool (CN)
- [ ] Validate with Google's tool (JNL)
- [ ] Validate with Google's tool (NT)

### Testing

- [ ] Test iOS deep links on physical device (CN)
- [ ] Test iOS deep links on physical device (JNL)
- [ ] Test iOS deep links on physical device (NT)
- [ ] Test Android deep links on physical device (CN)
- [ ] Test Android deep links on physical device (JNL)
- [ ] Test Android deep links on physical device (NT)

### Documentation

- [ ] Document Team ID for future reference
- [ ] Document SHA-256 fingerprints for future reference
- [ ] Share validation URLs with QA team
- [ ] Update deployment documentation

---

## Additional Resources

### Official Documentation

- [Apple Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)

### Validation Tools

- [Apple AASA Validator](https://search.developer.apple.com/appsearch-validation-tool/)
- [Google Digital Asset Links API](https://digitalassetlinks.googleapis.com/v1/statements:list)
- [JSONLint](https://jsonlint.com/) - JSON syntax validator

### Testing Tools

- [Branch.io Link Tester](https://branch.io/resources/aasa-validator/) - Third-party AASA validator
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL certificate checker

---

## Support

If you encounter issues not covered in this guide:

1. **Check validation tools** - Both Apple and Google provide official validators
2. **Review server logs** - Check for 404s or incorrect Content-Type headers
3. **Test with curl** - Verify files are accessible and have correct headers
4. **Contact mobile team** - They may need to update app configuration
5. **Wait for cache expiration** - iOS caches AASA files for up to 24 hours

---

**Last Updated**: 2025-10-25  
**Version**: 1.0
