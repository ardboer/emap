# Push Notification Credentials Verification Guide

## Overview

The web admin interface now includes a feature to verify whether push notification credentials have been properly configured for each brand using EAS (Expo Application Services).

## How It Works

### Backend Implementation

1. **Push Credentials Checker** (`server/utils/pushCredentialsChecker.js`)

   - Runs `npx eas-cli credentials -p ios --app-id <bundleId>` to check credentials
   - Parses the output to determine if push keys are configured
   - Stores the result directly in the brand's `config.json` file
   - Result includes:
     - `configured`: boolean indicating if push credentials exist
     - `details`: human-readable status message
     - `lastChecked`: ISO timestamp of when the check was performed

2. **API Endpoints** (`server/routes/system.js`)
   - `GET /api/system/push-credentials/:shortcode` - Get stored push status
   - `POST /api/system/push-credentials/:shortcode/check` - Run credential check

### Frontend Implementation

1. **Brand List Component** (`web-admin/src/components/BrandList.jsx`)
   - Displays push credential status badge on each brand card
   - Shows green "✓ Push Configured" or red "✗ Push Not Configured"
   - Includes "Check Push" button to verify credentials on-demand
   - Automatically loads stored status on component mount

## Usage

### Checking Push Credentials

1. Navigate to the Brand Management Dashboard
2. Find the brand you want to check
3. Click the green "Check Push" button on the brand card
4. The system will:
   - Run the EAS CLI command to check credentials
   - Update the brand's config.json with the result
   - Display a success or warning toast notification
   - Update the status badge on the card

### Status Indicators

- **✓ Push Configured** (Green) - Push credentials are properly set up
- **✗ Push Not Configured** (Red) - No push credentials found
- **Push Status Unknown** (Gray) - Not checked yet

### Stored Data

The push credentials status is stored in each brand's `config.json`:

```json
{
  "shortcode": "cn",
  "name": "Community Nursing",
  "bundleId": "com.emap.cn",
  "pushCredentials": {
    "configured": true,
    "details": "Push credentials found",
    "lastChecked": "2025-01-19T18:30:00.000Z"
  }
}
```

## Requirements

### Prerequisites

1. **EAS CLI** must be installed and accessible:

   ```bash
   npm install -g eas-cli
   ```

2. **EAS Authentication** - You must be logged in:

   ```bash
   eas login
   ```

3. **Bundle ID** - Each brand must have a valid `bundleId` configured

### Setting Up Push Credentials

If push credentials are not configured, set them up using:

```bash
npx eas credentials -p ios
```

Note: All EAS commands use `npx eas` - no global installation required.

Follow the prompts to:

1. Select your app (by bundle ID)
2. Choose "Push Notifications"
3. Upload or generate push key

## Troubleshooting

### "Push Not Configured" Despite Setup

1. Verify you're logged into EAS CLI:

   ```bash
   eas whoami
   ```

2. Check the bundle ID matches exactly:

   ```bash
   eas credentials -p ios --app-id <your-bundle-id>
   ```

3. Ensure push key is uploaded to EAS:
   - Log into https://expo.dev
   - Navigate to your project
   - Check Credentials section

### Check Button Not Working

1. Check server logs for errors
2. Ensure the server has network access to Expo servers
3. Check that the bundle ID is correctly configured in the brand config
4. Verify you're logged into EAS: `npx eas whoami`

### Timeout Errors

The credential check has a 30-second timeout. If it times out:

- Check your internet connection
- Verify EAS services are operational
- Try running the command manually to diagnose

## Manual Verification

You can manually verify push credentials using:

```bash
# Check specific brand
npx eas credentials -p ios --app-id com.emap.cn

# Interactive mode
npx eas credentials
```

## API Reference

### Get Push Credentials Status

```http
GET /api/system/push-credentials/:shortcode
```

**Response:**

```json
{
  "success": true,
  "credentials": {
    "configured": true,
    "details": "Push credentials found",
    "lastChecked": "2025-01-19T18:30:00.000Z"
  }
}
```

### Check Push Credentials

```http
POST /api/system/push-credentials/:shortcode/check
```

**Response:**

```json
{
  "success": true,
  "message": "Push credentials checked for cn",
  "credentials": {
    "configured": true,
    "details": "Push credentials found",
    "lastChecked": "2025-01-19T18:30:00.000Z"
  }
}
```

## Best Practices

1. **Check After Setup** - Always verify credentials after setting them up with `eas credentials`
2. **Regular Verification** - Check credentials periodically, especially before deployments
3. **Document Status** - Keep track of which brands have push configured
4. **Test Notifications** - After verification, test actual push notifications to ensure they work

## Security Notes

- Push credential checks require EAS authentication
- The server must have valid EAS credentials
- Credential data is stored locally in config.json
- No sensitive credential data is exposed through the API
- Only status information is stored and displayed
