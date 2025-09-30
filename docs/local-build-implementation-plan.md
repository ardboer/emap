# Local Build Implementation Plan

This document outlines a plan to add local build capabilities alongside the existing EAS build system, providing flexibility to choose between cloud and local builds for the multi-brand React Native Expo app.

## 📋 Overview

Currently, the app uses EAS Build for creating iOS/Android binaries and Fastlane for store uploads. This plan adds local build support as an alternative option while maintaining the existing EAS workflow.

### Current Architecture

- **EAS Build** → Cloud-based binary creation
- **Fastlane** → Store upload (calls EAS build first)
- **Multi-brand** → Construction News (cn) & Nursing Times (nt)

### Proposed Architecture

- **EAS Build** → Cloud-based binary creation (existing)
- **Local Build** → Machine-based binary creation (new)
- **Fastlane** → Store upload (supports both build methods)
- **Multi-brand** → Unchanged

## 🎯 Goals

1. **Maintain existing EAS workflow** - No breaking changes
2. **Add local build option** - For faster iteration and debugging
3. **Unified Fastlane deployment** - Same upload process for both build methods
4. **Build method selection** - Easy switching between EAS and local builds
5. **Cost optimization** - Reduce EAS build credits when needed

## 📁 Implementation Plan

### Phase 1: Environment Setup

#### 1.1 Development Environment Requirements

```bash
# macOS Requirements
- Xcode (latest version)
- Android Studio with SDK
- Java 17 (for React Native 0.81.4)
- CocoaPods
- React Native CLI
```

#### 1.2 Tool Installation Script

Create `scripts/setup-local-build.sh`:

```bash
#!/bin/bash
# Install required tools for local building
npm install -g @react-native-community/cli
sudo gem install cocoapods
# Verify installations
```

### Phase 2: Project Structure Changes

#### 2.1 Generate Native Projects

```bash
# Add to package.json scripts
"prebuild:ios": "expo prebuild --platform ios --clear",
"prebuild:android": "expo prebuild --platform android --clear",
"prebuild:all": "expo prebuild --clear"
```

#### 2.2 Gitignore Updates

Add to `.gitignore`:

```
# Local build artifacts
ios/build/
android/app/build/
*.ipa
*.aab
*.apk
```

### Phase 3: Build Configuration

#### 3.1 iOS Build Configuration

Create `ios/ExportOptions.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

#### 3.2 Android Build Configuration

Update `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Phase 4: Build Scripts

#### 4.1 Local Build Scripts

Create `scripts/build-local.sh`:

```bash
#!/bin/bash
# Local build script with brand support
# Usage: ./scripts/build-local.sh <brand> <platform>

BRAND=$1
PLATFORM=$2

echo "🚀 Starting local build for $BRAND on $PLATFORM"

# Run prebuild script
node scripts/prebuild.js $BRAND

if [ "$PLATFORM" = "ios" ]; then
    # iOS build
    cd ios && pod install && cd ..
    xcodebuild -workspace ios/emap.xcworkspace \
        -scheme emap \
        -configuration Release \
        -destination generic/platform=iOS \
        -archivePath ios/build/emap.xcarchive \
        archive

    xcodebuild -exportArchive \
        -archivePath ios/build/emap.xcarchive \
        -exportPath ios/build \
        -exportOptionsPlist ios/ExportOptions.plist

elif [ "$PLATFORM" = "android" ]; then
    # Android build
    cd android && ./gradlew bundleRelease && cd ..
fi

echo "✅ Local build completed"
```

#### 4.2 Brand-Specific Build Scripts

Create `scripts/build-cn-local.sh` and `scripts/build-nt-local.sh`:

```bash
#!/bin/bash
# Construction News local build
./scripts/build-local.sh cn $1
```

### Phase 5: Fastlane Integration

#### 5.1 Updated Fastlane Configuration

Modify `fastlane/Fastfile`:

```ruby
# Add build method parameter
private_lane :build_app do |options|
  brand = options[:brand]
  platform = options[:platform]
  method = options[:method] || "eas"  # default to EAS

  if method == "local"
    build_locally(brand: brand, platform: platform)
  else
    build_with_eas(brand: brand, platform: platform)
  end
end

# New local build lane using Fastlane's build actions
private_lane :build_locally do |options|
  brand = options[:brand]
  platform = options[:platform]
  brand_name = get_brand_name(brand)
  bundle_id = get_bundle_id(brand)

  UI.message("🔨 Building #{brand_name} locally for #{platform} using Fastlane...")

  # Run prebuild script
  sh("cd .. && node scripts/prebuild.js #{brand}")

  if platform == "ios"
    # iOS build with Fastlane's gym action (handles signing automatically)
    sh("cd ../ios && pod install")

    gym(
      workspace: "../ios/emap.xcworkspace",
      scheme: "emap",
      configuration: "Release",
      output_directory: "../ios/build",
      output_name: "#{brand}_app.ipa",
      clean: true,
      include_bitcode: false,
      include_symbols: true,
      export_method: "app-store",
      export_team_id: ENV["APPLE_TEAM_ID"],
      codesigning_identity: "iPhone Distribution"
    )
  else
    # Android build with Fastlane's gradle action (handles signing automatically)
    gradle(
      project_dir: "../android",
      task: "bundleRelease",
      properties: {
        "MYAPP_RELEASE_STORE_FILE" => ENV["ANDROID_KEYSTORE_PATH"],
        "MYAPP_RELEASE_KEY_ALIAS" => ENV["ANDROID_KEY_ALIAS"],
        "MYAPP_RELEASE_STORE_PASSWORD" => ENV["ANDROID_KEYSTORE_PASSWORD"],
        "MYAPP_RELEASE_KEY_PASSWORD" => ENV["ANDROID_KEY_PASSWORD"]
      }
    )
  end

  UI.success("✅ Local build and signing completed for #{brand_name} (#{platform})")
end

# Dedicated build and sign lanes for each brand
desc "Build and sign Construction News for iOS"
lane :build_and_sign_cn do
  build_locally(brand: "cn", platform: "ios")
end

desc "Build and sign Nursing Times for iOS"
lane :build_and_sign_nt do
  build_locally(brand: "nt", platform: "ios")
end

# Updated upload lanes with build method support
private_lane :upload_to_testflight_for_brand do |options|
  brand = options[:brand] || options[0]
  method = options[:method] || ENV["BUILD_METHOD"] || "eas"

  # Build the app
  build_app(brand: brand, platform: "ios", method: method)

  # Get build artifact path
  if method == "local"
    ipa_path = "../ios/build/#{brand}_app.ipa"
  else
    ipa_path = download_latest_eas_build(brand: brand, platform: "ios")
  end

  # Upload to TestFlight (existing logic)
  upload_to_testflight(
    ipa: ipa_path,
    # ... rest of configuration
  )
end
```

#### 5.2 Enhanced Fastlane Lanes with Build and Sign

Add comprehensive lanes that handle building, signing, and uploading:

```ruby
# iOS Build, Sign, and Upload Lanes
desc "Build, sign, and upload Construction News to TestFlight"
lane :build_sign_upload_cn_testflight do
  build_locally(brand: "cn", platform: "ios")
  upload_to_testflight(
    ipa: "../ios/build/cn_app.ipa",
    app_identifier: get_bundle_id("cn"),
    skip_waiting_for_build_processing: false,
    skip_submission: true
  )
end

desc "Build, sign, and upload Nursing Times to TestFlight"
lane :build_sign_upload_nt_testflight do
  build_locally(brand: "nt", platform: "ios")
  upload_to_testflight(
    ipa: "../ios/build/nt_app.ipa",
    app_identifier: get_bundle_id("nt"),
    skip_waiting_for_build_processing: false,
    skip_submission: true
  )
end

# Android Build, Sign, and Upload Lanes
desc "Build, sign, and upload Construction News to Google Play"
lane :build_sign_upload_cn_beta do
  build_locally(brand: "cn", platform: "android")
  upload_to_play_store(
    package_name: get_package_name("cn"),
    aab: "../android/app/build/outputs/bundle/release/app-release.aab",
    track: "beta",
    json_key: ENV["GOOGLE_PLAY_JSON_KEY_PATH"]
  )
end

desc "Build, sign, and upload Nursing Times to Google Play"
lane :build_sign_upload_nt_beta do
  build_locally(brand: "nt", platform: "android")
  upload_to_play_store(
    package_name: get_package_name("nt"),
    aab: "../android/app/build/outputs/bundle/release/app-release.aab",
    track: "beta",
    json_key: ENV["GOOGLE_PLAY_JSON_KEY_PATH"]
  )
end
```

### Phase 6: Environment Configuration

#### 6.1 Extended Environment Variables

Add to `fastlane/.env.fastlane`:

```bash
# Build Method Selection
BUILD_METHOD=eas  # or "local"

# iOS Local Build
IOS_TEAM_ID=YOUR_TEAM_ID
IOS_PROVISIONING_PROFILE_CN=Construction_News_Distribution
IOS_PROVISIONING_PROFILE_NT=Nursing_Times_Distribution

# Android Local Build
ANDROID_KEYSTORE_PATH=./android/app/release.keystore
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_ALIAS=your_key_alias
ANDROID_KEY_PASSWORD=your_key_password
```

#### 6.2 Android Gradle Properties

Create `android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=your_key_alias
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

### Phase 7: Deployment Scripts Update

#### 7.1 Enhanced Deployment Scripts

Update `scripts/deploy-cn-ios.sh`:

```bash
#!/bin/bash
# Enhanced deployment script with build method support
# Usage: ./scripts/deploy-cn-ios.sh [testflight|appstore] [eas|local]

TARGET=${1:-testflight}
BUILD_METHOD=${2:-eas}

export BRAND=cn
export BUILD_METHOD=$BUILD_METHOD

echo -e "${BLUE}🚀 Starting Construction News iOS deployment to ${TARGET} using ${BUILD_METHOD} build...${NC}"

case $TARGET in
    testflight)
        if [ "$BUILD_METHOD" = "local" ]; then
            fastlane ios build_sign_upload_cn_testflight
        else
            fastlane ios upload_cn_testflight
        fi
        ;;
    appstore)
        if [ "$BUILD_METHOD" = "local" ]; then
            fastlane ios build_sign_upload_cn_appstore
        else
            fastlane ios upload_cn_appstore
        fi
        ;;
esac
```

### Phase 8: Documentation and Validation

#### 8.1 Usage Documentation

Create `docs/local-build-usage.md`:

````markdown
# Local Build Usage Guide

## Quick Start

```bash
# Build locally with Fastlane and deploy to TestFlight
./scripts/deploy-cn-ios.sh testflight local

# Build with EAS and deploy to TestFlight (existing)
./scripts/deploy-cn-ios.sh testflight eas

# Direct Fastlane commands
fastlane ios build_sign_upload_cn_testflight
fastlane android build_sign_upload_cn_beta
```
````

## Build Method Comparison

| Feature                | EAS Build   | Fastlane Local Build      |
| ---------------------- | ----------- | ------------------------- |
| Speed                  | 10-15 min   | 2-5 min                   |
| Cost                   | EAS credits | Free                      |
| Debugging              | Limited     | Full access               |
| Signing                | EAS managed | Fastlane managed          |
| Dependencies           | Managed     | Self-managed              |
| Certificate Management | Automatic   | Fastlane Match (optional) |

````

#### 8.2 Validation Script
Create `scripts/validate-local-build.sh`:
```bash
#!/bin/bash
# Validate local build environment
echo "🔍 Validating local build environment..."

# Check Xcode
xcode-select -p > /dev/null 2>&1 || echo "❌ Xcode not found"

# Check Android SDK
[ -d "$ANDROID_HOME" ] || echo "❌ Android SDK not found"

# Check CocoaPods
pod --version > /dev/null 2>&1 || echo "❌ CocoaPods not found"

# Check certificates
# ... certificate validation logic

echo "✅ Environment validation complete"
````

## 🚀 Implementation Timeline

### Week 1: Setup and Configuration

- [ ] Install development tools
- [ ] Generate native projects with `expo prebuild`
- [ ] Create build configuration files
- [ ] Set up signing certificates and keystores

### Week 2: Build Scripts and Fastlane

- [ ] Create local build scripts
- [ ] Update Fastlane configuration
- [ ] Add new Fastlane lanes for local builds
- [ ] Test local build process

### Week 3: Integration and Testing

- [ ] Update deployment scripts
- [ ] Test both EAS and local build workflows
- [ ] Validate multi-brand functionality
- [ ] Create documentation

### Week 4: Optimization and Documentation

- [ ] Optimize build performance
- [ ] Create comprehensive documentation
- [ ] Set up validation scripts
- [ ] Final testing and refinement

## 📊 Benefits Analysis

### Advantages of Local Builds

- **Speed**: 2-5 minutes vs 10-15 minutes
- **Cost**: No EAS build credits consumed
- **Debugging**: Full access to build logs and intermediate files
- **Offline**: Can build without internet connection
- **Control**: Complete control over build environment

### Advantages of EAS Builds

- **Consistency**: Standardized build environment
- **Maintenance**: No local environment management
- **Scalability**: Can handle multiple concurrent builds
- **Reliability**: Managed infrastructure

## 🔧 Maintenance Considerations

### Local Build Maintenance

- Keep Xcode and Android Studio updated
- Manage iOS certificates and provisioning profiles
- Maintain Android keystores
- Update build tools and dependencies

### Hybrid Approach Benefits

- Use local builds for development and testing
- Use EAS builds for production releases
- Switch based on urgency and requirements
- Maintain both workflows for redundancy

## 🎯 Success Criteria

1. **Functional Parity**: Local builds produce identical apps to EAS builds
2. **Performance**: Local builds complete in under 5 minutes
3. **Reliability**: 95%+ success rate for local builds
4. **Documentation**: Complete setup and usage guides
5. **Flexibility**: Easy switching between build methods

## 📝 Next Steps

1. **Decision Point**: Choose implementation timeline
2. **Resource Allocation**: Assign team members
3. **Environment Setup**: Prepare development machines
4. **Pilot Testing**: Start with one brand/platform
5. **Full Rollout**: Implement for all brands and platforms

---

**Note**: This plan maintains backward compatibility with existing EAS workflows while adding local build capabilities. The implementation can be done incrementally, starting with one platform and expanding to full multi-brand support.
