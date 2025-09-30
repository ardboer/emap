# Google Play Admin Setup Guide: Multi-App Keystore for Local Builds

This guide is specifically for the Google Play Console administrator to set up Android keystores and service accounts for both Construction News and Nursing Times apps to support local builds with Fastlane.

## 📋 What You Need to Create

### For Local Builds (Fastlane):

- **1 Master Keystore** containing 2 app aliases
- **1 Google Play Service Account** (shared for both apps)
- **2 Google Play Console Apps** (one for each brand)

### Apps to Configure:

- **Construction News**: `metropolis.co.uk.constructionnews`
- **Nursing Times**: `metropolis.net.nursingtimes`

## 🔐 Step 1: Create Master Keystore with Multiple Aliases

### Why Use One Keystore for Both Apps?

- Easier management and backup
- Single secure file to maintain
- Scalable for future brands
- Consistent organizational information

### Create the Master Keystore

```bash
# Navigate to a secure directory
mkdir -p ~/keystores
cd ~/keystores

# Generate master keystore with Construction News alias
keytool -genkey -v -keystore emap-master-upload-key.keystore \
  -alias construction-news-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# When prompted, enter:
# - Keystore password: [CREATE STRONG PASSWORD - SAVE SECURELY]
# - Key password: [Can be same as keystore password]
# - Your name: EMAP Publishing Ltd
# - Organizational unit: Mobile Development
# - Organization: EMAP Publishing Ltd
# - City: London
# - State: England
# - Country code: GB
```

### Add Nursing Times to the Same Keystore

```bash
# Add Nursing Times alias to the existing keystore
keytool -genkey -v -keystore emap-master-upload-key.keystore \
  -alias nursing-times-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# IMPORTANT: Use the SAME keystore password as above
# Use the same organizational information
```

### Verify Both Aliases Exist

```bash
# List all aliases in the keystore
keytool -list -v -keystore emap-master-upload-key.keystore

# You should see both:
# - construction-news-key
# - nursing-times-key
```

### Secure the Keystore

```bash
# Set restrictive permissions
chmod 600 emap-master-upload-key.keystore

# Create backup
cp emap-master-upload-key.keystore emap-master-upload-key.keystore.backup

# Store both files in secure locations:
# - Encrypted cloud storage
# - Company password manager
# - Secure physical backup
```

## 🏪 Step 2: Google Play Console Setup

### Create Construction News App

1. Go to [Google Play Console](https://play.google.com/console/)
2. Click **Create app**
3. Fill in details:
   - **App name**: Construction News
   - **Default language**: English (United Kingdom)
   - **App or game**: App
   - **Free or paid**: Free
   - **Package name**: `metropolis.co.uk.constructionnews`
4. Complete the app setup:
   - **App category**: News & Magazines
   - **Content rating**: Complete questionnaire for news apps
   - **Target audience**: Adults
   - **Privacy Policy URL**: https://www.constructionnews.co.uk/privacy-policy

### Create Nursing Times App

1. Repeat the process for Nursing Times:
   - **App name**: Nursing Times
   - **Package name**: `metropolis.net.nursingtimes`
   - **App category**: Medical
   - **Privacy Policy URL**: https://www.nursingtimes.net/privacy-policy

## 🔧 Step 3: Service Account for API Access

### Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Play Android Developer API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Google Play Android Developer API"
   - Click **Enable**

### Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in:
   - **Name**: emap-play-console-api
   - **Description**: Service account for EMAP Play Console API access
4. Click **Create and Continue**
5. Skip role assignment (configured in Play Console)
6. Click **Done**

### Generate Service Account Key

1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create**
6. **Save the downloaded JSON file securely**

### Configure Service Account in Play Console

1. In Google Play Console, go to **Setup** > **API access**
2. Click **Link Google Cloud Project**
3. Select your Google Cloud project
4. Find your service account and click **Grant access**
5. Select permissions:
   - ✅ **Release manager** (can manage releases and edit store listing)
   - ✅ **View app information** (can view app information and download reports)
6. Click **Invite user**

## 📋 Step 4: Information to Provide to Development Team

### Keystore Information

```bash
# Keystore Details (provide to dev team)
Keystore File: emap-master-upload-key.keystore
Keystore Password: [YOUR_SECURE_PASSWORD]

# Construction News
Alias: construction-news-key
Key Password: [SAME_AS_KEYSTORE_OR_DIFFERENT]

# Nursing Times
Alias: nursing-times-key
Key Password: [SAME_AS_KEYSTORE_OR_DIFFERENT]
```

### Service Account JSON

- Provide the downloaded JSON file: `google-play-service-account.json`
- This file allows API access to upload builds to both apps

### Package Names (for reference)

- Construction News: `metropolis.co.uk.constructionnews`
- Nursing Times: `metropolis.net.nursingtimes`

## 🔐 Step 5: Enable Google Play App Signing (Recommended)

### For Construction News

1. In Google Play Console, select **Construction News** app
2. Go to **Setup** > **App signing**
3. Click **Use Play App Signing**
4. Extract and upload certificate:
   ```bash
   # Extract certificate from keystore
   keytool -export -rfc -keystore emap-master-upload-key.keystore \
     -alias construction-news-key \
     -file construction-news-upload-cert.pem
   ```
5. Upload the `.pem` file to Play Console

### For Nursing Times

1. Repeat for Nursing Times app:
   ```bash
   # Extract certificate from keystore
   keytool -export -rfc -keystore emap-master-upload-key.keystore \
     -alias nursing-times-key \
     -file nursing-times-upload-cert.pem
   ```
2. Upload to Nursing Times app in Play Console

## ✅ Security Checklist

### Keystore Security

- [ ] Keystore file has restrictive permissions (600)
- [ ] Keystore password is strong and unique
- [ ] Backup copy created and stored securely
- [ ] Passwords stored in company password manager
- [ ] Access limited to essential team members only

### Service Account Security

- [ ] JSON key file has restrictive permissions
- [ ] Service account has minimal required permissions
- [ ] JSON key stored securely (not in version control)
- [ ] Access to Google Cloud project is restricted

### Google Play Console

- [ ] Both apps created with correct package names
- [ ] App signing enabled for both apps
- [ ] Service account has access to both apps
- [ ] Privacy policies configured for both apps

## 🚨 Important Notes

### Keystore Management

- **NEVER lose the keystore file or passwords** - apps cannot be updated without them
- **Create multiple secure backups** in different locations
- **Document who has access** and when passwords are changed
- **Test keystore access** before providing to development team

### Service Account

- **One service account can manage both apps** - no need for separate accounts
- **JSON key provides full API access** - treat as highly sensitive
- **Rotate keys periodically** for security best practices

### Future Brands

- **Add new aliases to the same keystore** for additional brands
- **Same service account can manage all EMAP apps**
- **Consistent organizational information** across all certificates

## 📞 Support

If you encounter issues:

1. **Keystore Problems**: Check Java version (JDK 8+) and verify commands
2. **Google Play Console**: Use Google Play Console Help Center
3. **Service Account**: Check Google Cloud Console IAM permissions
4. **Development Team**: Provide this guide and the secure credentials

---

**Created**: For EMAP Publishing Ltd multi-brand Android app deployment
**Purpose**: Enable local builds with Fastlane for Construction News and Nursing Times
**Security Level**: High - contains sensitive credential setup instructions
