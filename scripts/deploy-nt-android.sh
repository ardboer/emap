#!/bin/bash

# Deploy Nursing Times to Google Play Store
# Usage: ./scripts/deploy-nt-android.sh [internal|alpha|beta|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default track
TRACK=${1:-beta}

echo -e "${BLUE}🚀 Starting Nursing Times Android deployment to ${TRACK} track...${NC}"

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
export BRAND=nt

# Load environment variables
if [ -f "fastlane/.env.fastlane" ]; then
    export $(grep -v '^#' fastlane/.env.fastlane | xargs)
fi

echo -e "${BLUE}🤖 Brand: Nursing Times${NC}"
echo -e "${BLUE}🎯 Track: ${TRACK}${NC}"
echo -e "${BLUE}📦 Package: metropolis.net.nursingtimes${NC}"

# Validate environment
echo -e "${YELLOW}🔍 Validating environment...${NC}"
fastlane validate_env

# Run the appropriate Fastlane lane
case $TRACK in
    internal)
        echo -e "${YELLOW}🚀 Deploying to Google Play Store (Internal track)...${NC}"
        fastlane android upload_nt_internal
        ;;
    alpha)
        echo -e "${YELLOW}🚀 Deploying to Google Play Store (Alpha track)...${NC}"
        fastlane android upload_nt_alpha
        ;;
    beta)
        echo -e "${YELLOW}🚀 Deploying to Google Play Store (Beta track)...${NC}"
        fastlane android upload_nt_beta
        ;;
    production)
        echo -e "${YELLOW}🚀 Deploying to Google Play Store (Production track)...${NC}"
        echo -e "${RED}⚠️  WARNING: This will deploy to PRODUCTION! Are you sure? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo -e "${YELLOW}Deployment cancelled.${NC}"
            exit 0
        fi
        fastlane android upload_nt_production
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid track '${TRACK}'. Use 'internal', 'alpha', 'beta', or 'production'.${NC}"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nursing Times Android deployment to ${TRACK} track completed successfully!${NC}"
    
    # Send notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ Nursing Times Android deployed to ${TRACK} track successfully!\"}" \
            $SLACK_WEBHOOK_URL
    fi
else
    echo -e "${RED}❌ Nursing Times Android deployment to ${TRACK} track failed!${NC}"
    
    # Send failure notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ Nursing Times Android deployment to ${TRACK} track failed!\"}" \
            $SLACK_WEBHOOK_URL
    fi
    
    exit 1
fi