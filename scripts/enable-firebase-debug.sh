#!/bin/bash

# Enable Firebase Analytics Debug Mode for iOS Simulator
# This script enables debug mode for the currently running simulator

echo "🔍 Enabling Firebase Analytics Debug Mode..."

# Get the booted simulator UDID
SIMULATOR_UDID=$(xcrun simctl list devices | grep "Booted" | grep -oE "\([A-F0-9-]+\)" | tr -d "()")

if [ -z "$SIMULATOR_UDID" ]; then
    echo "❌ No booted simulator found. Please start the simulator first."
    exit 1
fi

echo "✅ Found booted simulator: $SIMULATOR_UDID"

# Enable debug mode
echo "🔧 Enabling debug logging..."
xcrun simctl spawn booted log config --mode "level:debug" --subsystem com.google.firebase.analytics

# Set debug flag for the app
echo "🔧 Setting debug flag..."
xcrun simctl spawn booted defaults write -app metropolis.net.nursingtimes FIRDebugEnabled -bool YES

echo ""
echo "✅ Firebase Analytics Debug Mode enabled!"
echo ""
echo "📱 Now run your app with: npx expo run:ios"
echo ""
echo "📊 View events in Firebase Console:"
echo "   https://console.firebase.google.com → Analytics → DebugView"
echo ""
echo "📋 View logs in terminal:"
echo "   xcrun simctl spawn booted log stream --level debug --predicate 'subsystem == \"com.google.firebase.analytics\"'"
echo ""