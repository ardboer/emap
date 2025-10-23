# Notification System Setup Guide

This guide explains how to set up and use the EMAP notification system for sending push notifications to Firebase Cloud Messaging (FCM) topics.

## Overview

The notification system allows you to send push notifications to users subscribed to brand-specific topics. It includes:

- Backend API for fetching articles and sending notifications
- Web interface for easy notification management
- Firebase Admin SDK integration with shared service account
- HTTP Basic Authentication for security
- Brand-agnostic design that automatically discovers available brands

## Prerequisites

- Node.js and npm installed
- Firebase project set up for each brand
- Access to Firebase Console to download service account keys

## Step 1: Install Dependencies

Dependencies are already installed if you ran `npm install` in the server directory. If not:

```bash
cd server
npm install
```

This installs:

- `firebase-admin` - Firebase Admin SDK for sending notifications
- `axios` - HTTP client for WordPress API requests

## Step 2: Get Firebase Service Account Key

You need to download a single service account key from Firebase Console that works for all brands:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) → Project settings
4. Go to the "Service accounts" tab
5. Click "Generate new private key"
6. Save the downloaded JSON file

**Important:** Keep these files secure and never commit them to version control!

## Step 3: Place Service Account Key

Place the downloaded service account JSON file in the Firebase config directory:

```
server/config/firebase/
└── service-account.json
```

The system will automatically detect the service account file. Supported filenames:

- `service-account.json` (recommended)
- `firebase-service-account.json`
- `emap-service-account.json`
- Any `.json` file in the directory

**Note:** Only one service account file is needed for all brands, as they share the same Firebase project.

## Step 4: Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your credentials:
   ```env
   # Notification Authentication
   NOTIFICATION_USERNAME=your_username
   NOTIFICATION_PASSWORD=your_secure_password
   ```

**Security Note:** Change the default credentials (`admin`/`changeme`) before deploying to production!

## Step 5: Start the Server

```bash
cd server
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Step 6: Access the Web Interface

1. Open your browser and go to: `http://localhost:3001`
2. Enter your credentials (from `.env` file)
3. You should see the notification manager interface

## Using the Web Interface

### Selecting a Brand

Use the brand dropdown to switch between:

- **CN** - Construction News
- **NT** - Nursing Times
- **JNL** - JNL

### Searching Articles

1. Enter a search term in the search box
2. Click "Search" or press Enter
3. Click "Clear" to reset and show recent articles

### Sending Notifications

1. Browse or search for an article
2. Click "📤 Send Notification" on the article card
3. Review the notification details in the confirmation modal
4. Click "Send Notification" to confirm

The notification will be sent to all users subscribed to that brand's topic.

## API Endpoints

All endpoints require HTTP Basic Authentication.

### Get Articles

```
GET /api/notifications/articles?brand=cn&limit=10&search=keyword
```

### Send Notification

```
POST /api/notifications/send
Content-Type: application/json

{
  "brand": "cn",
  "title": "Article Title",
  "body": "Article excerpt or custom message",
  "articleId": "12345"
}
```

### Test Firebase Connection

```
GET /api/notifications/test?brand=cn
```

### Check Configuration Status

```
GET /api/notifications/status
```

## Testing with cURL

### Test Authentication

```bash
curl -u admin:changeme http://localhost:3001/api/notifications/status
```

### Test Firebase Connection

```bash
curl -u admin:changeme "http://localhost:3001/api/notifications/test?brand=cn"
```

### Fetch Articles

```bash
curl -u admin:changeme "http://localhost:3001/api/notifications/articles?brand=cn&limit=5"
```

### Send Notification

```bash
curl -u admin:changeme \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "cn",
    "title": "Breaking News",
    "body": "Check out our latest article",
    "articleId": "12345"
  }' \
  http://localhost:3001/api/notifications/send
```

## Notification Data Format

Notifications sent to FCM include:

```json
{
  "notification": {
    "title": "Article Title",
    "body": "Article excerpt"
  },
  "data": {
    "type": "article",
    "articleId": "12345",
    "timestamp": "2025-01-23T08:00:00.000Z"
  },
  "topic": "cn"
}
```

**Important:** The `type: 'article'` and `articleId` (as string) are required for the app to handle article notifications correctly.

## Troubleshooting

### "Firebase not configured" Error

**Problem:** Service account key file not found for the brand.

**Solution:**

1. Verify the service account JSON file exists in `server/config/firebase/`
2. Check the filename matches exactly: `{brand}-service-account.json`
3. Restart the server after adding the file

### "Authentication failed" Error

**Problem:** Incorrect username or password.

**Solution:**

1. Check your `.env` file has the correct credentials
2. Verify you're using the same credentials in the web interface
3. Restart the server after changing `.env`

### "Failed to fetch articles" Error

**Problem:** WordPress API is unreachable or brand configuration is incorrect.

**Solution:**

1. Check the brand's `config.json` has correct `apiConfig.baseUrl`
2. Verify the WordPress site is accessible
3. Check network connectivity

### Firebase Connection Test Fails

**Problem:** Service account key is invalid or Firebase project is misconfigured.

**Solution:**

1. Re-download the service account key from Firebase Console
2. Verify the key is for the correct Firebase project
3. Check Firebase project has Cloud Messaging enabled

## Security Best Practices

1. **Change Default Credentials:** Never use `admin`/`changeme` in production
2. **Use HTTPS:** Deploy behind a reverse proxy with SSL/TLS
3. **Restrict Access:** Use firewall rules to limit access to the server
4. **Rotate Keys:** Periodically rotate Firebase service account keys
5. **Monitor Usage:** Keep logs of notification sends for audit purposes

## File Structure

```
server/
├── config/
│   └── firebase/
│       └── service-account.json     (not in git)
├── middleware/
│   └── auth.js                      (HTTP Basic Auth)
├── routes/
│   └── notifications.js             (API endpoints)
├── utils/
│   ├── firebaseAdmin.js             (Firebase SDK wrapper)
│   ├── wordpressApi.js              (WordPress API client)
│   └── notificationService.js       (Notification logic)
├── public/
│   ├── index.html                   (Web interface)
│   ├── styles.css                   (Styling)
│   └── app.js                       (Frontend logic)
├── .env                             (not in git)
├── .env.example                     (template)
└── NOTIFICATION_SETUP.md            (this file)
```

## Support

For issues or questions:

1. Check the server logs for error messages
2. Verify all configuration files are correct
3. Test individual components (Firebase, WordPress API) separately
4. Review the troubleshooting section above

## Next Steps

After setup is complete:

1. Test sending notifications to each brand
2. Verify notifications appear on test devices
3. Set up monitoring for notification delivery
4. Document any brand-specific notification guidelines
