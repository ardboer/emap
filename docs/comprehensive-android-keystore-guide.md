# Comprehensive Android Keystore and Google Play Setup Guide

This guide provides step-by-step instructions for creating Android keystores, setting up Google Play Console, and configuring service accounts for both Construction News and Nursing Times apps.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Android Keystore Creation](#android-keystore-creation)
- [Google Play Console Setup](#google-play-console-setup)
- [Service Account Configuration](#service-account-configuration)
- [EAS Credentials Integration](#eas-credentials-integration)
- [Google Play App Signing](#google-play-app-signing)
- [Keystore Management Best Practices](#keystore-management-best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

### What You'll Create

For **both Construction News and Nursing Times**, you'll need:

- **Upload Keystores** (one for each app)
- **Google Play Console Apps** (one for each app)
- **Service Account** (shared across both apps)
- **Google Play App Signing** (managed by Google)
- **EAS Credentials Configuration**

### Package Names

- **Construction News**: `metropolis.co.uk.constructionnews`
- **Nursing Times**: `metropolis.net.nursingtimes`

## ✅ Prerequisites

### Required Access

- [ ] Google Play Console Account (EMAP Publishing Ltd)
- [ ] Owner or Admin role in Google Play Console
- [ ] Google Cloud Console access
- [ ] Access to the Google account used for Play Console

### Required Software

- [ ] Java Development Kit (JDK) 8 or higher
- [ ] Android Studio (recommended) or Android SDK
- [ ] EAS CLI installed (`npm install -g @expo/eas-cli`)
- [ ] Terminal access

### Verify Java Installation

```bash
# Check Java version
java -version

# Should show Java 8 or higher
# If not installed, download from: https://adoptium.net/
```

## 🔐 Android Keystore Creation

### Understanding Keystores

- **Upload Keystore**: Used to sign your app for upload to Google Play
- **App Signing Key**: Managed by Google Play App Signing (recommended)
- **Debug Keystore**: Used for development (not covered here)

### Step 1: Create EMAP Master Keystore (Recommended)

**Why use a shared keystore?**

- Easier management for multiple brands
- Single keystore to backup and secure
- Scalable for future brand additions
- Consistent organizational information

```bash
# Navigate to a secure directory
mkdir -p ~/keystores
cd ~/keystores

# Generate master keystore for all EMAP apps
keytool -genkey -v -keystore emap-master-upload-key.keystore \
  -alias cn-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# - Keystore password (SAVE THIS SECURELY - used for all apps)
# - Key password (can be same as keystore password)
# - Your name: EMAP Publishing Ltd
# - Organizational unit: Mobile Development
# - Organization: EMAP Publishing Ltd
# - City: London
# - State: England
# - Country code: GB
```

### Step 2: Add Nursing Times to Master Keystore

```bash
# Add Nursing Times alias to the same keystore
keytool -genkey -v -keystore emap-master-upload-key.keystore \
  -alias nt-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Use the SAME keystore password as Step 1
# Use the same organizational information
```

### Step 3: Add Future Brands (Example)

```bash
# When adding new brands later, use the same keystore:
keytool -genkey -v -keystore emap-master-upload-key.keystore \
  -alias hm-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Replace 'hm' with your new brand shortcode
# Always use the same keystore password
```

### Step 4: Verify Master Keystore

```bash
# List all aliases in the master keystore
keytool -list -v -keystore emap-master-upload-key.keystore

# You should see:
# - cn-upload (Construction News)
# - nt-upload (Nursing Times)
# - Any future brand aliases

# Verify for each alias:
# - Validity period is sufficient (27+ years)
# - Key algorithm is RSA
# - Key size is 2048 bits
```

### Step 5: Secure Master Keystore

```bash
# Set restrictive permissions
chmod 600 emap-master-upload-key.keystore

# Create backup copy
cp emap-master-upload-key.keystore emap-master-upload-key.keystore.backup

# Store in secure location (encrypted drive, password manager, etc.)
```

### Alternative: Separate Keystores (Not Recommended)

If you prefer separate keystores for each app:

```bash
# Construction News keystore
keytool -genkey -v -keystore construction-news-upload-key.keystore \
  -alias construction-news-upload \
  -keyalg RSA -keysize 2048 -validity 10000

# Nursing Times keystore
keytool -genkey -v -keystore nursing-times-upload-key.keystore \
  -alias nursing-times-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

**Note**: Separate keystores require individual management, backup, and security procedures for each app.

## 🏪 Google Play Console Setup

### Step 1: Access Google Play Console

1. Navigate to [Google Play Console](https://play.google.com/console/)
2. Sign in with your EMAP Publishing Ltd Google account
3. Verify you have the correct developer account selected

### Step 2: Create Construction News App

1. Click **Create app**
2. Fill in app details:
   - **App name**: Construction News
   - **Default language**: English (United Kingdom)
   - **App or game**: App
   - **Free or paid**: Free
3. Accept the declarations and click **Create app**

### Step 3: Configure Construction News App Details

1. **App information**:

   - **Package name**: `metropolis.co.uk.constructionnews`
   - **App category**: News & Magazines
   - **Content rating**: Complete questionnaire for news apps
   - **Target audience**: Adults

2. **Store listing**:

   - **App name**: Construction News
   - **Short description**: Latest construction industry news and insights
   - **Full description**: [Detailed app description]
   - **App icon**: Upload Construction News icon (512x512 PNG)
   - **Feature graphic**: Upload feature graphic (1024x500 PNG)
   - **Screenshots**: Upload for Phone, 7-inch tablet, 10-inch tablet

3. **Privacy Policy**:
   - **Privacy Policy URL**: https://www.constructionnews.co.uk/privacy-policy

### Step 4: Create Nursing Times App

1. Repeat the app creation process for Nursing Times:
   - **App name**: Nursing Times
   - **Package name**: `metropolis.net.nursingtimes`
   - **App category**: Medical
   - **Privacy Policy URL**: https://www.nursingtimes.net/privacy-policy

### Step 5: Configure Data Safety

For both apps, complete the **Data safety** section:

1. **Data collection and sharing**:

   - [ ] Does your app collect or share user data? → Yes
   - [ ] Personal info: Email addresses (for user accounts)
   - [ ] App activity: App interactions, In-app search history
   - [ ] Device identifiers: Advertising ID

2. **Data usage and handling**:
   - Specify how data is used (analytics, app functionality)
   - Indicate if data is shared with third parties
   - Confirm data encryption in transit and at rest

## 🔧 Service Account Configuration

### Step 1: Enable Google Play Console API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project for your Play Console integration
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Play Android Developer API"
5. Click **Enable**

### Step 2: Create Service Account

1. In Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Service account name**: emap-play-console-api
   - **Service account ID**: emap-play-console-api
   - **Description**: Service account for EMAP Play Console API access
4. Click **Create and Continue**
5. Skip role assignment for now (we'll configure in Play Console)
6. Click **Done**

### Step 3: Generate Service Account Key

1. Click on the created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create**
6. Save the downloaded JSON file securely

```bash
# Move the downloaded file to your project
mv ~/Downloads/your-project-xxxxx-xxxxxxxx.json ./fastlane/google-play-service-account.json

# Set restrictive permissions
chmod 600 ./fastlane/google-play-service-account.json
```

### Step 4: Configure Service Account in Play Console

1. In Google Play Console, go to **Setup** > **API access**
2. Click **Link Google Cloud Project**
3. Select your Google Cloud project
4. Click **Link project**
5. Find your service account in the list
6. Click **Grant access**
7. Select permissions:
   - [ ] **Release manager**: Can manage releases and edit store listing
   - [ ] **View app information**: Can view app information and download reports
8. Click **Invite user**

### Step 5: Verify Service Account Access

```bash
# Test service account access (requires Google Cloud SDK)
gcloud auth activate-service-account --key-file=./fastlane/google-play-service-account.json

# List accessible projects
gcloud projects list
```

## 🔧 EAS Credentials Integration

### Step 1: Configure EAS Credentials for Construction News

```bash
# Set the brand environment variable
export EXPO_PUBLIC_BRAND=cn

# Configure Android credentials
eas credentials:configure --platform android

# Follow the prompts:
# 1. Select "Generate new keystore"
# OR
# 1. Select "Use existing keystore"
# 2. Provide keystore path: ~/keystores/construction-news-upload-key.keystore
# 3. Enter keystore password
# 4. Enter key alias: construction-news-upload
# 5. Enter key password
```

### Step 2: Configure EAS Credentials for Nursing Times

```bash
# Set the brand environment variable
export EXPO_PUBLIC_BRAND=nt

# Configure Android credentials
eas credentials:configure --platform android

# Follow the prompts for Nursing Times keystore
```

### Step 3: Verify EAS Credentials

```bash
# List all configured credentials
eas credentials:list

# Check specific platform credentials
eas credentials:list --platform android
```

### Step 4: Test Credentials with Build

```bash
# Test Construction News build
EXPO_PUBLIC_BRAND=cn eas build --platform android --profile production-cn --non-interactive

# Test Nursing Times build
EXPO_PUBLIC_BRAND=nt eas build --platform android --profile production-nt --non-interactive
```

## 🔐 Google Play App Signing

### Understanding App Signing

- **Upload Key**: Your keystore used to sign uploads to Play Console
- **App Signing Key**: Google's key used to sign apps delivered to users
- **Play App Signing**: Google manages the app signing key (recommended)

### Step 1: Enable Play App Signing for Construction News

1. In Google Play Console, select **Construction News** app
2. Go to **Setup** > **App signing**
3. If not already enabled, click **Use Play App Signing**
4. Upload your upload certificate:
   ```bash
   # Extract certificate from keystore
   keytool -export -rfc -keystore construction-news-upload-key.keystore \
     -alias construction-news-upload \
     -file construction-news-upload-cert.pem
   ```
5. Upload the `.pem` file to Play Console
6. Click **Save**

### Step 2: Enable Play App Signing for Nursing Times

1. Repeat the process for Nursing Times:
   ```bash
   # Extract certificate from keystore
   keytool -export -rfc -keystore nursing-times-upload-key.keystore \
     -alias nursing-times-upload \
     -file nursing-times-upload-cert.pem
   ```
2. Upload to Nursing Times app in Play Console

### Step 3: Download App Signing Certificates

1. For each app, go to **Setup** > **App signing**
2. Download the **App signing certificate** (for future reference)
3. Download the **Upload certificate** (for verification)
4. Store these certificates securely

## 🔄 Keystore Management Best Practices

### Keystore Security

1. **Backup Strategy**

   ```bash
   # Create encrypted backups
   tar -czf keystores-backup-$(date +%Y%m%d).tar.gz *.keystore
   gpg -c keystores-backup-$(date +%Y%m%d).tar.gz

   # Store in multiple secure locations:
   # - Encrypted cloud storage
   # - Secure company vault
   # - Offline encrypted drive
   ```

2. **Access Control**

   - Limit keystore access to essential team members only
   - Use strong, unique passwords for each keystore
   - Store passwords in secure password manager
   - Document who has access and when

3. **Password Management**
   ```bash
   # Store keystore information securely
   # Example password manager entry:
   # Title: Construction News Android Keystore
   # Username: construction-news-upload
   # Password: [keystore password]
   # Notes: Keystore path, alias, key password
   ```

### Environment Configuration

```bash
# Add to .env.fastlane
GOOGLE_PLAY_JSON_KEY_PATH=./fastlane/google-play-service-account.json

# Brand-specific package names
CN_PACKAGE_NAME=metropolis.co.uk.constructionnews
NT_PACKAGE_NAME=metropolis.net.nursingtimes

# Keystore information (for reference only - actual keys managed by EAS)
CN_KEYSTORE_ALIAS=construction-news-upload
NT_KEYSTORE_ALIAS=nursing-times-upload
```

### Version Management

```bash
# Track keystore versions and certificates
# Create a keystore registry file
cat > keystore-registry.md << EOF
# Keystore Registry

## Construction News
- **Keystore**: construction-news-upload-key.keystore
- **Alias**: construction-news-upload
- **Created**: $(date)
- **Validity**: 27 years
- **SHA-256**: $(keytool -list -v -keystore construction-news-upload-key.keystore -alias construction-news-upload | grep SHA256)

## Nursing Times
- **Keystore**: nursing-times-upload-key.keystore
- **Alias**: nursing-times-upload
- **Created**: $(date)
- **Validity**: 27 years
- **SHA-256**: $(keytool -list -v -keystore nursing-times-upload-key.keystore -alias nursing-times-upload | grep SHA256)
EOF
```

## 🐛 Troubleshooting

### Common Keystore Issues

#### "Keystore was tampered with, or password was incorrect"

**Solution:**

```bash
# Verify keystore integrity
keytool -list -keystore your-keystore.keystore

# If corrupted, restore from backup
cp your-keystore.keystore.backup your-keystore.keystore

# If password forgotten, keystore cannot be recovered
# You'll need to create a new keystore and new app in Play Console
```

#### "Key was created with errors"

**Solution:**

```bash
# Check Java version
java -version

# Ensure using JDK 8 or higher
# Regenerate keystore with correct Java version
```

#### "Invalid keystore format"

**Solution:**

```bash
# Verify keystore was created correctly
file your-keystore.keystore

# Should show: Java KeyStore
# If not, regenerate keystore
```

### Common Google Play Console Issues

#### "Package name already exists"

**Solution:**

- Package names are globally unique in Google Play
- Choose a different package name
- Verify you own the domain in the package name

#### "Service account has insufficient permissions"

**Solution:**

```bash
# Verify service account has correct roles in Play Console
# Go to Setup > API access
# Ensure "Release manager" role is granted
```

#### "Upload certificate doesn't match"

**Solution:**

```bash
# Verify you're using the correct keystore
keytool -list -v -keystore your-keystore.keystore

# Ensure the certificate matches what's uploaded to Play Console
# Re-extract and upload certificate if needed
```

### Common EAS Issues

#### "Failed to configure Android credentials"

**Solution:**

```bash
# Clear existing credentials
eas credentials:delete --platform android

# Reconfigure from scratch
eas credentials:configure --platform android
```

#### "Build fails with signing error"

**Solution:**

```bash
# Verify credentials are correctly configured
eas credentials:list --platform android

# Check keystore and passwords are correct
# Regenerate if necessary
```

### Debug Commands

```bash
# List keystore contents
keytool -list -v -keystore your-keystore.keystore

# Verify certificate
keytool -printcert -file your-certificate.pem

# Test service account
gcloud auth activate-service-account --key-file=./fastlane/google-play-service-account.json

# List EAS credentials
eas credentials:list --platform android --json

# Test build with verbose logging
eas build --platform android --profile production-cn --verbose
```

## 📞 Support Resources

### Google Play Console Support

- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Play Console](https://play.google.com/console/)
- [Google Cloud Console](https://console.cloud.google.com/)

### Android Development Resources

- [Android Developer Documentation](https://developer.android.com/)
- [App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [Keystore Documentation](https://developer.android.com/studio/publish/app-signing#generate-key)

### EAS Documentation

- [EAS Credentials Documentation](https://docs.expo.dev/app-signing/app-credentials/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Forums](https://forums.expo.dev/)

## ✅ Verification Checklist

Before proceeding to deployment, verify:

- [ ] Construction News keystore created and secured
- [ ] Nursing Times keystore created and secured
- [ ] Both apps created in Google Play Console
- [ ] Package names configured correctly
- [ ] Service account created and configured
- [ ] Service account has correct permissions in Play Console
- [ ] Google Play App Signing enabled for both apps
- [ ] EAS credentials configured for both brands
- [ ] Test builds complete successfully for both brands
- [ ] Keystores backed up securely
- [ ] Passwords stored in secure password manager
- [ ] Team members have necessary access

## 🔄 Maintenance Schedule

### Monthly

- [ ] Verify service account access
- [ ] Check keystore backups
- [ ] Review team access permissions

### Quarterly

- [ ] Update service account key (if needed)
- [ ] Review Google Play Console settings
- [ ] Audit keystore access logs

### Annually

- [ ] Review and update security practices
- [ ] Verify backup integrity
- [ ] Update documentation

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: Quarterly

This comprehensive guide ensures your Android keystores and Google Play Console are properly configured for successful app store deployment of both Construction News and Nursing Times applications.
