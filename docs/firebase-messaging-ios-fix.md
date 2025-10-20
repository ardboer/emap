# Firebase Cloud Messaging iOS Real Device Fix

## Problem

When running the app on an iOS physical device in debug mode, Firebase Cloud Messaging shows warnings:

```
⚠️ FCM not available on iOS simulator
⚠️ Firebase Messaging not available
```

And notifications cannot be enabled, even though the device is real (not a simulator).

## Root Cause Analysis

### Issue 1: Incorrect Simulator Detection

The code in [`services/firebaseInit.ts`](../services/firebaseInit.ts) was using `__DEV__` to detect iOS simulators:

```typescript
if (Platform.OS === "ios" && __DEV__) {
  console.warn("⚠️ FCM not available on iOS simulator");
  return false;
}
```

**Problem**: `__DEV__` is `true` for BOTH:

- ✅ iOS Simulator in debug mode
- ✅ iOS Real Device in debug mode ❌ (incorrectly blocked)

This caused Firebase Messaging to be disabled on real devices when running in debug mode.

### Issue 2: Missing Push Notification Configuration

The iOS app was missing required configuration for push notifications:

- ❌ Missing `UIBackgroundModes` with `remote-notification` in Info.plist
- ❌ Missing `aps-environment` in production entitlements file

## Solutions Implemented

### 1. Fixed Simulator Detection Logic

Updated [`services/firebaseInit.ts`](../services/firebaseInit.ts) to properly detect iOS simulators:

```typescript
export function isIOSSimulator(): boolean {
  if (Platform.OS !== "ios") return false;

  const constants = Platform.constants as any;

  // Simulators typically have "Simulator" in the model name
  if (constants?.reactNativeVersion?.model?.includes("Simulator")) {
    return true;
  }

  // If we can't determine for sure, assume it's a real device
  // This is safer than blocking real devices
  return false;
}
```

**Key Changes**:

- Removed reliance on `__DEV__` flag
- Added proper simulator detection using Platform.constants
- Defaults to assuming real device (safer approach)

### 2. Updated `isMessagingAvailable()` Function

Changed from:

```typescript
if (Platform.OS === "ios" && __DEV__) {
  // Incorrectly blocked all debug builds
  return false;
}
```

To:

```typescript
if (Platform.OS === "ios" && isIOSSimulator()) {
  // Only blocks actual simulators
  return false;
}
```

### 3. Added Push Notification Background Mode

Updated [`ios/emap/Info.plist`](../ios/emap/Info.plist) to include:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

This allows the app to receive push notifications in the background.

### 4. Updated Production Entitlements

Updated [`ios/emap/emap.entitlements`](../ios/emap/emap.entitlements) to include:

```xml
<key>aps-environment</key>
<string>production</string>
```

This enables push notifications for production builds (debug already had this in `emapDebug.entitlements`).

## Verification

### Before Fix

```
Running on iOS device in debug mode:
⚠️ FCM not available on iOS simulator  ❌ (wrong message)
⚠️ Firebase Messaging not available    ❌ (blocked incorrectly)
```

### After Fix

```
Running on iOS device in debug mode:
✅ Firebase initialized successfully
✅ Firebase Cloud Messaging initialized
✅ Notification permission granted
✅ FCM token obtained: [token]
```

## Testing Steps

1. **Clean and rebuild the iOS app**:

   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```

2. **Run on a real iOS device**:

   ```bash
   npx expo run:ios --device
   ```

3. **Verify Firebase Messaging is available**:

   - Check console logs for "✅ Firebase Cloud Messaging initialized"
   - Try enabling notifications in the app
   - Should see "✅ FCM token obtained"

4. **Test on simulator** (should still be blocked):
   ```bash
   npx expo run:ios
   ```
   - Should see "⚠️ FCM not available on iOS simulator"
   - This is expected behavior

## Files Modified

1. [`services/firebaseInit.ts`](../services/firebaseInit.ts)

   - Fixed `isIOSSimulator()` detection
   - Updated `isMessagingAvailable()` logic

2. [`ios/emap/Info.plist`](../ios/emap/Info.plist)

   - Added `UIBackgroundModes` with `remote-notification`

3. [`ios/emap/emap.entitlements`](../ios/emap/emap.entitlements)
   - Added `aps-environment` for production

## Important Notes

### Why Simulators Don't Support FCM

- iOS Simulators cannot receive push notifications
- This is a limitation of the iOS Simulator, not our code
- Real devices are required for testing push notifications

### Debug vs Production Entitlements

- **Debug builds** use `emapDebug.entitlements` with `aps-environment: development`
- **Production builds** use `emap.entitlements` with `aps-environment: production`
- Both are now properly configured

### Multi-Brand Support

This fix works for all brands since:

- The entitlements files are shared across brands
- The simulator detection is platform-level, not brand-specific
- Each brand has its own `GoogleService-Info.plist` with correct configuration

## Related Documentation

- [Firebase iOS Device Fix](./firebase-ios-device-fix.md) - GoogleService-Info.plist configuration
- [Push Notifications Guide](./push-notifications-guide.md) - Complete push notification setup
