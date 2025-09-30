#!/bin/bash

# Deploy Construction News to iOS TestFlight
# Usage: ./scripts/deploy-cn-ios.sh [testflight|appstore]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default target
TARGET=${1:-testflight}

echo -e "${BLUE}🚀 Starting Construction News iOS deployment to ${TARGET}...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if Fastlane is installed
if ! command -v fastlane &> /dev/null; then
    echo -e "${RED}❌ Error: Fastlane is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if .env.fastlane exists
if [ ! -f "fastlane/.env.fastlane" ]; then
    echo -e "${YELLOW}⚠️  Warning: fastlane/.env.fastlane not found.${NC}"
    echo -e "${YELLOW}   Please copy fastlane/.env.template to fastlane/.env.fastlane and configure it.${NC}"
    exit 1
fi

# Set brand environment variable
export BRAND=cn

# Load environment variables
if [ -f "fastlane/.env.fastlane" ]; then
    export $(grep -v '^#' fastlane/.env.fastlane | xargs)
fi

echo -e "${BLUE}📱 Brand: Construction News${NC}"
echo -e "${BLUE}🎯 Target: ${TARGET}${NC}"
echo -e "${BLUE}📦 Bundle ID: metropolis.co.uk.constructionnews${NC}"

# Validate environment
echo -e "${YELLOW}🔍 Validating environment...${NC}"
fastlane validate_env

# Run the appropriate Fastlane lane
case $TARGET in
    testflight)
        echo -e "${YELLOW}🚀 Deploying to TestFlight...${NC}"
        fastlane ios upload_cn_testflight
        ;;
    appstore)
        echo -e "${YELLOW}🚀 Deploying to App Store...${NC}"
        fastlane ios upload_cn_appstore
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid target '${TARGET}'. Use 'testflight' or 'appstore'.${NC}"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Construction News iOS deployment to ${TARGET} completed successfully!${NC}"
    
    # Send notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ Construction News iOS deployed to ${TARGET} successfully!\"}" \
            $SLACK_WEBHOOK_URL
    fi
else
    echo -e "${RED}❌ Construction News iOS deployment to ${TARGET} failed!${NC}"
    
    # Send failure notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ Construction News iOS deployment to ${TARGET} failed!\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    exit 1
fi