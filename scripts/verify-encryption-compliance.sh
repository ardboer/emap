#!/bin/bash

# Encryption Compliance Verification Script
# This script verifies that the encryption compliance configuration is properly set

echo "🔍 Verifying App Store Encryption Compliance Configuration..."
echo "================================================================"

# Check if Info.plist contains the encryption key
echo "1. Checking iOS Info.plist configuration..."
if grep -q "ITSAppUsesNonExemptEncryption" ios/ConstructionNews/Info.plist; then
    if grep -A1 "ITSAppUsesNonExemptEncryption" ios/ConstructionNews/Info.plist | grep -q "<false/>"; then
        echo "   ✅ ITSAppUsesNonExemptEncryption is set to false in Info.plist"
    else
        echo "   ❌ ITSAppUsesNonExemptEncryption found but not set to false"
        exit 1
    fi
else
    echo "   ❌ ITSAppUsesNonExemptEncryption key not found in Info.plist"
    exit 1
fi

# Check if app.json contains the encryption configuration
echo "2. Checking Expo app.json configuration..."
if grep -q "usesNonExemptEncryption" app.json; then
    if grep -A1 "usesNonExemptEncryption" app.json | grep -q "false"; then
        echo "   ✅ usesNonExemptEncryption is set to false in app.json"
    else
        echo "   ❌ usesNonExemptEncryption found but not set to false"
        exit 1
    fi
else
    echo "   ❌ usesNonExemptEncryption key not found in app.json"
    exit 1
fi

# Check if EAS CLI is available for building
echo "3. Checking build environment..."
if command -v eas &> /dev/null; then
    echo "   ✅ EAS CLI is available"
    echo "   📋 You can now run: eas build --platform ios --profile preview"
else
    echo "   ⚠️  EAS CLI not found. Install with: npm install -g @expo/eas-cli"
fi

echo ""
echo "🎉 Encryption compliance configuration verified successfully!"
echo ""
echo "Next steps:"
echo "1. Run a test build: eas build --platform ios --profile preview"
echo "2. Check build logs for any encryption-related warnings"
echo "3. Test App Store Connect submission (no encryption prompts should appear)"
echo ""
echo "📚 Documentation available at:"
echo "   - docs/app-store-encryption-compliance-guide.md"
echo "   - docs/encryption-compliance-implementation-plan.md"
echo "   - docs/encryption-compliance-summary.md"