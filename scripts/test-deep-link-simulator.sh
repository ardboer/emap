#!/bin/bash

# Deep Link Testing Script for iOS Simulator
# This script opens deep links in the iOS Simulator to test Universal Links and custom schemes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deep Link Testing for iOS Simulator${NC}"
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

# Get the booted simulator
BOOTED_DEVICE=$(xcrun simctl list devices | grep "(Booted)" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

if [ -z "$BOOTED_DEVICE" ]; then
    echo -e "${RED}❌ No booted simulator found${NC}"
    echo -e "${YELLOW}Please start the iOS Simulator first:${NC}"
    echo -e "   1. Run: ${GREEN}npm run ios${NC}"
    echo -e "   2. Or open Simulator.app and boot a device"
    exit 1
fi

# Get device name
DEVICE_NAME=$(xcrun simctl list devices | grep "$BOOTED_DEVICE" | sed -E 's/^[[:space:]]*([^(]+).*/\1/' | xargs)

echo -e "${GREEN}✓ Found booted simulator:${NC} $DEVICE_NAME"
echo -e "${GREEN}✓ Device ID:${NC} $BOOTED_DEVICE\n"

# Determine link type
if [[ "$URL" == http* ]]; then
    LINK_TYPE="Universal Link"
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

# Open the URL in the simulator
echo -e "${BLUE}Opening URL in simulator...${NC}"
xcrun simctl openurl "$BOOTED_DEVICE" "$URL"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully sent deep link to simulator${NC}\n"
    
    echo -e "${BLUE}What to check:${NC}"
    echo -e "  1. ${GREEN}App should open${NC} (if not already open)"
    echo -e "  2. ${GREEN}Article should load${NC} with the correct content"
    echo -e "  3. ${GREEN}Check console logs${NC} for deep link handling messages\n"
    
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "  • If Safari opens instead: Universal Links not configured properly"
    echo -e "  • If nothing happens: Check app is installed in simulator"
    echo -e "  • If app opens but no article: Check deep link handling code"
    echo -e "  • Check Metro bundler logs for errors\n"
else
    echo -e "${RED}❌ Failed to open URL in simulator${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"