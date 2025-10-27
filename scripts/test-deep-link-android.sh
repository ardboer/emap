#!/bin/bash

# Deep Link Testing Script for Android Emulator/Device
# This script opens deep links in Android emulator or connected device

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deep Link Testing for Android${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if a URL was provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <url>${NC}"
    echo -e "${YELLOW}Example: $0 'https://www.nursingtimes.net/community-nursing/article-title-24-10-2025/'${NC}"
    echo -e "${YELLOW}Example: $0 'nt://community-nursing/article-title-24-10-2025/'${NC}\n"
    
    echo -e "${BLUE}Quick test URLs:${NC}"
    echo -e "  ${GREEN}Universal Link:${NC} https://www.nursingtimes.net/community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"
    echo -e "  ${GREEN}Custom Scheme:${NC} nt://community-nursing/lack-of-investment-in-community-services-risks-shift-away-from-hospital-24-10-2025/"
    exit 1
fi

URL="$1"

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ adb not found${NC}"
    echo -e "${YELLOW}Please install Android SDK Platform Tools${NC}"
    echo -e "${YELLOW}Or add it to your PATH${NC}"
    exit 1
fi

# Check for connected devices/emulators
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo -e "${RED}❌ No Android devices or emulators found${NC}"
    echo -e "${YELLOW}Please start an emulator or connect a device${NC}"
    echo -e "${YELLOW}Run: ${GREEN}npm run android${NC} to start the app"
    exit 1
fi

# Get device info
DEVICE_INFO=$(adb devices | grep "device$" | head -1 | awk '{print $1}')
echo -e "${GREEN}✓ Found Android device/emulator:${NC} $DEVICE_INFO\n"

# Determine link type
if [[ "$URL" == http* ]]; then
    LINK_TYPE="Universal Link (HTTPS)"
elif [[ "$URL" == *://* ]]; then
    LINK_TYPE="Custom Scheme"
else
    echo -e "${RED}❌ Invalid URL format${NC}"
    echo -e "${YELLOW}URL must start with 'https://' or use a custom scheme like 'nt://'${NC}"
    exit 1
fi

echo -e "${BLUE}Testing ${LINK_TYPE}:${NC}"
echo -e "  ${YELLOW}$URL${NC}\n"

# Extract slug for reference
if [[ "$URL" == http* ]]; then
    SLUG=$(echo "$URL" | sed -E 's|https?://[^/]+/(.+)/?|\1|')
else
    SLUG=$(echo "$URL" | sed -E 's|[^:]+://(.+)/?|\1|')
fi

echo -e "${BLUE}Extracted slug:${NC} ${GREEN}$SLUG${NC}\n"

# Open the URL using adb
echo -e "${BLUE}Opening URL in Android...${NC}"

# Get the package name from app.json
PACKAGE_NAME=$(grep -A 1 '"android"' app.json | grep '"package"' | sed 's/.*"package": "\([^"]*\)".*/\1/')

if [ -z "$PACKAGE_NAME" ]; then
    echo -e "${YELLOW}⚠️  Could not detect package name, trying without it...${NC}"
    # Use am start with VIEW action to open the URL
    OUTPUT=$(adb shell am start -a android.intent.action.VIEW -d "$URL" 2>&1)
else
    echo -e "${BLUE}Using package:${NC} ${GREEN}$PACKAGE_NAME${NC}"
    # Use am start with VIEW action and package name to open the URL
    OUTPUT=$(adb shell am start -a android.intent.action.VIEW -d "$URL" -n "$PACKAGE_NAME/.MainActivity" 2>&1)
fi

echo -e "${YELLOW}ADB Output:${NC}"
echo "$OUTPUT"

if echo "$OUTPUT" | grep -q "Error\|error\|not found"; then
    echo -e "${RED}❌ Failed to open URL in Android${NC}"
    echo -e "${YELLOW}Trying alternative method without package name...${NC}"
    OUTPUT=$(adb shell am start -a android.intent.action.VIEW -d "$URL" 2>&1)
    echo "$OUTPUT"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully sent deep link to Android${NC}\n"
    
    echo -e "${BLUE}What to check:${NC}"
    echo -e "  1. ${GREEN}App should open${NC} (if not already open)"
    echo -e "  2. ${GREEN}Article should load${NC} with the correct content"
    echo -e "  3. ${GREEN}Check logcat${NC} for deep link handling messages\n"
    
    echo -e "${YELLOW}View logs:${NC}"
    echo -e "  ${GREEN}adb logcat | grep -E '(🔗|Deep link|article)'${NC}\n"
    
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "  • If app doesn't open: Check app is installed"
    echo -e "  • If browser opens: App Links not configured (expected in dev)"
    echo -e "  • If nothing happens: Check URL scheme is registered"
    echo -e "  • Check Metro bundler logs for errors\n"
else
    echo -e "${RED}❌ Failed to open URL in Android${NC}"
    echo -e "${YELLOW}Make sure the app is installed and running${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"