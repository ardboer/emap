# Push Notifications Guide

This guide explains how to use the push notification system in the app, including sending test notifications and managing push tokens.

## Table of Contents

1. [Overview](#overview)
2. [Getting Push Tokens](#getting-push-tokens)
3. [Sending Push Notifications](#sending-push-notifications)
4. [Token Management](#token-management)
5. [Troubleshooting](#troubleshooting)

## Overview

The app uses Expo's Push Notification service to send notifications to users. Push tokens are obtained during the onboarding flow when users grant notification permissions.

### Key Components

- **NotificationPermissionScreen**: Requests permission and obtains push tokens during onboarding
- **SettingsContent**: Displays the user's push token with copy-to-clipboard functionality
- **send-push-notification.js**: Script to send test notifications

## Getting Push Tokens

### From the App

1. Complete the onboarding flow and grant notification permissions
2. Open Settings in the app
3. Scroll to the "Debug" section at the bottom
4. Tap on the "Push Token" item to copy it to clipboard
5. The token will look like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

### Storage Location

Push tokens are stored in AsyncStorage with the key `expoPushToken`.

## Sending Push Notifications

### Method 1: Interactive Mode (Recommended for Testing)

Run the script without arguments to enter interactive mode:

```bash
node scripts/send-push-notification.js
```

You'll be prompted to:

1. Choose between sending to a specific token or all tokens
2. Enter the notification title
3. Enter the notification body
4. Choose a sound (default/none)

### Method 2: Command Line Arguments

#### Send to a Specific Token

```bash
node scripts/send-push-notification.js \
  --token "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" \
  --title "Breaking News" \
  --body "Check out the latest article"
```

#### Send to All Tokens

First, create a `push-tokens.json` file in the project root:

```json
{
  "tokens": [
    "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]"
  ],
  "brands": {
    "nt": [
      "ExponentPushToken[nt-user-1-token]",
      "ExponentPushToken[nt-user-2-token]"
    ],
    "cn": [
      "ExponentPushToken[cn-user-1-token]",
      "ExponentPushToken[cn-user-2-token]"
    ]
  }
}
```

Then run:

```bash
node scripts/send-push-notification.js \
  --all \
  --title "App Update" \
  --body "New features available!"
```

#### Send to Specific Brand

Send to all users of a specific brand (e.g., Nursing Times):

```bash
node scripts/send-push-notification.js \
  --brand "nt" \
  --title "Nursing Times Update" \
  --body "New article published"
```

Or for Construction News:

```bash
node scripts/send-push-notification.js \
  --brand "cn" \
  --title "Construction News Alert" \
  --body "Breaking industry news"
```

### Advanced Options

```bash
node scripts/send-push-notification.js \
  --token "ExponentPushToken[...]" \
  --title "Custom Notification" \
  --body "With custom options" \
  --sound "default" \
  --badge 5 \
  --priority "high" \
  --data '{"articleId": "123", "type": "news"}'
```

#### Available Options

- `--token, -t`: Specific Expo push token
- `--all, -a`: Send to all tokens in push-tokens.json
- `--brand, -B`: Send to all tokens for a specific brand (nt, cn)
- `--title`: Notification title (required)
- `--body, -b`: Notification body (required)
- `--data, -d`: Custom data as JSON string
- `--sound, -s`: Sound to play (default: 'default', use 'none' for silent)
- `--badge`: Badge count number
- `--priority, -p`: Priority level (default, normal, high)
- `--channel, -c`: Android notification channel ID
- `--help, -h`: Show help message

### Examples

#### Simple Notification

```bash
node scripts/send-push-notification.js \
  -t "ExponentPushToken[...]" \
  --title "Hello" \
  --body "Test message"
```

#### Silent Notification with Data

```bash
node scripts/send-push-notification.js \
  -t "ExponentPushToken[...]" \
  --title "Background Update" \
  --body "New content available" \
  --sound "none" \
  --data '{"refresh": true, "contentType": "articles"}'
```

#### High Priority Notification

```bash
node scripts/send-push-notification.js \
  -t "ExponentPushToken[...]" \
  --title "URGENT" \
  --body "Breaking news alert" \
  --priority "high" \
  --badge 1
```

#### Brand-Specific Notification

```bash
node scripts/send-push-notification.js \
  --brand "nt" \
  --title "Nursing Times Exclusive" \
  --body "New CPD module available" \
  --data '{"type": "cpd", "moduleId": "123"}'
```

## Token Management

### push-tokens.json File

The script uses a `push-tokens.json` file to store multiple tokens for batch sending.

**Location**: Project root directory

**Format**:

```json
{
  "tokens": [
    "ExponentPushToken[token1]",
    "ExponentPushToken[token2]",
    "ExponentPushToken[token3]"
  ]
}
```

**Note**: This file is gitignored to prevent committing sensitive tokens. Use `push-tokens.json.example` as a template.

### Adding Tokens

You can manually add tokens to the `push-tokens.json` file, or copy them from the app's settings screen.

**To add a token to a specific brand:**

1. Copy the token from the app settings
2. Open `push-tokens.json`
3. Add it to the appropriate brand array under `brands.nt` or `brands.cn`
4. Save the file

**Example workflow:**

1. User installs Nursing Times app
2. Completes onboarding and grants notification permission
3. Opens Settings → Debug → Copies push token
4. You add the token to `brands.nt` array in push-tokens.json
5. Now you can send brand-specific notifications to all NT users

## Troubleshooting

### Common Issues

#### "Invalid token format"

**Problem**: The token doesn't start with `ExponentPushToken[`

**Solution**: Make sure you're copying the complete token from the app settings. It should look like:

```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

#### "No tokens found in push-tokens.json"

**Problem**: The file doesn't exist or is empty

**Solution**:

1. Copy `push-tokens.json.example` to `push-tokens.json`
2. Add your tokens to the array
3. Make sure the JSON is valid

#### "DeviceNotRegistered" Error

**Problem**: The token is no longer valid (app was uninstalled or token expired)

**Solution**:

1. Reinstall the app
2. Complete onboarding again
3. Get the new token from settings
4. Update your push-tokens.json file

#### Notification Not Received

**Possible causes**:

1. **Permissions denied**: Check app notification settings on the device
2. **App in background**: Some notifications may not show if the app is in foreground
3. **Invalid token**: Token may have expired or been invalidated
4. **Network issues**: Check internet connection
5. **Expo service issues**: Check Expo status page

**Solutions**:

1. Verify notification permissions in device settings
2. Test with app in background/closed
3. Get a fresh token from the app
4. Check network connectivity
5. Try again later if Expo services are down

### Testing Tips

1. **Test with app closed**: Notifications behave differently when app is closed vs. open
2. **Test on real device**: Simulators/emulators may not support push notifications
3. **Check device settings**: Ensure notifications are enabled for the app
4. **Use interactive mode**: Easier for quick testing
5. **Check response**: The script shows detailed response from Expo API

### Response Codes

The script will show the response from Expo's API:

- **`status: "ok"`**: Notification sent successfully
- **`status: "error"`**: Failed to send, check the error message
- **`DeviceNotRegistered`**: Token is invalid or expired
- **`MessageTooBig`**: Notification payload exceeds size limit
- **`MessageRateExceeded`**: Too many notifications sent too quickly

## Best Practices

1. **Don't commit tokens**: The push-tokens.json file is gitignored for security
2. **Test before production**: Always test notifications in development first
3. **Use meaningful titles**: Clear, concise notification titles
4. **Include data**: Add custom data for deep linking or app actions
5. **Respect rate limits**: Don't send too many notifications too quickly
6. **Handle errors**: Check the response and handle failed sends
7. **Keep tokens updated**: Remove invalid tokens from your list
8. **Organize by brand**: Keep brand-specific tokens in their respective arrays
9. **Brand-appropriate content**: Ensure notification content matches the brand
10. **Test per brand**: Test notifications for each brand separately

## Integration with Backend

For production use, you should:

1. Store push tokens in your backend database
2. Associate tokens with user accounts **and brands**
3. Implement a proper notification service
4. Handle token updates and invalidation
5. Implement notification preferences **per brand**
6. Track delivery and engagement metrics **by brand**
7. Support brand-specific notification templates
8. Implement brand-specific notification schedules

This script is primarily for development and testing purposes.

## Multi-Brand Considerations

When working with multiple brands (NT and CN):

1. **Separate Token Storage**: Keep tokens organized by brand
2. **Brand Context**: Always include brand context in notification data
3. **Brand-Specific Content**: Tailor notification content to each brand
4. **Testing**: Test notifications for each brand separately
5. **Analytics**: Track engagement metrics per brand
6. **User Preferences**: Allow users to manage preferences per brand if they use multiple apps

## Additional Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Push Notification Best Practices](https://docs.expo.dev/push-notifications/sending-notifications/)
