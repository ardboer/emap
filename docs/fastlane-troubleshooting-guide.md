# Fastlane Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Fastlane deployment for Construction News and Nursing Times apps.

## 🔍 Quick Diagnostics

### Environment Validation

```bash
# Run this first to check your setup
fastlane validate_env

# Check Fastlane version
fastlane --version

# List available lanes
fastlane list
```

### File Permissions Check

```bash
# Check sensitive files exist and have correct permissions
ls -la fastlane/.env.fastlane
ls -la fastlane/AuthKey_*.p8
ls -la fastlane/google-play-service-account.json

# Fix permissions if needed
chmod 600 fastlane/.env.fastlane
chmod 600 fastlane/AuthKey_*.p8
chmod 600 fastlane/google-play-service-account.json
```

## 🍎 iOS Issues

### Authentication Problems

#### "Invalid API Key" Error

```
Error: The provided API key is not valid for this operation
```

**Solutions:**

1. **Verify API Key Details**

   ```bash
   # Check your .env.fastlane file
   grep -E "APP_STORE_CONNECT_API_KEY_ID|APP_STORE_CONNECT_ISSUER_ID" fastlane/.env.fastlane
   ```

2. **Check API Key File**

   ```bash
   # Ensure the .p8 file exists and matches the ID
   ls -la fastlane/AuthKey_*.p8
   ```

3. **Regenerate API Key**
   - Go to App Store Connect > Users and Access > Keys
   - Revoke the old key and create a new one
   - Update your configuration

#### "Team ID not found" Error

```
Error: Could not find Team ID 'XXXXXXXXXX'
```

**Solutions:**

1. **Find Your Team ID**

   ```bash
   # Check Apple Developer Portal
   # Go to https://developer.apple.com/account/#!/membership/
   ```

2. **Verify Team Access**
   - Ensure your Apple ID is part of the team
   - Check you have the right role (Admin/App Manager)

#### "App not found" Error

```
Error: Could not find app with bundle identifier 'metropolis.co.uk.constructionnews'
```

**Solutions:**

1. **Check Bundle Identifier**

   ```bash
   # Verify in eas.json
   grep -A 5 -B 5 "bundleIdentifier" eas.json
   ```

2. **Create App in App Store Connect**
   - Go to App Store Connect
   - Create the app with the exact bundle identifier
   - Ensure it's associated with your team

### Build Issues

#### "No builds found" Error

```
Error: No builds found for Construction News (ios)
```

**Solutions:**

1. **Check EAS Build Status**

   ```bash
   # List recent builds
   eas build:list --platform ios --limit 10

   # Check specific profile
   eas build:list --platform ios --profile production-cn --limit 5
   ```

2. **Trigger Manual Build**

   ```bash
   # Build Construction News
   EXPO_PUBLIC_BRAND=cn eas build --platform ios --profile production-cn

   # Build Nursing Times
   EXPO_PUBLIC_BRAND=nt eas build --platform ios --profile production-nt
   ```

#### "Build Download Failed" Error

```
Error: Failed to download build from URL
```

**Solutions:**

1. **Check Build Status**

   ```bash
   # Verify build completed successfully
   eas build:view BUILD_ID
   ```

2. **Manual Download**
   ```bash
   # Get build URL and download manually
   curl -L -o manual_build.ipa "BUILD_URL"
   ```

### TestFlight Issues

#### "Build Processing Stuck" Error

```
Warning: Build has been processing for over 30 minutes
```

**Solutions:**

1. **Skip Processing Wait**

   ```bash
   # Add to .env.fastlane
   SKIP_WAITING_FOR_BUILD_PROCESSING=true
   ```

2. **Check Build in App Store Connect**
   - Go to TestFlight tab
   - Look for processing status
   - Check for any compliance issues

#### "External Testing Not Available" Error

```
Error: External testing is not available for this build
```

**Solutions:**

1. **Complete Beta App Review**

   - Submit for beta app review first
   - Wait for approval before external distribution

2. **Check Export Compliance**
   - Ensure export compliance is properly configured
   - Update Deliverfile settings if needed

## 🤖 Android Issues

### Authentication Problems

#### "Service account not found" Error

```
Error: The service account key file could not be found
```

**Solutions:**

1. **Check JSON Key File**

   ```bash
   # Verify file exists
   ls -la fastlane/google-play-service-account.json

   # Check file content (should be valid JSON)
   head -5 fastlane/google-play-service-account.json
   ```

2. **Regenerate Service Account Key**
   - Go to Google Cloud Console
   - IAM & Admin > Service Accounts
   - Create new key for existing service account

#### "Insufficient permissions" Error

```
Error: The service account does not have sufficient permissions
```

**Solutions:**

1. **Check Play Console Permissions**

   - Go to Google Play Console > Setup > API access
   - Find your service account
   - Ensure it has "Release manager" role for both apps

2. **Verify App Access**
   ```bash
   # Check which apps the service account can access
   # This should include both Construction News and Nursing Times
   ```

#### "Package not found" Error

```
Error: Package 'metropolis.co.uk.constructionnews' not found
```

**Solutions:**

1. **Create App in Play Console**

   - Go to Google Play Console
   - Create new app with exact package name
   - Complete initial setup

2. **Check Package Name**
   ```bash
   # Verify in eas.json
   grep -A 5 -B 5 "package" eas.json
   ```

### Upload Issues

#### "Version code must be greater" Error

```
Error: Version code 1 has already been used
```

**Solutions:**

1. **Enable Auto-increment**

   ```bash
   # Check eas.json has autoIncrement: true
   grep -A 10 "production" eas.json
   ```

2. **Manual Version Bump**
   ```bash
   # Update version in app.json or app.config.js
   # Increment both version and versionCode
   ```

#### "APK/AAB upload failed" Error

```
Error: Failed to upload APK/AAB to Google Play Store
```

**Solutions:**

1. **Check File Format**

   ```bash
   # Ensure we're uploading AAB (not APK) for production
   file downloaded_build.*
   ```

2. **Verify Build Integrity**
   ```bash
   # Check build completed successfully
   eas build:view BUILD_ID
   ```

## 🔧 General Issues

### Network Problems

#### "Connection timeout" Error

```
Error: Connection timed out while uploading
```

**Solutions:**

1. **Retry with Backoff**

   - Fastlane has built-in retry logic
   - Wait a few minutes and try again

2. **Check Network**
   ```bash
   # Test connectivity
   ping appstoreconnect.apple.com
   ping play.google.com
   ```

#### "SSL certificate" Error

```
Error: SSL certificate verification failed
```

**Solutions:**

1. **Update Certificates**

   ```bash
   # Update system certificates
   brew update && brew upgrade
   ```

2. **Bypass SSL (temporary)**
   ```bash
   # Only for debugging - not recommended for production
   export SSL_VERIFY=false
   ```

### File System Issues

#### "Permission denied" Error

```
Error: Permission denied when accessing file
```

**Solutions:**

1. **Fix File Permissions**

   ```bash
   # Fix permissions for all Fastlane files
   chmod -R 755 fastlane/
   chmod 600 fastlane/.env.fastlane
   chmod 600 fastlane/AuthKey_*.p8
   chmod 600 fastlane/google-play-service-account.json
   ```

2. **Check Directory Ownership**
   ```bash
   # Ensure you own the files
   sudo chown -R $(whoami) fastlane/
   ```

#### "Disk space" Error

```
Error: No space left on device
```

**Solutions:**

1. **Clean Build Artifacts**

   ```bash
   # Remove old builds
   rm -rf fastlane/builds/
   rm -rf build/

   # Clean EAS cache
   eas build:clear-cache
   ```

2. **Check Disk Space**
   ```bash
   df -h
   ```

## 🔄 EAS Integration Issues

### Build Profile Problems

#### "Profile not found" Error

```
Error: Build profile 'production-cn' not found
```

**Solutions:**

1. **Check eas.json**

   ```bash
   # Verify profiles exist
   cat eas.json | jq '.build'
   ```

2. **Validate EAS Configuration**
   ```bash
   # Check EAS configuration
   eas build:configure
   ```

#### "Prebuild script failed" Error

```
Error: Prebuild command failed with exit code 1
```

**Solutions:**

1. **Check Prebuild Script**

   ```bash
   # Test prebuild script manually
   node scripts/prebuild.js cn
   node scripts/prebuild.js nt
   ```

2. **Verify Brand Assets**
   ```bash
   # Check brand assets exist
   ls -la brands/cn/assets/
   ls -la brands/nt/assets/
   ```

## 🚨 Emergency Procedures

### Complete Reset

If everything is broken, try this complete reset:

```bash
# 1. Clean everything
rm -rf fastlane/builds/
rm -rf build/
rm -rf node_modules/

# 2. Reinstall dependencies
npm install

# 3. Reconfigure environment
cp fastlane/.env.template fastlane/.env.fastlane
# Edit .env.fastlane with your credentials

# 4. Test configuration
fastlane validate_env

# 5. Try a simple deployment
./scripts/deploy-cn-ios.sh testflight
```

### Rollback Strategy

If a deployment fails in production:

1. **iOS Rollback**

   ```bash
   # Use App Store Connect to reject the build
   # Previous version will remain active
   ```

2. **Android Rollback**
   ```bash
   # Use Play Console to halt rollout
   # Or promote previous version
   ```

## 📞 Getting Help

### Debug Information to Collect

When asking for help, provide:

```bash
# System information
fastlane --version
node --version
eas --version

# Environment validation
fastlane validate_env

# Recent build information
eas build:list --platform ios --limit 3
eas build:list --platform android --limit 3

# Error logs (sanitize sensitive information)
cat fastlane/report.xml
```

### Useful Resources

- [Fastlane Documentation](https://docs.fastlane.tools/)
- [EAS Build Troubleshooting](https://docs.expo.dev/build/troubleshooting/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

### Support Channels

1. Check this troubleshooting guide
2. Review the main [Fastlane Deployment Guide](./fastlane-deployment-guide.md)
3. Consult official documentation
4. Search GitHub issues for similar problems
5. Contact your development team

---

**Remember**: Always test deployments with internal/beta tracks before production releases!
