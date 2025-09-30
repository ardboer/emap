# Comprehensive iOS Certificates and Provisioning Profiles Guide

This guide provides step-by-step instructions for creating and managing iOS certificates and provisioning profiles for both Construction News and Nursing Times apps.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Apple Developer Account Setup](#apple-developer-account-setup)
- [iOS Distribution Certificates](#ios-distribution-certificates)
- [App IDs and Bundle Identifiers](#app-ids-and-bundle-identifiers)
- [Provisioning Profiles](#provisioning-profiles)
- [EAS Credentials Integration](#eas-credentials-integration)
- [Certificate Management Best Practices](#certificate-management-best-practices)
- [Renewal Procedures](#renewal-procedures)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

### What You'll Create

For **both Construction News and Nursing Times**, you'll need:

- **iOS Distribution Certificate** (shared across both apps)
- **App IDs** (one for each app)
- **Provisioning Profiles** (one for each app)
- **EAS Credentials Configuration**

### Bundle Identifiers

- **Construction News**: `metropolis.co.uk.constructionnews`
- **Nursing Times**: `metropolis.net.nursingtimes`

## ✅ Prerequisites

### Required Access

- [ ] Apple Developer Account (EMAP Publishing Ltd)
- [ ] Admin or App Manager role in the developer account
- [ ] Access to the Apple ID used for the developer account
- [ ] Two-factor authentication enabled on Apple ID

### Required Software

- [ ] macOS computer (required for certificate generation)
- [ ] Xcode (latest version recommended)
- [ ] EAS CLI installed (`npm install -g @expo/eas-cli`)
- [ ] Terminal access

## 🍎 Apple Developer Account Setup

### Step 1: Access Apple Developer Portal

1. Navigate to [Apple Developer Portal](https://developer.apple.com/account/)
2. Sign in with your EMAP Publishing Ltd Apple ID
3. Verify you have the correct team selected (EMAP Publishing Ltd)

### Step 2: Verify Team Information

1. Go to **Membership** section
2. Note your **Team ID** (you'll need this later)
3. Verify your **Team Agent** status
4. Ensure your account is in good standing

```bash
# Save your Team ID for later use
APPLE_TEAM_ID=YOUR_TEAM_ID_HERE
```

## 🔐 iOS Distribution Certificates

### Understanding Certificate Types

- **iOS Distribution Certificate**: Used for App Store distribution
- **iOS Development Certificate**: Used for development builds (not covered here)
- **Apple Push Notification Certificate**: For push notifications (separate guide)

### Step 1: Check Existing Certificates

1. In Apple Developer Portal, go to **Certificates, Identifiers & Profiles**
2. Click **Certificates** in the sidebar
3. Look for existing **iOS Distribution** certificates
4. Check expiration dates (certificates are valid for 1 year)

### Step 2: Create iOS Distribution Certificate

**If you don't have a valid iOS Distribution certificate:**

1. Click the **+** button to create a new certificate
2. Select **iOS Distribution (App Store and Ad Hoc)**
3. Click **Continue**

### Step 3: Generate Certificate Signing Request (CSR)

1. Open **Keychain Access** on your Mac
2. Go to **Keychain Access** > **Certificate Assistant** > **Request a Certificate From a Certificate Authority**
3. Fill in the form:
   - **User Email Address**: Your Apple ID email
   - **Common Name**: EMAP Publishing Ltd iOS Distribution
   - **CA Email Address**: Leave blank
   - **Request is**: Saved to disk
4. Click **Continue** and save the CSR file

### Step 4: Upload CSR and Download Certificate

1. Back in the Apple Developer Portal, upload your CSR file
2. Click **Continue**
3. Download the generated certificate (.cer file)
4. Double-click the certificate to install it in Keychain Access

### Step 5: Verify Certificate Installation

1. Open **Keychain Access**
2. Select **My Certificates** in the sidebar
3. Look for "iOS Distribution: EMAP Publishing Ltd"
4. Verify it has a valid private key (arrow next to certificate)

## 📱 App IDs and Bundle Identifiers

### Step 1: Create Construction News App ID

1. In Apple Developer Portal, go to **Identifiers**
2. Click the **+** button
3. Select **App IDs** and click **Continue**
4. Select **App** and click **Continue**
5. Fill in the details:
   - **Description**: Construction News
   - **Bundle ID**: Explicit - `metropolis.co.uk.constructionnews`
6. Select required **Capabilities**:
   - [ ] App Groups (if using)
   - [ ] Associated Domains (if using)
   - [ ] Background Modes (if using background refresh)
   - [ ] Push Notifications (if using push notifications)
7. Click **Continue** and **Register**

### Step 2: Create Nursing Times App ID

1. Repeat the process for Nursing Times:
   - **Description**: Nursing Times
   - **Bundle ID**: Explicit - `metropolis.net.nursingtimes`
   - Select the same capabilities as Construction News
2. Click **Continue** and **Register**

### Step 3: Verify App IDs

```bash
# Verify your App IDs are created correctly
# Construction News: metropolis.co.uk.constructionnews
# Nursing Times: metropolis.net.nursingtimes
```

## 📄 Provisioning Profiles

### Step 1: Create Construction News Provisioning Profile

1. In Apple Developer Portal, go to **Profiles**
2. Click the **+** button
3. Select **App Store** under Distribution
4. Click **Continue**
5. Select **Construction News** App ID
6. Click **Continue**
7. Select your **iOS Distribution Certificate**
8. Click **Continue**
9. Enter profile details:
   - **Provisioning Profile Name**: Construction News App Store
10. Click **Generate**
11. Download the provisioning profile (.mobileprovision file)

### Step 2: Create Nursing Times Provisioning Profile

1. Repeat the process for Nursing Times:
   - Select **Nursing Times** App ID
   - Use the same iOS Distribution Certificate
   - **Provisioning Profile Name**: Nursing Times App Store
2. Download the provisioning profile

### Step 3: Install Provisioning Profiles

**Option 1: Automatic (Recommended)**

```bash
# EAS will handle provisioning profile installation automatically
# when you configure credentials
```

**Option 2: Manual Installation**

```bash
# Double-click each .mobileprovision file to install in Xcode
# Or drag and drop into Xcode
```

## 🔧 EAS Credentials Integration

### Step 1: Configure EAS Credentials for Construction News

```bash
# Set the brand environment variable
export EXPO_PUBLIC_BRAND=cn

# Configure iOS credentials
eas credentials:configure --platform ios

# Follow the prompts:
# 1. Select "Use existing Distribution Certificate"
# 2. Choose your iOS Distribution certificate
# 3. Select "Use existing Provisioning Profile"
# 4. Choose Construction News App Store profile
# OR let EAS create new ones automatically
```

### Step 2: Configure EAS Credentials for Nursing Times

```bash
# Set the brand environment variable
export EXPO_PUBLIC_BRAND=nt

# Configure iOS credentials
eas credentials:configure --platform ios

# Follow the prompts for Nursing Times
```

### Step 3: Verify EAS Credentials

```bash
# List all configured credentials
eas credentials:list

# Check specific platform credentials
eas credentials:list --platform ios
```

### Step 4: Test Credentials with Build

```bash
# Test Construction News build
EXPO_PUBLIC_BRAND=cn eas build --platform ios --profile production-cn --non-interactive

# Test Nursing Times build
EXPO_PUBLIC_BRAND=nt eas build --platform ios --profile production-nt --non-interactive
```

## 🔄 Certificate Management Best Practices

### Certificate Security

1. **Backup Certificates**

   ```bash
   # Export certificates from Keychain Access
   # File > Export Items > Save as .p12 file
   # Store securely with strong password
   ```

2. **Team Access**

   - Only grant certificate access to necessary team members
   - Use separate certificates for different teams if needed
   - Document who has access to certificates

3. **Certificate Sharing**
   ```bash
   # Share certificates securely through EAS
   # Never share .p12 files through insecure channels
   # Use EAS credentials sharing features
   ```

### Provisioning Profile Management

1. **Naming Convention**

   - Use descriptive names: `[App Name] [Environment] [Date]`
   - Example: `Construction News App Store 2024-12`

2. **Regular Updates**
   - Update profiles when adding new devices
   - Regenerate when certificates are renewed
   - Keep profiles in sync with app capabilities

### Environment Organization

```bash
# Recommended environment variable setup
# .env.fastlane
APPLE_ID=your-apple-id@emappublishing.com
APPLE_TEAM_ID=YOUR_TEAM_ID

# Brand-specific bundle IDs
CN_BUNDLE_ID=metropolis.co.uk.constructionnews
NT_BUNDLE_ID=metropolis.net.nursingtimes
```

## 🔄 Renewal Procedures

### Certificate Renewal (Annual)

**30 Days Before Expiration:**

1. **Check Certificate Status**

   ```bash
   # Check certificate expiration in Apple Developer Portal
   # Certificates > iOS Distribution
   ```

2. **Generate New Certificate**

   - Follow the same process as initial creation
   - Generate new CSR from Keychain Access
   - Download and install new certificate

3. **Update EAS Credentials**

   ```bash
   # Update credentials for both brands
   EXPO_PUBLIC_BRAND=cn eas credentials:configure --platform ios
   EXPO_PUBLIC_BRAND=nt eas credentials:configure --platform ios
   ```

4. **Update Provisioning Profiles**

   - Regenerate all provisioning profiles with new certificate
   - Download and update in EAS

5. **Test Builds**
   ```bash
   # Test builds with new certificates
   EXPO_PUBLIC_BRAND=cn eas build --platform ios --profile production-cn
   EXPO_PUBLIC_BRAND=nt eas build --platform ios --profile production-nt
   ```

### Provisioning Profile Updates

**When to Update:**

- Certificate renewal
- Adding new app capabilities
- Bundle ID changes
- Team member changes

**Update Process:**

1. Regenerate profile in Apple Developer Portal
2. Download new profile
3. Update EAS credentials
4. Test build

## 🐛 Troubleshooting

### Common Certificate Issues

#### "No valid iOS Distribution certificate found"

**Solution:**

```bash
# Check certificate in Keychain Access
# Ensure certificate has private key
# Verify certificate is not expired
# Re-download from Apple Developer Portal if needed
```

#### "Certificate has invalid signature"

**Solution:**

```bash
# Delete certificate from Keychain Access
# Re-download from Apple Developer Portal
# Double-click to reinstall
```

#### "Unable to find matching certificate"

**Solution:**

```bash
# Verify Team ID matches
# Check certificate is iOS Distribution type
# Ensure certificate is installed in correct keychain
```

### Common Provisioning Profile Issues

#### "No matching provisioning profile found"

**Solution:**

```bash
# Verify bundle ID matches exactly
# Check provisioning profile includes correct certificate
# Ensure profile is App Store type
# Regenerate profile if needed
```

#### "Provisioning profile has expired"

**Solution:**

```bash
# Regenerate profile in Apple Developer Portal
# Download new profile
# Update EAS credentials
```

#### "App ID not found in provisioning profile"

**Solution:**

```bash
# Verify App ID exists in Apple Developer Portal
# Check bundle ID spelling exactly
# Regenerate provisioning profile with correct App ID
```

### EAS Credentials Issues

#### "Failed to configure credentials"

**Solution:**

```bash
# Clear existing credentials
eas credentials:delete --platform ios

# Reconfigure from scratch
eas credentials:configure --platform ios
```

#### "Build fails with signing error"

**Solution:**

```bash
# Verify credentials are correctly configured
eas credentials:list --platform ios

# Check certificate and profile match
# Regenerate if necessary
```

### Debug Commands

```bash
# List all credentials
eas credentials:list

# Show detailed credential information
eas credentials:list --platform ios --json

# Clear and reconfigure credentials
eas credentials:delete --platform ios
eas credentials:configure --platform ios

# Test build with verbose logging
eas build --platform ios --profile production-cn --verbose
```

## 📞 Support Resources

### Apple Developer Support

- [Apple Developer Portal](https://developer.apple.com/account/)
- [Certificate and Profile Management](https://developer.apple.com/account/resources/certificates/list)
- [Apple Developer Support](https://developer.apple.com/support/)

### EAS Documentation

- [EAS Credentials Documentation](https://docs.expo.dev/app-signing/app-credentials/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Forums](https://forums.expo.dev/)

### Emergency Contacts

- **Apple Developer Support**: Available through developer portal
- **EAS Support**: Available through Expo dashboard
- **Team Lead**: [Your team lead contact]

## ✅ Verification Checklist

Before proceeding to deployment, verify:

- [ ] iOS Distribution Certificate is valid and installed
- [ ] Construction News App ID created with correct bundle ID
- [ ] Nursing Times App ID created with correct bundle ID
- [ ] Construction News provisioning profile generated and downloaded
- [ ] Nursing Times provisioning profile generated and downloaded
- [ ] EAS credentials configured for both brands
- [ ] Test builds complete successfully for both brands
- [ ] Certificates and profiles backed up securely
- [ ] Team members have necessary access
- [ ] Renewal calendar reminders set

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: Before certificate expiration

This comprehensive guide ensures your iOS certificates and provisioning profiles are properly configured for successful app store deployment of both Construction News and Nursing Times applications.
