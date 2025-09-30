# Quick Reference Command Guide

This consolidated guide provides instant access to all essential commands for the Construction News and Nursing Times deployment pipeline.

## 📋 Table of Contents

- [Environment Setup](#environment-setup)
- [Brand Management](#brand-management)
- [Build Commands](#build-commands)
- [Credential Management](#credential-management)
- [Deployment Commands](#deployment-commands)
- [Testing and Validation](#testing-and-validation)
- [Troubleshooting Commands](#troubleshooting-commands)
- [Emergency Commands](#emergency-commands)

## 🔧 Environment Setup

### Initial Setup

```bash
# Install required tools
npm install -g @expo/eas-cli@latest
sudo gem install fastlane
brew install jq curl git

# Project setup
git clone [repository-url]
cd emap
npm install

# Environment configuration
cp fastlane/.env.template fastlane/.env.fastlane
# Edit fastlane/.env.fastlane with your credentials

# Login to services
eas login
```

### Environment Verification

```bash
# Check tool versions
node --version
npm --version
eas --version
fastlane --version

# Validate environment
fastlane validate_env

# Check project structure
ls -la | grep -E "(package.json|eas.json|app.json|fastlane)"
ls -la brands/
```

## 🏷️ Brand Management

### Brand Switching

```bash
# Set brand for all subsequent commands
export EXPO_PUBLIC_BRAND=cn    # Construction News
export EXPO_PUBLIC_BRAND=nt    # Nursing Times

# Verify current brand
echo $EXPO_PUBLIC_BRAND

# Check brand configuration
cat brands/$EXPO_PUBLIC_BRAND/config.json | jq '.'
```

### Brand Validation

```bash
# Validate brand configurations
jq empty brands/cn/config.json
jq empty brands/nt/config.json

# Check brand assets
ls -la brands/cn/assets/
ls -la brands/nt/assets/

# Verify EAS configuration for brands
jq '.build."production-cn"' eas.json
jq '.build."production-nt"' eas.json
```

## 🏗️ Build Commands

### Development Builds

```bash
# Development build (all platforms)
eas build --platform all --profile development

# Platform-specific development builds
eas build --platform ios --profile development
eas build --platform android --profile development

# Non-interactive development build
eas build --platform all --profile development --non-interactive
```

### Production Builds

```bash
# Construction News production builds
export EXPO_PUBLIC_BRAND=cn
eas build --platform all --profile production-cn
eas build --platform ios --profile production-cn --wait
eas build --platform android --profile production-cn --wait

# Nursing Times production builds
export EXPO_PUBLIC_BRAND=nt
eas build --platform all --profile production-nt
eas build --platform ios --profile production-nt --wait
eas build --platform android --profile production-nt --wait
```

### Build Management

```bash
# List recent builds
eas build:list --limit 10

# List builds for specific platform
eas build:list --platform ios --limit 5
eas build:list --platform android --limit 5

# View specific build
eas build:view BUILD_ID

# View build with logs
eas build:view BUILD_ID --logs

# Cancel running build
eas build:cancel BUILD_ID
```

### Build Status and Monitoring

```bash
# Check build status (JSON format)
eas build:list --limit 5 --json

# Monitor build progress
eas build:view BUILD_ID --wait

# Get build artifacts
eas build:list --limit 1 --json | jq '.[0].artifacts'

# Build performance analysis
eas build:list --limit 10 --json | jq '.[] | {id, platform, status, createdAt, completedAt}'
```

## 🔐 Credential Management

### Credential Configuration

```bash
# Configure iOS credentials
export EXPO_PUBLIC_BRAND=cn
eas credentials:configure --platform ios

export EXPO_PUBLIC_BRAND=nt
eas credentials:configure --platform ios

# Configure Android credentials
export EXPO_PUBLIC_BRAND=cn
eas credentials:configure --platform android

export EXPO_PUBLIC_BRAND=nt
eas credentials:configure --platform android
```

### Credential Inspection

```bash
# List all credentials
eas credentials:list

# List platform-specific credentials
eas credentials:list --platform ios
eas credentials:list --platform android

# List credentials in JSON format
eas credentials:list --platform ios --json
eas credentials:list --platform android --json

# View detailed credential information
eas credentials:list --platform ios --json | jq '.'
```

### Credential Management

```bash
# Delete credentials (DANGEROUS)
eas credentials:delete --platform ios
eas credentials:delete --platform android

# Delete specific credential type
eas credentials:delete --platform ios --type DistributionCertificate
eas credentials:delete --platform android --type Keystore

# Clear and reconfigure credentials
eas credentials:delete --platform ios
eas credentials:configure --platform ios
```

## 🚀 Deployment Commands

### iOS Deployments

```bash
# TestFlight deployments
./scripts/deploy-cn-ios.sh testflight
./scripts/deploy-nt-ios.sh testflight

# Direct Fastlane commands
fastlane ios upload_cn_testflight
fastlane ios upload_nt_testflight

# App Store deployments
./scripts/deploy-cn-ios.sh appstore
./scripts/deploy-nt-ios.sh appstore

fastlane ios upload_cn_appstore
fastlane ios upload_nt_appstore
```

### Android Deployments

```bash
# Internal track deployments
./scripts/deploy-cn-android.sh internal
./scripts/deploy-nt-android.sh internal

fastlane android upload_cn_internal
fastlane android upload_nt_internal

# Beta track deployments
./scripts/deploy-cn-android.sh beta
./scripts/deploy-nt-android.sh beta

fastlane android upload_cn_beta
fastlane android upload_nt_beta

# Production deployments
./scripts/deploy-cn-android.sh production
./scripts/deploy-nt-android.sh production

fastlane android upload_cn_production
fastlane android upload_nt_production
```

### Deployment Utilities

```bash
# List available Fastlane lanes
fastlane list
fastlane show_lanes

# Validate Fastlane environment
fastlane validate_env

# Run Fastlane with verbose output
fastlane ios upload_cn_testflight --verbose
```

## ✅ Testing and Validation

### Configuration Testing

```bash
# Validate project configuration
jq empty eas.json
jq empty app.json
jq empty package.json

# Validate brand configurations
for brand in cn nt; do
    echo "Validating $brand..."
    jq empty "brands/$brand/config.json"
done

# Check for required files
ls -la | grep -E "(package.json|eas.json|app.json)"
ls -la fastlane/ | grep -E "(Fastfile|\.env\.fastlane)"
```

### Credential Testing

```bash
# Test credentials for all brands
brands=("cn" "nt")
for brand in "${brands[@]}"; do
    export EXPO_PUBLIC_BRAND=$brand
    echo "Testing credentials for $brand..."
    eas credentials:list --platform all
done

# Test Fastlane authentication
fastlane validate_env
```

### Build Testing

```bash
# Test development builds
export EXPO_PUBLIC_BRAND=cn
eas build --platform ios --profile development --non-interactive

export EXPO_PUBLIC_BRAND=nt
eas build --platform android --profile development --non-interactive

# Verify build artifacts
eas build:list --limit 2 --json | jq '.[] | {id, status, platform, artifacts}'
```

### End-to-End Testing

```bash
# Complete pipeline test for Construction News
export EXPO_PUBLIC_BRAND=cn
eas build --platform ios --profile production-cn --wait
./scripts/deploy-cn-ios.sh testflight

# Complete pipeline test for Nursing Times
export EXPO_PUBLIC_BRAND=nt
eas build --platform android --profile production-nt --wait
./scripts/deploy-nt-android.sh internal
```

## 🐛 Troubleshooting Commands

### Diagnostic Commands

```bash
# Check EAS service status
curl -s https://status.expo.dev/api/v2/status.json | jq '.status.description'

# Check recent build failures
eas build:list --limit 10 --json | jq '.[] | select(.status=="errored")'

# View build logs
eas build:view BUILD_ID --logs

# Check credential issues
eas credentials:list --platform all --json | jq 'length'
```

### Environment Debugging

```bash
# Check environment variables
env | grep EXPO
env | grep BRAND

# Verify tool installations
which node npm eas fastlane jq

# Check project dependencies
npm ls
npm outdated
npm audit

# Verify file permissions
ls -la fastlane/.env.fastlane
ls -la fastlane/google-play-service-account.json
```

### Build Debugging

```bash
# Verbose build with full logs
eas build --platform ios --profile production-cn --verbose

# Local build test
npx expo run:ios --device
npx expo run:android --device

# Check build configuration
eas build:configure
eas build:inspect --platform ios --profile production-cn
```

### Credential Debugging

```bash
# Check iOS certificate details
eas credentials:list --platform ios --json | jq '.[] | select(.type=="DistributionCertificate")'

# Check Android keystore details
eas credentials:list --platform android --json | jq '.[] | select(.type=="Keystore")'

# Test keystore locally (if available)
keytool -list -v -keystore path/to/keystore.keystore
```

## 🚨 Emergency Commands

### Emergency Build

```bash
# Emergency production build
export EXPO_PUBLIC_BRAND=cn
eas build --platform all --profile production-cn --wait --clear-cache

# Emergency deployment
./scripts/deploy-cn-ios.sh testflight
./scripts/deploy-cn-android.sh internal
```

### Emergency Credential Reset

```bash
# Reset iOS credentials
export EXPO_PUBLIC_BRAND=cn
eas credentials:delete --platform ios
eas credentials:configure --platform ios

# Reset Android credentials
export EXPO_PUBLIC_BRAND=cn
eas credentials:delete --platform android
eas credentials:configure --platform android
```

### Emergency Recovery

```bash
# Clear all caches
rm -rf node_modules package-lock.json
npm install

# Reset EAS configuration
eas build:configure

# Verify environment
fastlane validate_env
eas credentials:list
```

### Emergency Rollback

```bash
# Get previous successful build
eas build:list --platform ios --limit 10 --json | jq '.[] | select(.status=="finished")'

# Emergency hotfix build
git checkout -b hotfix/emergency-$(date +%Y%m%d)
# Make necessary fixes
export EXPO_PUBLIC_BRAND=cn
eas build --platform all --profile production-cn --wait
```

## 📊 Monitoring and Reporting

### Build Monitoring

```bash
# Build success rate analysis
eas build:list --limit 50 --json | jq 'group_by(.status) | map({status: .[0].status, count: length})'

# Recent build performance
eas build:list --limit 10 --json | jq '.[] | {id, platform, status, duration: (.completedAt // now | fromdateiso8601) - (.createdAt | fromdateiso8601)}'

# Platform-specific build stats
eas build:list --platform ios --limit 20 --json | jq 'group_by(.status) | map({status: .[0].status, count: length})'
```

### Credential Monitoring

```bash
# Certificate expiration check
eas credentials:list --platform ios --json | jq '.[] | select(.type=="DistributionCertificate") | {name, validUntil}'

# Credential summary
echo "iOS Credentials:"
eas credentials:list --platform ios --json | jq 'group_by(.type) | map({type: .[0].type, count: length})'

echo "Android Credentials:"
eas credentials:list --platform android --json | jq 'group_by(.type) | map({type: .[0].type, count: length})'
```

### System Health Check

```bash
# Complete system health check
echo "=== System Health Check ==="
echo "EAS Service Status:"
curl -s https://status.expo.dev/api/v2/status.json | jq '.status.description'

echo "Recent Builds:"
eas build:list --limit 5

echo "Credentials Status:"
for brand in cn nt; do
    export EXPO_PUBLIC_BRAND=$brand
    echo "Brand: $brand"
    eas credentials:list --platform all
done

echo "Environment Status:"
fastlane validate_env
```

## 🔄 Batch Operations

### Multi-Brand Operations

```bash
# Configure credentials for all brands
brands=("cn" "nt")
platforms=("ios" "android")

for brand in "${brands[@]}"; do
    export EXPO_PUBLIC_BRAND=$brand
    for platform in "${platforms[@]}"; do
        echo "Configuring $platform credentials for $brand..."
        eas credentials:configure --platform $platform
    done
done
```

### Bulk Build Operations

```bash
# Build all brands for all platforms
brands=("cn" "nt")

for brand in "${brands[@]}"; do
    export EXPO_PUBLIC_BRAND=$brand
    echo "Building production for $brand..."
    eas build --platform all --profile "production-$brand" --non-interactive
done
```

### Bulk Deployment

```bash
# Deploy all brands to internal/testflight
./scripts/deploy-cn-ios.sh testflight &
./scripts/deploy-nt-ios.sh testflight &
./scripts/deploy-cn-android.sh internal &
./scripts/deploy-nt-android.sh internal &
wait

echo "All deployments completed"
```

## 📚 Useful Aliases

Add these to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# Brand switching aliases
alias brand-cn='export EXPO_PUBLIC_BRAND=cn && echo "Switched to Construction News"'
alias brand-nt='export EXPO_PUBLIC_BRAND=nt && echo "Switched to Nursing Times"'

# Build aliases
alias build-dev='eas build --platform all --profile development --non-interactive'
alias build-prod='eas build --platform all --profile production-$EXPO_PUBLIC_BRAND --non-interactive'
alias build-ios='eas build --platform ios --profile production-$EXPO_PUBLIC_BRAND --wait'
alias build-android='eas build --platform android --profile production-$EXPO_PUBLIC_BRAND --wait'

# Deployment aliases
alias deploy-ios-test='./scripts/deploy-$EXPO_PUBLIC_BRAND-ios.sh testflight'
alias deploy-android-internal='./scripts/deploy-$EXPO_PUBLIC_BRAND-android.sh internal'

# Utility aliases
alias check-builds='eas build:list --limit 10'
alias check-creds='eas credentials:list --platform all'
alias validate-env='fastlane validate_env'

# Emergency aliases
alias emergency-reset='eas credentials:delete --platform all && eas credentials:configure --platform all'
alias health-check='curl -s https://status.expo.dev/api/v2/status.json | jq ".status.description" && fastlane validate_env'
```

## 🔍 Search and Filter Commands

### Build Filtering

```bash
# Find failed builds
eas build:list --limit 50 --json | jq '.[] | select(.status=="errored")'

# Find builds by platform
eas build:list --limit 20 --json | jq '.[] | select(.platform=="ios")'

# Find recent successful builds
eas build:list --limit 10 --json | jq '.[] | select(.status=="finished")'

# Find builds by profile
eas build:list --limit 20 --json | jq '.[] | select(.buildProfile=="production-cn")'
```

### Credential Filtering

```bash
# Find expiring certificates (within 30 days)
eas credentials:list --platform ios --json | jq --arg date "$(date -d '+30 days' -u +%Y-%m-%dT%H:%M:%S.%3NZ)" '.[] | select(.type=="DistributionCertificate" and .validUntil < $date)'

# Find certificates by name
eas credentials:list --platform ios --json | jq '.[] | select(.name | contains("EMAP"))'
```

## 📋 Checklists

### Daily Operations Checklist

```bash
# Daily operations commands
echo "=== Daily Operations Checklist ==="
echo "[ ] Check build status: eas build:list --limit 5"
echo "[ ] Validate environment: fastlane validate_env"
echo "[ ] Check credentials: eas credentials:list --platform all"
echo "[ ] Monitor service status: curl -s https://status.expo.dev/api/v2/status.json | jq '.status.description'"
```

### Pre-Deployment Checklist

```bash
# Pre-deployment verification
echo "=== Pre-Deployment Checklist ==="
echo "[ ] Set brand: export EXPO_PUBLIC_BRAND=[cn|nt]"
echo "[ ] Validate config: jq empty brands/\$EXPO_PUBLIC_BRAND/config.json"
echo "[ ] Check credentials: eas credentials:list --platform all"
echo "[ ] Test build: eas build --platform all --profile development"
echo "[ ] Validate environment: fastlane validate_env"
```

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: Monthly

This quick reference guide provides instant access to all essential commands for efficient management of the Construction News and Nursing Times deployment pipeline.
