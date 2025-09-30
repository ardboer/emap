# TestFlight and Internal Test Deployment Steps

This guide provides step-by-step instructions for deploying Construction News and Nursing Times apps to iOS TestFlight and Android Internal Test tracks.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [iOS TestFlight Deployment](#ios-testflight-deployment)
- [Android Internal Test Deployment](#android-internal-test-deployment)
- [Testing and Validation](#testing-and-validation)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

### Deployment Targets

- **iOS TestFlight**: Internal testing for iOS devices
- **Android Internal Test**: Internal testing for Android devices

### Apps to Deploy

- **Construction News** (`cn`): `metropolis.co.uk.constructionnews`
- **Nursing Times** (`nt`): `metropolis.net.nursingtimes`

## ✅ Prerequisites

### Required Setup

- [ ] EAS CLI installed and configured
- [ ] Fastlane installed and configured
- [ ] iOS certificates and provisioning profiles configured
- [ ] Android keystores configured
- [ ] Google Play service account JSON file in place
- [ ] Environment variables configured

### Verification Commands

```bash
# Check tool versions
eas --version
fastlane --version

# Validate environment
fastlane validate_env

# Check credentials
eas credentials:list --platform all
```

## 🍎 iOS TestFlight Deployment

### Step 1: Set Brand and Verify Setup

```bash
# For Construction News
export EXPO_PUBLIC_BRAND=cn

# For Nursing Times
export EXPO_PUBLIC_BRAND=nt

# Verify brand is set
echo "Current brand: $EXPO_PUBLIC_BRAND"

# Check iOS credentials
eas credentials:list --platform ios
```

### Step 2: Build Production iOS App

```bash
# Construction News iOS build
export EXPO_PUBLIC_BRAND=cn
eas build --platform ios --profile production-cn --wait

# Nursing Times iOS build
export EXPO_PUBLIC_BRAND=nt
eas build --platform ios --profile production-nt --wait
```

**Expected Output:**

```
✅ Build completed successfully
📱 Build ID: [BUILD_ID]
📦 Download URL: [DOWNLOAD_URL]
```

### Step 3: Deploy to TestFlight

#### Option A: Using Deployment Scripts (Recommended)

```bash
# Construction News to TestFlight
./scripts/deploy-cn-ios.sh testflight

# Nursing Times to TestFlight
./scripts/deploy-nt-ios.sh testflight
```

#### Option B: Using Fastlane Directly

```bash
# Construction News to TestFlight
export EXPO_PUBLIC_BRAND=cn
fastlane ios upload_cn_testflight

# Nursing Times to TestFlight
export EXPO_PUBLIC_BRAND=nt
fastlane ios upload_nt_testflight
```

### Step 4: Verify TestFlight Upload

1. **Check Command Output**

   ```
   ✅ Successfully uploaded [App Name] to TestFlight!
   📱 Build processing in App Store Connect
   ⏳ Processing time: 5-15 minutes
   ```

2. **Verify in App Store Connect**
   - Go to https://appstoreconnect.apple.com/
   - Navigate to your app
   - Go to TestFlight tab
   - Verify new build appears with "Processing" status

### Step 5: Configure TestFlight Testing

1. **Wait for Processing**

   - Build status changes from "Processing" to "Ready to Submit"
   - This typically takes 5-15 minutes

2. **Add Internal Testers**

   - In App Store Connect → TestFlight
   - Click "Internal Testing"
   - Add team members as internal testers
   - Internal testers can install immediately

3. **Configure Test Information**
   - Add "What to Test" notes for testers
   - Example: "Test all main features, navigation, and brand-specific content"

### Step 6: Distribute to Testers

1. **Internal Distribution (Automatic)**

   - Internal testers receive email notification
   - They can install via TestFlight app on iOS devices

2. **Send Test Instructions**

   ```
   TestFlight Testing Instructions:

   1. Install TestFlight app from App Store
   2. Check email for invitation
   3. Tap "View in TestFlight" in email
   4. Install the app
   5. Test all main features
   6. Report issues via TestFlight feedback
   ```

## 🤖 Android Internal Test Deployment

### Step 1: Set Brand and Verify Setup

```bash
# For Construction News
export EXPO_PUBLIC_BRAND=cn

# For Nursing Times
export EXPO_PUBLIC_BRAND=nt

# Verify brand is set
echo "Current brand: $EXPO_PUBLIC_BRAND"

# Check Android credentials
eas credentials:list --platform android

# Verify Google Play service account
ls -la fastlane/google-play-service-account.json
```

### Step 2: Build Production Android App

```bash
# Construction News Android build
export EXPO_PUBLIC_BRAND=cn
eas build --platform android --profile production-cn --wait

# Nursing Times Android build
export EXPO_PUBLIC_BRAND=nt
eas build --platform android --profile production-nt --wait
```

**Expected Output:**

```
✅ Build completed successfully
📱 Build ID: [BUILD_ID]
📦 Download URL: [DOWNLOAD_URL]
```

### Step 3: Deploy to Internal Test

#### Option A: Using Deployment Scripts (Recommended)

```bash
# Construction News to Internal Test
./scripts/deploy-cn-android.sh internal

# Nursing Times to Internal Test
./scripts/deploy-nt-android.sh internal
```

#### Option B: Using Fastlane Directly

```bash
# Construction News to Internal Test
export EXPO_PUBLIC_BRAND=cn
fastlane android upload_cn_internal

# Nursing Times to Internal Test
export EXPO_PUBLIC_BRAND=nt
fastlane android upload_nt_internal
```

### Step 4: Verify Internal Test Upload

1. **Check Command Output**

   ```
   ✅ Successfully uploaded [App Name] to Google Play Store (internal track)!
   📱 Build available in Play Console
   ⏳ Processing time: 1-2 hours
   ```

2. **Verify in Google Play Console**
   - Go to https://play.google.com/console/
   - Navigate to your app
   - Go to Testing → Internal testing
   - Verify new release appears

### Step 5: Configure Internal Testing

1. **Create Internal Test Track** (if not exists)

   - In Play Console → Testing → Internal testing
   - Click "Create new release" if needed
   - The release should already be created by Fastlane

2. **Add Internal Testers**

   - Go to Testing → Internal testing
   - Click "Testers" tab
   - Add email addresses of internal testers
   - Or create email list for team

3. **Configure Test Information**
   - Add release notes for testers
   - Example: "Internal test build - please test all main features and report issues"

### Step 6: Distribute to Testers

1. **Share Test Link**

   - Copy the internal test link from Play Console
   - Share with internal testers via email or Slack

2. **Send Test Instructions**

   ```
   Internal Test Instructions:

   1. Click the internal test link: [INTERNAL_TEST_LINK]
   2. Accept the invitation to become a tester
   3. Download and install the app from Play Store
   4. Test all main features
   5. Report issues via email or designated channel

   Note: It may take 1-2 hours for the app to be available after upload.
   ```

## ✅ Testing and Validation

### Post-Deployment Checklist

#### iOS TestFlight Validation

- [ ] Build appears in App Store Connect TestFlight section
- [ ] Build status shows "Ready to Submit"
- [ ] Internal testers can download and install
- [ ] App launches successfully on test devices
- [ ] All main features work correctly
- [ ] Brand-specific content displays correctly

#### Android Internal Test Validation

- [ ] Release appears in Play Console Internal testing
- [ ] Internal testers can access the test link
- [ ] App can be downloaded from Play Store
- [ ] App launches successfully on test devices
- [ ] All main features work correctly
- [ ] Brand-specific content displays correctly

### Testing Checklist for Both Platforms

```bash
# Create testing checklist for testers
cat > testing-checklist.md << EOF
# Testing Checklist

## App Launch and Navigation
- [ ] App launches without crashes
- [ ] Main navigation works correctly
- [ ] All tabs/sections are accessible
- [ ] Back navigation works properly

## Brand-Specific Features
- [ ] Correct brand colors and theme
- [ ] Brand logo displays correctly
- [ ] Brand-specific content loads
- [ ] Correct app name and branding

## Core Functionality
- [ ] News articles load and display correctly
- [ ] Search functionality works
- [ ] Settings can be accessed and modified
- [ ] App works in both light and dark modes

## Performance
- [ ] App loads quickly (< 3 seconds)
- [ ] Smooth scrolling and navigation
- [ ] No memory issues or crashes
- [ ] Reasonable battery usage

## Device Testing
- [ ] Test on different screen sizes
- [ ] Test on older devices
- [ ] Test with poor network connection
- [ ] Test offline functionality (if applicable)

## Issues Found
[List any issues discovered during testing]
EOF

echo "✅ Testing checklist created: testing-checklist.md"
```

## 🐛 Troubleshooting

### Common iOS TestFlight Issues

#### "Build failed to upload to TestFlight"

**Symptoms:**

- Fastlane fails during upload
- Authentication errors
- Build not appearing in App Store Connect

**Solutions:**

```bash
# Check authentication
fastlane validate_env

# Verify credentials
eas credentials:list --platform ios

# Check build artifact
eas build:list --limit 1 --json | jq '.[0].artifacts'

# Retry upload
fastlane ios upload_cn_testflight --verbose
```

#### "Build stuck in processing"

**Symptoms:**

- Build shows "Processing" for more than 30 minutes
- Build never becomes available for testing

**Solutions:**

1. Wait longer (can take up to 1 hour in rare cases)
2. Check Apple Developer System Status
3. Contact Apple Developer Support if issue persists

### Common Android Internal Test Issues

#### "Upload failed to Play Console"

**Symptoms:**

- Fastlane fails during upload
- Service account authentication errors
- Build not appearing in Play Console

**Solutions:**

```bash
# Check service account file
ls -la fastlane/google-play-service-account.json

# Verify file permissions
chmod 600 fastlane/google-play-service-account.json

# Test service account
gcloud auth activate-service-account --key-file=fastlane/google-play-service-account.json

# Retry upload
fastlane android upload_cn_internal --verbose
```

#### "App not available for internal testers"

**Symptoms:**

- Upload successful but testers can't access app
- Internal test link doesn't work

**Solutions:**

1. Wait 1-2 hours for Play Store propagation
2. Verify testers are added to internal test track
3. Check that testers are using correct Google accounts
4. Ensure app is published to internal track

### Emergency Procedures

#### Quick Rollback

```bash
# If critical issue found in test build
# iOS: Cannot rollback TestFlight, but can stop distribution
# Android: Can halt release in Play Console

# Create hotfix build
git checkout -b hotfix/critical-fix-$(date +%Y%m%d)
# Make necessary fixes
export EXPO_PUBLIC_BRAND=cn
eas build --platform all --profile production-cn --wait
```

#### Emergency Contact Information

- **Apple Developer Support**: Available through developer portal
- **Google Play Support**: Available through Play Console
- **Team Lead**: [Contact information]
- **DevOps Lead**: [Contact information]

## 📊 Success Metrics

### Deployment Success Criteria

- [ ] Both apps successfully deployed to test tracks
- [ ] Internal testers can download and install apps
- [ ] No critical crashes or issues reported
- [ ] All main features working correctly
- [ ] Brand-specific content displaying properly

### Testing Success Criteria

- [ ] At least 3 internal testers per app
- [ ] Testing completed within 48 hours
- [ ] All critical issues identified and documented
- [ ] Feedback collected and prioritized
- [ ] Go/no-go decision made for next deployment phase

---

**Created**: December 2024  
**Version**: 1.0  
**Next Review**: After first deployment

This guide provides everything needed to successfully deploy both Construction News and Nursing Times apps to iOS TestFlight and Android Internal Test tracks for internal testing and validation.
