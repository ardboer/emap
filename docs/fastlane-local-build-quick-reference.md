# Fastlane Local Build - Quick Reference

## 🚀 Quick Commands

### iOS Local Build + Upload (Recommended for Development)

```bash
# Construction News
fastlane ios build_upload_cn_testflight    # → TestFlight
fastlane ios build_upload_cn_appstore      # → App Store

# Nursing Times
fastlane ios build_upload_nt_testflight    # → TestFlight
fastlane ios build_upload_nt_appstore      # → App Store
```

### Android Local Build + Upload (Recommended for Development)

```bash
# Construction News
fastlane android build_upload_cn_internal     # → Internal Testing
fastlane android build_upload_cn_alpha        # → Alpha Testing
fastlane android build_upload_cn_beta         # → Beta Testing
fastlane android build_upload_cn_production   # → Production

# Nursing Times
fastlane android build_upload_nt_internal     # → Internal Testing
fastlane android build_upload_nt_alpha        # → Alpha Testing
fastlane android build_upload_nt_beta         # → Beta Testing
fastlane android build_upload_nt_production   # → Production
```

### EAS Build + Upload (Existing Commands)

```bash
# iOS
fastlane ios upload_cn_testflight          # → TestFlight
fastlane ios upload_cn_appstore            # → App Store
fastlane ios upload_nt_testflight          # → TestFlight
fastlane ios upload_nt_appstore            # → App Store

# Android
fastlane android upload_cn_internal        # → Internal Testing
fastlane android upload_cn_alpha           # → Alpha Testing
fastlane android upload_cn_beta            # → Beta Testing
fastlane android upload_cn_production      # → Production
fastlane android upload_nt_internal        # → Internal Testing
fastlane android upload_nt_alpha           # → Alpha Testing
fastlane android upload_nt_beta            # → Beta Testing
fastlane android upload_nt_production      # → Production
```

## ⚙️ Setup Commands

```bash
# Initial setup
cp fastlane/.env.template fastlane/.env.fastlane

# Generate native projects
expo prebuild --platform ios --clear      # iOS only
expo prebuild --platform android --clear  # Android only
expo prebuild --clear                      # Both platforms

# Install dependencies
cd ios && pod install && cd ..             # iOS dependencies

# Create Android keystore (first time only)
keytool -genkey -v -keystore android/app/release.keystore \
  -alias your-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Validate environment
fastlane validate_env

# Show all available lanes
fastlane show_lanes
```

## 🔧 Troubleshooting Commands

```bash
# Clean build
rm -rf ios/build build/

# Reinstall dependencies
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Verbose logging
fastlane ios build_upload_cn_testflight --verbose

# Force regenerate certificates (set in .env.fastlane)
FORCE_PROVISIONING_PROFILES=true
```

## 📊 Comparison

| Feature      | Local Build      | EAS Build   |
| ------------ | ---------------- | ----------- |
| **Speed**    | 2-5 min          | 10-15 min   |
| **Cost**     | Free             | EAS credits |
| **Command**  | `build_upload_*` | `upload_*`  |
| **Use Case** | Development      | Production  |

## 🔑 Required Environment Variables

```bash
# In fastlane/.env.fastlane

# iOS deployment
APPLE_ID=your-apple-id@example.com
APPLE_TEAM_ID=YOUR_TEAM_ID

# Android deployment
GOOGLE_PLAY_JSON_KEY_PATH=./fastlane/google-play-service-account.json
ANDROID_KEYSTORE_PATH=./android/app/release.keystore
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_ALIAS=your_key_alias
ANDROID_KEY_PASSWORD=your_key_password

# Optional
BETA_FEEDBACK_EMAIL=beta-feedback@metropolis.co.uk
```

## 📁 Key Files

- [`fastlane/Fastfile`](../fastlane/Fastfile) - Main configuration
- [`fastlane/.env.fastlane`](../fastlane/.env.fastlane) - Environment variables
- [`docs/fastlane-local-build-guide.md`](fastlane-local-build-guide.md) - Full documentation

---

_For detailed documentation, see [Fastlane Local Build Guide](fastlane-local-build-guide.md)_
