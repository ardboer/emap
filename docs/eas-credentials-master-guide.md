# EAS Credentials Management Master Guide

This comprehensive guide covers all aspects of managing EAS credentials for both Construction News and Nursing Times apps, including setup, troubleshooting, and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Credentials Setup](#initial-credentials-setup)
- [Credentials Management Commands](#credentials-management-commands)
- [Multi-Brand Credential Configuration](#multi-brand-credential-configuration)
- [Credential Sharing and Team Management](#credential-sharing-and-team-management)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Best Practices](#best-practices)
- [Emergency Procedures](#emergency-procedures)

## 🎯 Overview

### What EAS Credentials Manages

EAS Credentials handles all signing credentials for your apps:

**iOS:**

- Distribution certificates
- Provisioning profiles
- Push notification certificates
- App Store Connect API keys

**Android:**

- Upload keystores
- Google Play service account keys
- Firebase service account keys

### Multi-Brand Architecture

Your project uses brand-specific credential management:

- **Construction News** (`cn`): `metropolis.co.uk.constructionnews`
- **Nursing Times** (`nt`): `metropolis.net.nursingtimes`

## ✅ Prerequisites

### Required Software

- [ ] EAS CLI installed and updated
- [ ] Expo account with appropriate permissions
- [ ] Access to Apple Developer Portal
- [ ] Access to Google Play Console

### Verify EAS CLI Installation

```bash
# Check EAS CLI version
eas --version

# Update if needed
npm install -g @expo/eas-cli@latest

# Login to Expo
eas login
```

### Project Setup

```bash
# Ensure you're in the project root
cd /path/to/your/project

# Verify EAS configuration
cat eas.json | jq '.build'
```

## 🔧 Initial Credentials Setup

### Step 1: iOS Credentials Setup

#### Construction News iOS Credentials

```bash
# Set brand environment
export EXPO_PUBLIC_BRAND=cn

# Configure iOS credentials
eas credentials:configure --platform ios

# Follow the interactive prompts:
# 1. Select your Apple Team
# 2. Choose certificate option:
#    - "Use existing Distribution Certificate" (if you have one)
#    - "Generate new Distribution Certificate" (if needed)
# 3. Choose provisioning profile option:
#    - "Use existing Provisioning Profile" (if you have one)
#    - "Generate new Provisioning Profile" (recommended)
```

#### Nursing Times iOS Credentials

```bash
# Set brand environment
export EXPO_PUBLIC_BRAND=nt

# Configure iOS credentials
eas credentials:configure --platform ios

# Use the same Distribution Certificate as Construction News
# Generate new Provisioning Profile for Nursing Times bundle ID
```

### Step 2: Android Credentials Setup

#### Construction News Android Credentials

```bash
# Set brand environment
export EXPO_PUBLIC_BRAND=cn

# Configure Android credentials
eas credentials:configure --platform android

# Choose keystore option:
# Option 1: Use existing keystore (recommended for master keystore approach)
# - Provide path: ~/keystores/emap-master-upload-key.keystore
# - Enter keystore password
# - Enter alias: cn-upload
# - Enter key password

# Option 2: Generate new keystore (if starting fresh)
# - EAS will generate and manage the keystore
```

#### Nursing Times Android Credentials

```bash
# Set brand environment
export EXPO_PUBLIC_BRAND=nt

# Configure Android credentials
eas credentials:configure --platform android

# Use the same master keystore with different alias:
# - Provide path: ~/keystores/emap-master-upload-key.keystore
# - Enter keystore password (same as Construction News)
# - Enter alias: nt-upload
# - Enter key password (same as keystore password)
```

## 📱 Credentials Management Commands

### Listing Credentials

```bash
# List all credentials
eas credentials:list

# List iOS credentials only
eas credentials:list --platform ios

# List Android credentials only
eas credentials:list --platform android

# List credentials in JSON format
eas credentials:list --json

# List credentials for specific brand
EXPO_PUBLIC_BRAND=cn eas credentials:list --platform ios
EXPO_PUBLIC_BRAND=nt eas credentials:list --platform android
```

### Viewing Detailed Credential Information

```bash
# View detailed iOS credentials
eas credentials:list --platform ios --json | jq '.'

# View specific certificate details
eas credentials:list --platform ios --json | jq '.[] | select(.type=="DistributionCertificate")'

# View provisioning profile details
eas credentials:list --platform ios --json | jq '.[] | select(.type=="ProvisioningProfile")'
```

### Updating Credentials

```bash
# Update iOS credentials
EXPO_PUBLIC_BRAND=cn eas credentials:configure --platform ios

# Update Android credentials
EXPO_PUBLIC_BRAND=nt eas credentials:configure --platform android

# Force reconfigure (clears existing and starts fresh)
eas credentials:configure --platform ios --clear-credentials
```

### Deleting Credentials

```bash
# Delete all credentials for a platform (DANGEROUS)
eas credentials:delete --platform ios

# Delete specific credential type
eas credentials:delete --platform ios --type DistributionCertificate

# Delete credentials for specific brand
EXPO_PUBLIC_BRAND=cn eas credentials:delete --platform android
```

## 🏢 Multi-Brand Credential Configuration

### Brand-Specific Credential Management

```bash
# Function to configure credentials for any brand
configure_brand_credentials() {
    local brand=$1
    local platform=$2

    echo "Configuring $platform credentials for brand: $brand"
    export EXPO_PUBLIC_BRAND=$brand
    eas credentials:configure --platform $platform
}

# Usage examples:
configure_brand_credentials "cn" "ios"
configure_brand_credentials "cn" "android"
configure_brand_credentials "nt" "ios"
configure_brand_credentials "nt" "android"
```

### Batch Credential Setup

```bash
#!/bin/bash
# setup-all-credentials.sh

brands=("cn" "nt")
platforms=("ios" "android")

for brand in "${brands[@]}"; do
    for platform in "${platforms[@]}"; do
        echo "Setting up $platform credentials for $brand..."
        export EXPO_PUBLIC_BRAND=$brand
        eas credentials:configure --platform $platform --non-interactive
    done
done
```

### Credential Verification Script

```bash
#!/bin/bash
# verify-credentials.sh

echo "=== EAS Credentials Verification ==="

brands=("cn" "nt")
platforms=("ios" "android")

for brand in "${brands[@]}"; do
    echo ""
    echo "Brand: $brand"
    echo "=================="

    for platform in "${platforms[@]}"; do
        echo "Platform: $platform"
        export EXPO_PUBLIC_BRAND=$brand

        # Check if credentials exist
        credentials=$(eas credentials:list --platform $platform --json 2>/dev/null)

        if [ $? -eq 0 ] && [ "$credentials" != "[]" ]; then
            echo "✅ $platform credentials configured"

            # Show credential summary
            if [ "$platform" = "ios" ]; then
                echo "   - Distribution Certificate: $(echo $credentials | jq -r '.[] | select(.type=="DistributionCertificate") | .name // "Not found"')"
                echo "   - Provisioning Profile: $(echo $credentials | jq -r '.[] | select(.type=="ProvisioningProfile") | .name // "Not found"')"
            else
                echo "   - Keystore: $(echo $credentials | jq -r '.[] | select(.type=="Keystore") | .keyAlias // "Not found"')"
            fi
        else
            echo "❌ $platform credentials not configured"
        fi
        echo ""
    done
done
```

## 👥 Credential Sharing and Team Management

### Understanding EAS Credential Sharing

EAS credentials are tied to your Expo account and can be shared with team members through:

1. **Expo Organizations**: Recommended for teams
2. **Individual Account Sharing**: Less secure, not recommended

### Setting Up Expo Organization

```bash
# Create or join an organization
eas account:view

# If you need to create an organization:
# Go to https://expo.dev/accounts/[username]/settings/organizations
# Create "EMAP Publishing" organization
# Invite team members
```

### Team Member Access Levels

**Owner:**

- Full access to all credentials
- Can manage team members
- Can delete credentials

**Admin:**

- Can configure and update credentials
- Can view all credentials
- Cannot delete credentials

**Developer:**

- Can view credentials
- Can build with existing credentials
- Cannot modify credentials

### Adding Team Members

```bash
# Invite team member to organization (done via web interface)
# https://expo.dev/accounts/[org]/settings/members

# Verify team member access
eas account:view
```

## 🐛 Troubleshooting Guide

### Common iOS Credential Issues

#### "No valid iOS Distribution certificate found"

**Symptoms:**

- Build fails with certificate error
- EAS cannot find distribution certificate

**Diagnosis:**

```bash
# Check current certificates
eas credentials:list --platform ios

# Check Apple Developer Portal
# Go to Certificates, Identifiers & Profiles > Certificates
```

**Solutions:**

1. **Certificate Expired:**

   ```bash
   # Generate new certificate
   eas credentials:configure --platform ios
   # Select "Generate new Distribution Certificate"
   ```

2. **Certificate Not in EAS:**

   ```bash
   # Add existing certificate to EAS
   eas credentials:configure --platform ios
   # Select "Use existing Distribution Certificate"
   # Upload your .p12 file
   ```

3. **Certificate Revoked:**
   ```bash
   # Create new certificate in Apple Developer Portal
   # Then add to EAS
   eas credentials:configure --platform ios
   ```

#### "Provisioning profile doesn't include signing certificate"

**Symptoms:**

- Build fails during signing
- Profile/certificate mismatch error

**Diagnosis:**

```bash
# Check provisioning profile details
eas credentials:list --platform ios --json | jq '.[] | select(.type=="ProvisioningProfile")'
```

**Solutions:**

1. **Regenerate Provisioning Profile:**

   ```bash
   eas credentials:configure --platform ios
   # Select "Generate new Provisioning Profile"
   ```

2. **Update Existing Profile:**

   ```bash
   # Delete old profile
   eas credentials:delete --platform ios --type ProvisioningProfile

   # Create new one
   eas credentials:configure --platform ios
   ```

#### "Bundle identifier mismatch"

**Symptoms:**

- Profile doesn't match app bundle ID
- Build fails with identifier error

**Diagnosis:**

```bash
# Check bundle ID in eas.json
cat eas.json | jq '.build."production-cn".ios.bundleIdentifier'
cat eas.json | jq '.build."production-nt".ios.bundleIdentifier'

# Check provisioning profile bundle ID
eas credentials:list --platform ios --json | jq '.[] | select(.type=="ProvisioningProfile") | .bundleIdentifier'
```

**Solutions:**

1. **Fix Bundle ID in eas.json:**

   ```bash
   # Edit eas.json to match Apple Developer Portal
   nano eas.json
   ```

2. **Regenerate Profile with Correct Bundle ID:**
   ```bash
   eas credentials:configure --platform ios
   ```

### Common Android Credential Issues

#### "Keystore not found or invalid"

**Symptoms:**

- Build fails with keystore error
- Cannot sign APK/AAB

**Diagnosis:**

```bash
# Check Android credentials
eas credentials:list --platform android

# Verify keystore file exists (if using local keystore)
ls -la ~/keystores/emap-master-upload-key.keystore
```

**Solutions:**

1. **Keystore File Missing:**

   ```bash
   # Restore from backup
   cp ~/keystores/emap-master-upload-key.keystore.backup ~/keystores/emap-master-upload-key.keystore

   # Reconfigure EAS
   eas credentials:configure --platform android
   ```

2. **Wrong Keystore Password:**

   ```bash
   # Test keystore password
   keytool -list -keystore ~/keystores/emap-master-upload-key.keystore

   # Reconfigure with correct password
   eas credentials:configure --platform android
   ```

3. **Wrong Alias:**

   ```bash
   # List keystore aliases
   keytool -list -keystore ~/keystores/emap-master-upload-key.keystore

   # Reconfigure with correct alias
   eas credentials:configure --platform android
   ```

#### "Google Play Console upload key mismatch"

**Symptoms:**

- Upload rejected by Play Console
- Key fingerprint doesn't match

**Diagnosis:**

```bash
# Check keystore fingerprint
keytool -list -v -keystore ~/keystores/emap-master-upload-key.keystore -alias cn-upload

# Compare with Play Console
# Go to Play Console > App > Setup > App signing
```

**Solutions:**

1. **Upload Correct Certificate to Play Console:**

   ```bash
   # Extract certificate
   keytool -export -rfc -keystore ~/keystores/emap-master-upload-key.keystore \
     -alias cn-upload -file cn-upload-cert.pem

   # Upload to Play Console > Setup > App signing
   ```

2. **Use Correct Keystore in EAS:**
   ```bash
   # Reconfigure with correct keystore
   eas credentials:configure --platform android
   ```

### EAS CLI Issues

#### "Authentication failed"

**Symptoms:**

- Cannot access credentials
- Login errors

**Solutions:**

```bash
# Re-login to Expo
eas logout
eas login

# Clear credentials cache
rm -rf ~/.expo/credentials-cache

# Verify account
eas account:view
```

#### "Project not found"

**Symptoms:**

- EAS cannot find your project
- Credential commands fail

**Solutions:**

```bash
# Verify project configuration
cat app.json | jq '.expo.extra.eas.projectId'

# Re-link project if needed
eas init --id YOUR_PROJECT_ID
```

#### "Network/API errors"

**Symptoms:**

- Timeout errors
- API connection failures

**Solutions:**

```bash
# Check network connectivity
ping expo.dev

# Try with verbose logging
eas credentials:list --verbose

# Check EAS status
curl -s https://status.expo.dev/api/v2/status.json | jq '.status.description'
```

## 🔒 Best Practices

### Security Best Practices

1. **Credential Access Control**

   ```bash
   # Use Expo Organizations for team access
   # Limit credential access to necessary team members
   # Regularly audit team member access
   ```

2. **Local Keystore Security**

   ```bash
   # Set restrictive permissions
   chmod 600 ~/keystores/*.keystore

   # Store in encrypted location
   # Use strong, unique passwords
   # Regular backups to secure locations
   ```

3. **Password Management**
   ```bash
   # Store passwords in secure password manager
   # Never commit passwords to version control
   # Use different passwords for different keystores (if using separate keystores)
   ```

### Operational Best Practices

1. **Regular Credential Audits**

   ```bash
   # Monthly credential verification
   ./verify-credentials.sh

   # Check certificate expiration dates
   eas credentials:list --platform ios --json | jq '.[] | select(.type=="DistributionCertificate") | {name, validUntil}'
   ```

2. **Backup Procedures**

   ```bash
   # Export credentials for backup
   eas credentials:list --json > credentials-backup-$(date +%Y%m%d).json

   # Backup local keystores
   tar -czf keystore-backup-$(date +%Y%m%d).tar.gz ~/keystores/
   ```

3. **Documentation**
   ```bash
   # Keep credential registry updated
   # Document who has access to what
   # Track certificate renewal dates
   ```

### Development Workflow

1. **Brand Switching**

   ```bash
   # Always set brand before credential operations
   export EXPO_PUBLIC_BRAND=cn
   eas credentials:configure --platform ios

   export EXPO_PUBLIC_BRAND=nt
   eas credentials:configure --platform android
   ```

2. **Testing Credentials**

   ```bash
   # Test credentials with build
   EXPO_PUBLIC_BRAND=cn eas build --platform ios --profile production-cn --no-wait

   # Verify build starts successfully
   eas build:list --limit 1
   ```

## 🚨 Emergency Procedures

### Lost Keystore Recovery

**If Android keystore is lost:**

1. **Check Backups:**

   ```bash
   # Look for backup files
   find ~ -name "*keystore*" -type f 2>/dev/null
   find ~ -name "*backup*" -type f 2>/dev/null
   ```

2. **If No Backup Exists:**

   ```bash
   # Unfortunately, you cannot recover a lost keystore
   # You'll need to create a new app in Google Play Console
   # This means losing existing users and reviews
   ```

3. **Prevention:**

   ```bash
   # Immediate backup creation
   cp ~/keystores/emap-master-upload-key.keystore ~/keystores/emap-master-upload-key.keystore.backup

   # Encrypted cloud backup
   tar -czf keystore-emergency-backup.tar.gz ~/keystores/
   gpg -c keystore-emergency-backup.tar.gz
   ```

### Certificate Expiration Emergency

**If iOS certificate expires unexpectedly:**

1. **Immediate Response:**

   ```bash
   # Generate new certificate
   eas credentials:configure --platform ios
   # Select "Generate new Distribution Certificate"

   # Update provisioning profiles
   eas credentials:configure --platform ios
   # Select "Generate new Provisioning Profile"
   ```

2. **Update All Brands:**
   ```bash
   # Update both brands with new certificate
   for brand in cn nt; do
       export EXPO_PUBLIC_BRAND=$brand
       eas credentials:configure --platform ios
   done
   ```

### EAS Service Outage

**If EAS credentials service is down:**

1. **Check Status:**

   ```bash
   # Check EAS status
   curl -s https://status.expo.dev/api/v2/status.json
   ```

2. **Fallback Options:**
   ```bash
   # Use local credentials if available
   # Build with Xcode/Android Studio manually
   # Wait for service restoration
   ```

### Team Member Access Issues

**If team member loses access:**

1. **Verify Organization Membership:**

   ```bash
   # Check organization members
   # Go to https://expo.dev/accounts/[org]/settings/members
   ```

2. **Re-invite if Necessary:**
   ```bash
   # Remove and re-add team member
   # Verify they can access credentials
   ```

## 📞 Support Resources

### EAS Documentation

- [EAS Credentials Documentation](https://docs.expo.dev/app-signing/app-credentials/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

### Community Support

- [Expo Forums](https://forums.expo.dev/)
- [Expo Discord](https://chat.expo.dev/)

### Emergency Contacts

- **EAS Support**: Available through Expo dashboard
- **Team Lead**: [Your team lead contact]
- **DevOps**: [Your DevOps contact]

## ✅ Verification Checklist

### Initial Setup Verification

- [ ] EAS CLI installed and updated
- [ ] Logged into correct Expo account/organization
- [ ] iOS credentials configured for both brands
- [ ] Android credentials configured for both brands
- [ ] Test builds successful for all brand/platform combinations

### Ongoing Maintenance

- [ ] Monthly credential verification
- [ ] Certificate expiration monitoring
- [ ] Team access audit
- [ ] Backup verification
- [ ] Documentation updates

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: Monthly

This master guide ensures comprehensive management of EAS credentials for successful deployment and maintenance of both Construction News and Nursing Times applications.
