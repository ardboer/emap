# Fastlane Authentication Setup Guide

This guide will help you set up authentication for both iOS (App Store Connect) and Android (Google Play Console) deployments.

## 🍎 iOS - App Store Connect API Key Setup

### Step 1: Generate App Store Connect API Key

1. **Log in to App Store Connect**

   - Go to [App Store Connect](https://appstoreconnect.apple.com/)
   - Sign in with your Apple Developer account

2. **Navigate to API Keys**

   - Click on "Users and Access" in the top navigation
   - Click on "Keys" tab
   - Click the "+" button to create a new key

3. **Create the API Key**

   - Name: `Fastlane Deployment Key`
   - Access: `Developer` (or `Admin` if you need full access)
   - Click "Generate"

4. **Download the Key**
   - Download the `.p8` file immediately (you can only download it once)
   - Note down the **Key ID** and **Issuer ID**

### Step 2: Configure iOS Authentication

1. **Place the API Key File**

   ```bash
   # Move the downloaded .p8 file to the fastlane directory
   mv ~/Downloads/AuthKey_XXXXXXXXXX.p8 ./fastlane/
   ```

2. **Update Environment Variables**

   ```bash
   # Copy the template and edit it
   cp fastlane/.env.template fastlane/.env.fastlane

   # Edit the file with your values
   nano fastlane/.env.fastlane
   ```

3. **Set the following variables in `.env.fastlane`:**
   ```bash
   APPLE_ID=your-apple-id@example.com
   APPLE_TEAM_ID=YOUR_TEAM_ID
   APP_STORE_CONNECT_API_KEY_ID=XXXXXXXXXX
   APP_STORE_CONNECT_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   APP_STORE_CONNECT_API_KEY_PATH=./fastlane/AuthKey_XXXXXXXXXX.p8
   ```

### Step 3: Find Your Team ID

1. **Apple Developer Portal Method**

   - Go to [Apple Developer Portal](https://developer.apple.com/)
   - Sign in and go to "Membership"
   - Your Team ID is listed there

2. **App Store Connect Method**
   - In App Store Connect, go to any app
   - Look at the URL: `https://appstoreconnect.apple.com/apps/XXXXXXXXXX/appstore`
   - Or check in "Users and Access" > "Keys" - the Issuer ID is your Team ID

## 🤖 Android - Google Play Console Service Account Setup

### Step 1: Enable Google Play Console API

1. **Go to Google Cloud Console**

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create a project

2. **Enable the API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Play Android Developer API"
   - Click on it and press "Enable"

### Step 2: Create Service Account

1. **Create Service Account**

   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name: `Fastlane Deployment`
   - Description: `Service account for automated app deployment`
   - Click "Create and Continue"

2. **Skip Role Assignment** (we'll do this in Play Console)

   - Click "Continue" then "Done"

3. **Create Key**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file

### Step 3: Configure Google Play Console

1. **Go to Google Play Console**

   - Visit [Google Play Console](https://play.google.com/console/)
   - Select your developer account

2. **Add Service Account**

   - Go to "Setup" > "API access"
   - Click "Link" next to Google Cloud Project (if not already linked)
   - Find your service account in the list
   - Click "Grant Access"

3. **Set Permissions**
   - **Account permissions**: None needed
   - **App permissions**:
     - Select both apps (Construction News and Nursing Times)
     - Grant "Release manager" role for each app
   - Click "Invite user"

### Step 4: Configure Android Authentication

1. **Place the JSON Key File**

   ```bash
   # Move the downloaded JSON file to the fastlane directory
   mv ~/Downloads/your-project-xxxxxx-xxxxxxxxxxxxxxxx.json ./fastlane/google-play-service-account.json
   ```

2. **Update Environment Variables**

   ```bash
   # Edit your .env.fastlane file
   nano fastlane/.env.fastlane
   ```

3. **Set the following variable:**
   ```bash
   GOOGLE_PLAY_JSON_KEY_PATH=./fastlane/google-play-service-account.json
   ```

## 🔒 Security Best Practices

### File Permissions

```bash
# Set restrictive permissions on sensitive files
chmod 600 fastlane/.env.fastlane
chmod 600 fastlane/AuthKey_*.p8
chmod 600 fastlane/google-play-service-account.json
```

### Git Ignore

Make sure these files are in your `.gitignore`:

```gitignore
# Fastlane
fastlane/.env.fastlane
fastlane/AuthKey_*.p8
fastlane/google-play-service-account.json
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots
fastlane/test_output
fastlane/builds
```

### Environment Variables for CI/CD

For production CI/CD, store these as encrypted environment variables:

- `APPLE_ID`
- `APPLE_TEAM_ID`
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_CONTENT` (base64 encoded .p8 file content)
- `GOOGLE_PLAY_JSON_KEY_CONTENT` (base64 encoded JSON file content)

## ✅ Verification

### Test iOS Setup

```bash
# Validate environment
fastlane validate_env

# Test with a dry run (if available)
fastlane ios upload_cn_testflight --dry_run
```

### Test Android Setup

```bash
# Validate environment
fastlane validate_env

# Test with internal track first
fastlane android upload_cn_internal
```

## 🆘 Troubleshooting

### Common iOS Issues

1. **"Invalid API Key" Error**

   - Verify the API Key ID and Issuer ID are correct
   - Ensure the .p8 file path is correct
   - Check that the API key has the right permissions

2. **"Team ID not found" Error**

   - Verify your Team ID in Apple Developer Portal
   - Ensure your Apple ID is part of the team

3. **"App not found" Error**
   - Verify the bundle identifier matches exactly
   - Ensure the app exists in App Store Connect

### Common Android Issues

1. **"Service account not found" Error**

   - Verify the JSON key file path is correct
   - Ensure the service account is properly linked in Play Console

2. **"Insufficient permissions" Error**

   - Check that the service account has "Release manager" role
   - Verify permissions are set for the correct apps

3. **"Package not found" Error**
   - Verify the package name matches exactly
   - Ensure the app exists in Google Play Console

## 📞 Support

If you encounter issues:

1. Check the Fastlane logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with the validation command: `fastlane validate_env`
4. Consult the [Fastlane documentation](https://docs.fastlane.tools/)
