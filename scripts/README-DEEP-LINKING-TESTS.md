# Deep Linking Test Script

## Overview

The `test-deep-linking.js` script verifies that the deep linking implementation is correctly configured for the EMAP multi-brand mobile app.

## Usage

```bash
# Run the test script
node scripts/test-deep-linking.js

# Or if executable permissions are set
./scripts/test-deep-linking.js
```

## What It Tests

### 1. URL Parsing Logic ✅

Tests the ability to extract article slugs from various URL formats:

- Full URLs with/without trailing slashes
- Custom scheme URLs (e.g., `nt://category/article-slug/`)
- URLs with query parameters
- Nested category paths

### 2. app.json Configuration ✅

Verifies the app configuration includes:

- Correct app scheme for the current brand
- iOS bundle identifier matches brand configuration
- iOS Universal Links (`associatedDomains`) configuration
- Android package name matches brand configuration
- Android App Links (`intentFilters`) configuration

### 3. Brand Domain Mappings ✅

Tests URL parsing for all three brands:

- **Construction News (CN)**: `www.constructionnews.co.uk`
- **Jobs Nursing & Learning (JNL)**: `jnl.nursingtimes.net`
- **Nursing Times (NT)**: `www.nursingtimes.net`

## Test Output

The script provides color-coded output:

- ✅ **Green checkmark**: Test passed
- ⚠️ **Yellow warning**: Test passed with warnings (non-critical)
- ❌ **Red X**: Test failed (critical issue)

### Example Output

```
==================================================
Deep Linking Implementation Tests
==================================================

🔍 Testing URL Parsing...
  ✓ Full URL with trailing slash
  ✓ Custom scheme with trailing slash
  ...

🔍 Testing app.json Configuration...
  ✓ app.json exists
  ✓ Current brand configuration
  ⚠ iOS Universal Links (associatedDomains)
  ...

==================================================
Test Summary
==================================================
  Total Tests: 20
  Passed: 18
  Failed: 0
  Warnings: 2
  Pass Rate: 90.0%
```

## Understanding Results

### All Tests Passed ✅

```
🎉 All tests passed!
```

Your deep linking configuration is complete and ready for deployment.

### Tests Passed with Warnings ⚠️

```
⚠️ Tests passed with warnings
```

The basic configuration is correct, but some optional features (like Universal Links or App Links) may not be configured. Review the recommendations section.

### Some Tests Failed ❌

```
❌ Some tests failed
```

Critical configuration issues were found. Review the failed tests and fix the issues before deploying.

## Common Issues and Solutions

### iOS Universal Links Not Configured

**Issue**: `iOS Universal Links (associatedDomains): Not configured`

**Solution**: Add `associatedDomains` to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:www.nursingtimes.net"]
    }
  }
}
```

### Android App Links Not Configured

**Issue**: `Android App Links (intentFilters): Not configured`

**Solution**: Add `intentFilters` to your `app.json`:

```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "www.nursingtimes.net",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Wrong Bundle ID or Package Name

**Issue**: Bundle identifier or package name doesn't match brand configuration

**Solution**: Ensure your `app.json` has the correct identifiers for the current brand:

| Brand | iOS Bundle ID                       | Android Package                     |
| ----- | ----------------------------------- | ----------------------------------- |
| CN    | `metropolis.co.uk.constructionnews` | `metropolis.co.uk.constructionnews` |
| JNL   | `metropolis.net.jnl`                | `metropolis.net.jnl`                |
| NT    | `metropolis.net.nursingtimes`       | `metropolis.net.nursingtimes`       |

## Next Steps After Testing

1. **Review the Deep Linking Setup Guide**

   ```bash
   cat docs/deep-linking-setup-guide.md
   ```

2. **Update app.json** with any missing configuration

3. **Run the prebuild script** to apply changes:

   ```bash
   npm run prebuild
   ```

4. **Test on physical devices** after deploying:
   - iOS: Test Universal Links by clicking links in Safari or Messages
   - Android: Test App Links by clicking links in Chrome or other apps

## Integration with CI/CD

You can integrate this test script into your CI/CD pipeline:

```bash
# In your CI/CD script
node scripts/test-deep-linking.js

# The script exits with code 1 if tests fail
# This will cause the CI/CD pipeline to fail
```

## Related Documentation

- [Deep Linking Setup Guide](../docs/deep-linking-setup-guide.md) - Complete setup instructions
- [API Documentation](../services/api.ts) - See `getPostBySlug()` function
- [Brand Configuration](../config/BrandManager.ts) - Brand management system

## Troubleshooting

### Script Won't Run

**Issue**: Permission denied

**Solution**:

```bash
chmod +x scripts/test-deep-linking.js
```

### ESLint Errors

The script includes `/* eslint-disable no-undef */` to allow `__dirname` in Node.js CommonJS context. This is intentional and safe.

### Tests Pass Locally But Fail in CI

Ensure your CI environment has:

- Node.js installed (v16 or higher)
- Access to the `app.json` file
- Correct working directory set

## Support

For issues or questions:

1. Check the [Deep Linking Setup Guide](../docs/deep-linking-setup-guide.md)
2. Review test output for specific error messages
3. Consult the development team
