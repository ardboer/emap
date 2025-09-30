# Simplified Fastlane Authentication Guide

This guide explains the simplified authentication setup for Fastlane deployment, using CLI authentication for iOS and service account for Android.

## 🍎 iOS Authentication - CLI Login (Simple!)

### Why CLI Authentication?

- **No API keys needed** - Just use your Apple ID and password
- **Interactive 2FA** - Fastlane prompts for 2FA codes when needed
- **Simpler setup** - No need to generate and manage API keys
- **More secure** - Uses your existing Apple ID credentials

### Setup Steps

1. **Set Environment Variables**

   ```bash
   # Copy template and edit
   cp fastlane/.env.template fastlane/.env.fastlane
   nano fastlane/.env.fastlane
   ```

2. **Configure Your Apple ID**

   ```bash
   # In .env.fastlane, set:
   APPLE_ID=your-apple-id@example.com
   APPLE_TEAM_ID=YOUR_TEAM_ID
   ```

3. **Find Your Team ID**
   - Go to [Apple Developer Portal](https://developer.apple.com/account/#!/membership/)
   - Your Team ID is listed in the membership section

### How It Works

- When you run a deployment, Fastlane will prompt for your Apple ID password
- If 2FA is enabled, you'll get a prompt to enter the 2FA code
- Fastlane stores the session temporarily for subsequent uploads
- No API keys or certificates to manage!

### Example Usage

```bash
# Deploy Construction News to TestFlight
./scripts/deploy-cn-ios.sh testflight

# Fastlane will prompt:
# "Please enter your Apple ID password:"
# "Please enter the 2FA code:"
```

## 🤖 Android Authentication - Service Account (Required)

### Why Service Account?

Unfortunately, Google Play Console **does not support CLI authentication**. Google requires a service account JSON key for API access because:

- **Security model** - Google uses service accounts for automated access
- **No interactive login** - Google Play Console API doesn't support user login flows
- **Industry standard** - This is Google's recommended approach for CI/CD

### Quick Setup Steps

1. **Enable Google Play Console API**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Google Play Android Developer API"

2. **Create Service Account**

   - Go to "IAM & Admin" > "Service Accounts"
   - Create new service account
   - Download JSON key file

3. **Configure Play Console**

   - Go to [Google Play Console](https://play.google.com/console/)
   - "Setup" > "API access"
   - Grant "Release manager" role to your service account

4. **Place JSON File**

   ```bash
   # Move downloaded file to fastlane directory
   mv ~/Downloads/your-service-account.json ./fastlane/google-play-service-account.json
   ```

5. **Update Environment**
   ```bash
   # In .env.fastlane, set:
   GOOGLE_PLAY_JSON_KEY_PATH=./fastlane/google-play-service-account.json
   ```

### One-Time Setup

The good news is this is a **one-time setup**. Once configured, Android deployments work automatically without any prompts.

## 🚀 Deployment Comparison

### iOS Deployment (Interactive)

```bash
./scripts/deploy-cn-ios.sh testflight
# Prompts for password and 2FA
# Then uploads automatically
```

### Android Deployment (Automated)

```bash
./scripts/deploy-cn-android.sh beta
# No prompts - uses service account
# Fully automated
```

## ✅ Validation

Test your setup:

```bash
# Check configuration
fastlane validate_env

# Expected output:
# ✅ All iOS environment variables are set
# 📱 iOS will use CLI authentication (you'll be prompted for password and 2FA)
# ✅ Google Play service account JSON key found (if configured)
# ⚠️  Google Play JSON key not configured (if not set up yet)
```

## 🔒 Security Best Practices

### iOS Security

- **Use App-Specific Password** - Generate one in your Apple ID settings
- **Enable 2FA** - Always use two-factor authentication
- **Secure Keychain** - Fastlane stores credentials in macOS Keychain

### Android Security

```bash
# Set restrictive permissions on JSON key
chmod 600 fastlane/google-play-service-account.json

# Ensure it's in .gitignore (already configured)
grep "google-play-service-account.json" .gitignore
```

## 🎯 Recommended Workflow

### For iOS-Only Deployment

1. Set up Apple ID and Team ID in `.env.fastlane`
2. Deploy to TestFlight: `./scripts/deploy-cn-ios.sh testflight`
3. Enter password and 2FA when prompted

### For Full Deployment (iOS + Android)

1. Set up Apple ID and Team ID for iOS
2. Set up Google Play service account for Android
3. Deploy to both platforms:
   ```bash
   ./scripts/deploy-cn-ios.sh testflight
   ./scripts/deploy-cn-android.sh beta
   ```

## 🆘 Troubleshooting

### iOS Issues

- **"Invalid credentials"** - Check Apple ID and password
- **"2FA timeout"** - Enter 2FA code quickly when prompted
- **"Team not found"** - Verify Team ID in Apple Developer Portal

### Android Issues

- **"Service account not found"** - Check JSON file path and permissions
- **"Insufficient permissions"** - Ensure service account has "Release manager" role
- **"Package not found"** - Create apps in Google Play Console first

## 📚 Next Steps

1. **Set up authentication** following this guide
2. **Test with internal builds** before production
3. **Review the main deployment guide** for detailed usage instructions
4. **Check troubleshooting guide** if you encounter issues

---

**Key Takeaway**: iOS uses simple CLI authentication (just your Apple ID), while Android requires a one-time service account setup. Both approaches are secure and production-ready!
