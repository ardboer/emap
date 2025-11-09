# Standard Firebase Analytics Events

This document lists all standard Firebase Analytics events used in the application. These are predefined events provided by Firebase Analytics with standardized naming and parameters.

## Automatically Collected Events

Firebase Analytics automatically collects certain events without explicit implementation:

### first_open

Triggered when a user opens the app for the first time after installing

### session_start

Automatically logged when a user engages with the app (Firebase reserved event)

### session_end

Automatically logged when a user's session ends (Firebase reserved event)

### user_engagement

Logged when the app is in the foreground

### app_update

Logged when the app is updated to a new version

### app_remove

Logged when the app is uninstalled (Android only)

### app_clear_data

Logged when the app data is cleared (Android only)

### os_update

Logged when the device OS is updated

### firebase_campaign

Logged when the app is opened from a Firebase campaign link

## Explicitly Implemented Standard Events

These standard Firebase events are explicitly logged in the application code:

### screen_view

Logged when a user views a screen with screen name and class parameters

### search

Logged when a user performs a search with search term parameter

## User Properties

The application sets the following user properties (not events, but tracked alongside events):

### brand

Current brand/publication the user is viewing

### brand_name

Full name of the current brand

### bundle_id

Application bundle identifier for the current brand

### features_enabled

Comma-separated list of enabled features for the current brand

## Notes

- Standard Firebase events follow Google's recommended event naming conventions
- These events have predefined parameters that are optimized for Firebase reporting
- Automatic events are collected by the Firebase SDK without explicit code implementation
- User properties persist across sessions and are included with all events
- The `session_start` and `session_end` events are reserved by Firebase, which is why the app uses `app_session_start` and `app_session_end` as custom alternatives
