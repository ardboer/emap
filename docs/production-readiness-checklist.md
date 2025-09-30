# Production Readiness Checklist

This comprehensive checklist ensures both Construction News and Nursing Times apps are fully prepared for production deployment to Apple App Store and Google Play Store.

## 📋 Table of Contents

- [Overview](#overview)
- [Pre-Deployment Verification](#pre-deployment-verification)
- [Technical Readiness](#technical-readiness)
- [Store Readiness](#store-readiness)
- [Compliance and Legal](#compliance-and-legal)
- [Final Verification](#final-verification)
- [Go-Live Checklist](#go-live-checklist)

## 🎯 Overview

### Checklist Purpose

This checklist ensures:

- All technical requirements are met
- Store policies are complied with
- Legal and privacy requirements are satisfied
- Apps are ready for public release
- Team is prepared for post-launch support

### Multi-Brand Verification

All checks must be completed for both brands:

- **Construction News** (`cn`): `metropolis.co.uk.constructionnews`
- **Nursing Times** (`nt`): `metropolis.net.nursingtimes`

## ✅ Pre-Deployment Verification

### Environment Setup

```bash
#!/bin/bash
# production-readiness-check.sh

echo "=== Production Readiness Check ==="

brands=("cn" "nt")
all_checks_passed=true

for brand in "${brands[@]}"; do
    echo ""
    echo "Checking brand: $brand"
    echo "=========================="

    export EXPO_PUBLIC_BRAND=$brand

    # Check brand configuration
    if [ -f "brands/$brand/config.json" ]; then
        echo "✅ Brand configuration exists"

        # Validate JSON
        if jq empty "brands/$brand/config.json" 2>/dev/null; then
            echo "✅ Brand configuration is valid JSON"
        else
            echo "❌ Brand configuration has invalid JSON"
            all_checks_passed=false
        fi
    else
        echo "❌ Brand configuration missing"
        all_checks_passed=false
    fi

    # Check assets
    assets_dir="brands/$brand/assets"
    required_assets=("icon.png" "adaptive-icon.png" "splash-icon.png" "favicon.png")

    for asset in "${required_assets[@]}"; do
        if [ -f "$assets_dir/$asset" ]; then
            echo "✅ Asset found: $asset"
        else
            echo "❌ Asset missing: $asset"
            all_checks_passed=false
        fi
    done
done

if [ "$all_checks_passed" = true ]; then
    echo ""
    echo "🎉 All pre-deployment checks passed!"
else
    echo ""
    echo "❌ Some checks failed. Please fix issues before proceeding."
    exit 1
fi
```

### Development Environment

- [ ] **Node.js Version**: Latest LTS version installed
- [ ] **npm/yarn**: Latest version installed
- [ ] **EAS CLI**: Latest version installed (`npm install -g @expo/eas-cli@latest`)
- [ ] **Fastlane**: Latest version installed
- [ ] **Xcode**: Latest stable version (for iOS builds)
- [ ] **Android Studio**: Latest stable version (for Android builds)
- [ ] **Java JDK**: Version 11 or higher installed

### Project Configuration

- [ ] **package.json**: All dependencies up to date
- [ ] **eas.json**: Properly configured for both brands
- [ ] **app.json**: Correct configuration for default brand
- [ ] **Brand Configurations**: Valid JSON for both cn and nt
- [ ] **Environment Variables**: All required variables set
- [ ] **Git Repository**: Clean working directory, all changes committed

## 🔧 Technical Readiness

### Code Quality

```bash
#!/bin/bash
# code-quality-verification.sh

echo "=== Code Quality Verification ==="

# Linting
echo "Running ESLint..."
if npm run lint; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
    exit 1
fi

# Type checking
echo "Running TypeScript check..."
if npx tsc --noEmit; then
    echo "✅ Type checking passed"
else
    echo "❌ Type checking failed"
    exit 1
fi

# Security audit
echo "Running security audit..."
if npm audit --audit-level=high; then
    echo "✅ No high-severity vulnerabilities"
else
    echo "⚠️  High-severity vulnerabilities found"
    echo "Please review and fix before production deployment"
fi

# Bundle analysis
echo "Analyzing bundle size..."
npx expo export --platform all
echo "✅ Bundle analysis complete"

echo "✅ Code quality verification complete"
```

### Performance Verification

- [ ] **Bundle Size**: Optimized for both platforms
- [ ] **Image Assets**: Compressed and optimized
- [ ] **Dependencies**: No unused dependencies
- [ ] **Memory Usage**: Tested on low-end devices
- [ ] **Network Usage**: Efficient API calls and caching
- [ ] **Battery Usage**: Optimized background processes

### Build Verification

```bash
#!/bin/bash
# build-verification.sh

echo "=== Build Verification ==="

brands=("cn" "nt")
platforms=("ios" "android")

for brand in "${brands[@]}"; do
    echo ""
    echo "Verifying builds for brand: $brand"
    echo "=================================="

    export EXPO_PUBLIC_BRAND=$brand

    for platform in "${platforms[@]}"; do
        echo "Platform: $platform"

        # Check latest build
        profile="production-$brand"
        latest_build=$(eas build:list --platform $platform --profile $profile --limit 1 --json)

        if [ "$latest_build" != "[]" ]; then
            build_status=$(echo $latest_build | jq -r '.[0].status')
            build_id=$(echo $latest_build | jq -r '.[0].id')

            if [ "$build_status" = "finished" ]; then
                echo "✅ Latest build successful: $build_id"

                # Check artifact
                artifact_url=$(echo $latest_build | jq -r '.[0].artifacts.buildUrl')
                if [ "$artifact_url" != "null" ]; then
                    echo "✅ Build artifact available"
                else
                    echo "❌ Build artifact missing"
                fi
            else
                echo "❌ Latest build not successful: $build_status"
            fi
        else
            echo "❌ No builds found"
        fi
    done
done

echo "✅ Build verification complete"
```

### Credentials Verification

```bash
#!/bin/bash
# credentials-verification.sh

echo "=== Credentials Verification ==="

brands=("cn" "nt")
platforms=("ios" "android")

for brand in "${brands[@]}"; do
    echo ""
    echo "Verifying credentials for brand: $brand"
    echo "======================================"

    export EXPO_PUBLIC_BRAND=$brand

    for platform in "${platforms[@]}"; do
        echo "Platform: $platform"

        credentials=$(eas credentials:list --platform $platform --json 2>/dev/null)

        if [ $? -eq 0 ] && [ "$credentials" != "[]" ]; then
            if [ "$platform" = "ios" ]; then
                cert_count=$(echo $credentials | jq '[.[] | select(.type=="DistributionCertificate")] | length')
                profile_count=$(echo $credentials | jq '[.[] | select(.type=="ProvisioningProfile")] | length')

                if [ "$cert_count" -gt 0 ] && [ "$profile_count" -gt 0 ]; then
                    echo "✅ iOS credentials complete"

                    # Check certificate expiration
                    cert_expiry=$(echo $credentials | jq -r '.[] | select(.type=="DistributionCertificate") | .validUntil')
                    echo "   Certificate expires: $cert_expiry"
                else
                    echo "❌ iOS credentials incomplete"
                fi
            else
                keystore_count=$(echo $credentials | jq '[.[] | select(.type=="Keystore")] | length')

                if [ "$keystore_count" -gt 0 ]; then
                    echo "✅ Android credentials complete"
                else
                    echo "❌ Android credentials incomplete"
                fi
            fi
        else
            echo "❌ No $platform credentials found"
        fi
    done
done

# Verify Fastlane environment
echo ""
echo "Verifying Fastlane environment..."
if fastlane validate_env; then
    echo "✅ Fastlane environment valid"
else
    echo "❌ Fastlane environment issues"
fi

echo "✅ Credentials verification complete"
```

## 📱 Store Readiness

### App Store Connect Readiness

#### Construction News

- [ ] **App Created**: App exists in App Store Connect
- [ ] **Bundle ID**: `metropolis.co.uk.constructionnews` registered
- [ ] **App Information**:
  - [ ] App name: "Construction News"
  - [ ] Subtitle: Compelling subtitle (30 characters max)
  - [ ] Category: News
  - [ ] Content rating: Appropriate rating selected
- [ ] **App Store Listing**:
  - [ ] App description: Complete and compelling
  - [ ] Keywords: Optimized for search
  - [ ] Support URL: Valid and accessible
  - [ ] Marketing URL: Valid (if applicable)
  - [ ] Privacy Policy URL: Valid and accessible
- [ ] **App Review Information**:
  - [ ] Contact information: Complete and accurate
  - [ ] Demo account: Provided if app requires login
  - [ ] Review notes: Clear instructions for reviewers
- [ ] **Pricing and Availability**:
  - [ ] Price: Set to Free
  - [ ] Availability: All territories selected
- [ ] **App Privacy**:
  - [ ] Privacy practices: Accurately described
  - [ ] Data collection: Properly categorized
  - [ ] Third-party tracking: Disclosed if applicable

#### Nursing Times

- [ ] **App Created**: App exists in App Store Connect
- [ ] **Bundle ID**: `metropolis.net.nursingtimes` registered
- [ ] **App Information**:
  - [ ] App name: "Nursing Times"
  - [ ] Subtitle: Compelling subtitle (30 characters max)
  - [ ] Category: Medical
  - [ ] Content rating: Appropriate rating selected
- [ ] **App Store Listing**: (Same requirements as Construction News)
- [ ] **App Review Information**: (Same requirements as Construction News)
- [ ] **Pricing and Availability**: (Same requirements as Construction News)
- [ ] **App Privacy**: (Same requirements as Construction News)

### Google Play Console Readiness

#### Construction News

- [ ] **App Created**: App exists in Google Play Console
- [ ] **Package Name**: `metropolis.co.uk.constructionnews` registered
- [ ] **Store Listing**:
  - [ ] App name: "Construction News"
  - [ ] Short description: Compelling (80 characters max)
  - [ ] Full description: Complete and engaging
  - [ ] App category: News & Magazines
  - [ ] Content rating: Completed questionnaire
  - [ ] Target audience: Adults
- [ ] **App Content**:
  - [ ] Privacy Policy: Valid URL provided
  - [ ] Data safety: Complete and accurate
  - [ ] Permissions: Justified and minimal
- [ ] **Store Settings**:
  - [ ] App availability: All countries selected
  - [ ] Pricing: Set to Free
  - [ ] In-app products: None (unless applicable)

#### Nursing Times

- [ ] **App Created**: App exists in Google Play Console
- [ ] **Package Name**: `metropolis.net.nursingtimes` registered
- [ ] **Store Listing**:
  - [ ] App name: "Nursing Times"
  - [ ] Short description: Compelling (80 characters max)
  - [ ] Full description: Complete and engaging
  - [ ] App category: Medical
  - [ ] Content rating: Completed questionnaire
  - [ ] Target audience: Adults
- [ ] **App Content**: (Same requirements as Construction News)
- [ ] **Store Settings**: (Same requirements as Construction News)

### Assets Verification

```bash
#!/bin/bash
# assets-verification.sh

echo "=== Assets Verification ==="

brands=("cn" "nt")

for brand in "${brands[@]}"; do
    echo ""
    echo "Verifying assets for brand: $brand"
    echo "=================================="

    assets_dir="brands/$brand/assets"

    # Required assets
    required_assets=(
        "icon.png:1024x1024"
        "adaptive-icon.png:1024x1024"
        "splash-icon.png:1024x1024"
        "favicon.png:48x48"
    )

    for asset_spec in "${required_assets[@]}"; do
        asset_name=$(echo $asset_spec | cut -d: -f1)
        expected_size=$(echo $asset_spec | cut -d: -f2)
        asset_path="$assets_dir/$asset_name"

        if [ -f "$asset_path" ]; then
            # Check if it's an image file
            if file "$asset_path" | grep -q "image"; then
                echo "✅ Asset valid: $asset_name"

                # Check dimensions (requires ImageMagick)
                if command -v identify &> /dev/null; then
                    actual_size=$(identify -format "%wx%h" "$asset_path")
                    if [ "$actual_size" = "$expected_size" ]; then
                        echo "   ✅ Correct dimensions: $actual_size"
                    else
                        echo "   ⚠️  Unexpected dimensions: $actual_size (expected: $expected_size)"
                    fi
                fi
            else
                echo "❌ Invalid image file: $asset_name"
            fi
        else
            echo "❌ Asset missing: $asset_name"
        fi
    done
done

echo "✅ Assets verification complete"
```

## 📋 Compliance and Legal

### Privacy and Data Protection

- [ ] **Privacy Policy**:

  - [ ] Construction News: https://www.constructionnews.co.uk/privacy-policy accessible
  - [ ] Nursing Times: https://www.nursingtimes.net/privacy-policy accessible
  - [ ] Policies cover all data collection and usage
  - [ ] GDPR compliance verified
  - [ ] Cookie policies included (if applicable)

- [ ] **Data Collection Disclosure**:

  - [ ] All data collection properly disclosed
  - [ ] Third-party services documented
  - [ ] Analytics tracking disclosed
  - [ ] Advertising tracking disclosed (if applicable)

- [ ] **User Consent**:
  - [ ] Appropriate consent mechanisms implemented
  - [ ] Opt-out options available
  - [ ] Clear consent language used

### Content and Legal Compliance

- [ ] **Content Review**:

  - [ ] All content reviewed for accuracy
  - [ ] No copyrighted material without permission
  - [ ] All images properly licensed
  - [ ] Text content original or properly attributed

- [ ] **Terms of Service**:

  - [ ] Terms of service accessible
  - [ ] Terms cover app usage
  - [ ] Liability limitations included
  - [ ] Dispute resolution process defined

- [ ] **Accessibility**:
  - [ ] Basic accessibility features implemented
  - [ ] Screen reader compatibility tested
  - [ ] Color contrast meets standards
  - [ ] Text scaling supported

### Store Policy Compliance

#### Apple App Store Guidelines

- [ ] **Design Guidelines**:

  - [ ] Human Interface Guidelines followed
  - [ ] Native iOS design patterns used
  - [ ] Appropriate use of system features

- [ ] **Content Guidelines**:

  - [ ] No objectionable content
  - [ ] Accurate app description
  - [ ] Appropriate content rating

- [ ] **Technical Guidelines**:
  - [ ] App performs as described
  - [ ] No crashes or major bugs
  - [ ] Efficient resource usage

#### Google Play Policies

- [ ] **Content Policy**:

  - [ ] No prohibited content
  - [ ] Accurate app description
  - [ ] Appropriate content rating

- [ ] **Technical Requirements**:
  - [ ] App functions properly
  - [ ] No malicious behavior
  - [ ] Proper permissions usage

## 🔍 Final Verification

### Pre-Launch Testing

```bash
#!/bin/bash
# pre-launch-testing.sh

echo "=== Pre-Launch Testing ==="

brands=("cn" "nt")

for brand in "${brands[@]}"; do
    echo ""
    echo "Pre-launch testing for brand: $brand"
    echo "===================================="

    case $brand in
        "cn")
            app_name="Construction News"
            ;;
        "nt")
            app_name="Nursing Times"
            ;;
    esac

    echo "App: $app_name"
    echo ""

    echo "Manual Testing Checklist:"
    echo "========================="
    echo "[ ] App launches successfully"
    echo "[ ] All main features work correctly"
    echo "[ ] Navigation flows properly"
    echo "[ ] Content loads correctly"
    echo "[ ] Search functionality works"
    echo "[ ] Settings can be accessed and modified"
    echo "[ ] App handles network errors gracefully"
    echo "[ ] App works in both light and dark modes"
    echo "[ ] App works on different screen sizes"
    echo "[ ] Performance is acceptable"
    echo "[ ] No crashes during normal usage"
    echo "[ ] Memory usage is reasonable"
    echo "[ ] Battery usage is reasonable"
    echo ""

    echo "Device Testing:"
    echo "==============="
    echo "[ ] iPhone (latest iOS)"
    echo "[ ] iPhone (iOS-1)"
    echo "[ ] iPad (latest iOS)"
    echo "[ ] Android phone (latest Android)"
    echo "[ ] Android phone (Android-1)"
    echo "[ ] Android tablet (latest Android)"
    echo ""
done

echo "✅ Pre-launch testing checklist complete"
echo "Please complete all manual testing before proceeding"
```

### Performance Benchmarks

- [ ] **App Launch Time**: < 3 seconds on average devices
- [ ] **Content Load Time**: < 2 seconds for articles
- [ ] **Search Response Time**: < 1 second for queries
- [ ] **Memory Usage**: < 100MB during normal usage
- [ ] **Battery Impact**: Minimal background battery usage
- [ ] **Network Usage**: Efficient data usage with caching

### Security Verification

- [ ] **API Security**: All API calls use HTTPS
- [ ] **Data Storage**: Sensitive data properly encrypted
- [ ] **Authentication**: Secure authentication implementation
- [ ] **Network Security**: Certificate pinning implemented (if applicable)
- [ ] **Code Obfuscation**: Production builds properly obfuscated

## 🚀 Go-Live Checklist

### Final Deployment Verification

```bash
#!/bin/bash
# go-live-verification.sh

echo "=== Go-Live Verification ==="

# Final environment check
echo "1. Final environment check..."
fastlane validate_env

# Final build verification
echo "2. Final build verification..."
brands=("cn" "nt")
for brand in "${brands[@]}"; do
    export EXPO_PUBLIC_BRAND=$brand
    echo "Checking final builds for $brand..."
    eas build:list --limit 1 --json | jq '.[] | {id, status, platform, createdAt}'
done

# Final credentials check
echo "3. Final credentials check..."
for brand in "${brands[@]}"; do
    export EXPO_PUBLIC_BRAND=$brand
    echo "Checking credentials for $brand..."
    eas credentials:list --platform all
done

# Store readiness confirmation
echo "4. Store readiness confirmation..."
echo "   [ ] App Store Connect: All information complete"
echo "   [ ] Google Play Console: All information complete"
echo "   [ ] Assets uploaded and verified"
echo "   [ ] Descriptions and metadata finalized"

# Team readiness
echo "5. Team readiness..."
echo "   [ ] Support team briefed"
echo "   [ ] Marketing team ready"
echo "   [ ] Development team on standby"
echo "   [ ] Monitoring systems active"

echo "✅ Go-live verification complete"
```

### Launch Day Checklist

- [ ] **Morning Preparation**:

  - [ ] All team members notified
  - [ ] Monitoring systems active
  - [ ] Support channels ready
  - [ ] Rollback plan reviewed

- [ ] **Deployment Execution**:

  - [ ] Final builds deployed to stores
  - [ ] Store submissions completed
  - [ ] Deployment confirmations received
  - [ ] Initial monitoring checks passed

- [ ] **Post-Launch Monitoring**:
  - [ ] App store availability confirmed
  - [ ] Download and installation testing
  - [ ] User feedback monitoring active
  - [ ] Performance monitoring active
  - [ ] Error tracking active

### Success Criteria

- [ ] **Technical Success**:

  - [ ] Apps available in both stores
  - [ ] No critical bugs reported in first 24 hours
  - [ ] Performance metrics within acceptable ranges
  - [ ] No security issues identified

- [ ] **Business Success**:
  - [ ] Download targets met (if applicable)
  - [ ] User ratings above 4.0 stars
  - [ ] Positive user feedback
  - [ ] Marketing goals achieved

## 📊 Post-Launch Monitoring

### Week 1 Monitoring

- [ ] **Daily Checks**:

  - [ ] App store availability
  - [ ] User ratings and reviews
  - [ ] Crash reports
  - [ ] Performance metrics
  - [ ] Support ticket volume

- [ ] **Weekly Review**:
  - [ ] Download statistics
  - [ ] User engagement metrics
  - [ ] Performance trends
  - [ ] Feedback analysis
  - [ ] Issue resolution status

### Long-term Monitoring

- [ ] **Monthly Reviews**:
  - [ ] Performance trends
  - [ ] User feedback analysis
  - [ ] Store optimization opportunities
  - [ ] Feature usage analytics
  - [ ] Competitive analysis

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: Before each major release

This production readiness checklist ensures both Construction News and Nursing Times apps meet all requirements for successful App Store and Google Play Store deployment.
