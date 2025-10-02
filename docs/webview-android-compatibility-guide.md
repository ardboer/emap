# WebView Android Compatibility Guide

## Issue Summary

The Ask tab was experiencing a "java.lang.String cannot be cast to java.lang.Double" error on Android devices when tapping the tab. This was caused by incompatible WebView prop types between iOS and Android platforms.

## Root Cause

The primary issue was the `decelerationRate` prop in the WebView component:

- **iOS**: Accepts both string values (`"normal"`, `"fast"`) and numeric values (0.0-1.0)
- **Android**: Only accepts numeric values (0.0-1.0)

When `decelerationRate="normal"` was passed to Android's WebView, the React Native bridge attempted to cast the string to a number, causing the casting error.

## Solution

The fix involved making WebView props platform-specific using `Platform.OS` checks:

```typescript
// Before (causing Android crash)
decelerationRate="normal"

// After (platform-specific)
decelerationRate={Platform.OS === 'android' ? 0.998 : 'normal'}
```

## Complete Fix Applied

The following changes were made to `app/(tabs)/ask.tsx`:

1. **Added Platform import**: `import { Platform } from 'react-native'`
2. **Fixed decelerationRate**: Used numeric value (0.998) for Android, string ("normal") for iOS
3. **Made Android-specific props conditional**: Set to `undefined` on iOS to avoid type conflicts
4. **Made iOS-specific props conditional**: Set to `undefined` on Android

### Platform-Specific Props Configuration

```typescript
// Fixed: Use numeric value for Android compatibility
decelerationRate={Platform.OS === 'android' ? 0.998 : 'normal'}

// Android-specific props
mixedContentMode={Platform.OS === 'android' ? 'compatibility' : undefined}
thirdPartyCookiesEnabled={Platform.OS === 'android' ? true : undefined}
sharedCookiesEnabled={Platform.OS === 'android' ? true : undefined}
nestedScrollEnabled={Platform.OS === 'android' ? true : undefined}

// iOS-specific props
allowsBackForwardNavigationGestures={Platform.OS === 'ios' ? true : undefined}
bounces={Platform.OS === 'ios' ? true : undefined}
```

## WebView Prop Compatibility Reference

### Numeric vs String Props

| Prop               | iOS              | Android     | Solution              |
| ------------------ | ---------------- | ----------- | --------------------- |
| `decelerationRate` | String or Number | Number only | Use Platform.OS check |

### Platform-Specific Props

| Prop                                  | Platform | Notes                    |
| ------------------------------------- | -------- | ------------------------ |
| `mixedContentMode`                    | Android  | Not available on iOS     |
| `thirdPartyCookiesEnabled`            | Android  | Not available on iOS     |
| `sharedCookiesEnabled`                | Android  | Not available on iOS     |
| `nestedScrollEnabled`                 | Android  | Not available on iOS     |
| `allowsBackForwardNavigationGestures` | iOS      | Not available on Android |
| `bounces`                             | iOS      | Not available on Android |

## Best Practices

1. **Always use Platform.OS checks** for props that behave differently across platforms
2. **Test on both platforms** when implementing WebView components
3. **Use numeric values for Android** when props accept both string and numeric types
4. **Set platform-specific props to undefined** on unsupported platforms to avoid TypeScript errors

## Testing

After applying this fix:

- ✅ iOS: Ask tab continues to work as expected
- ✅ Android: Ask tab no longer crashes with casting error
- ✅ TypeScript: No type errors in the WebView component

## Prevention

To prevent similar issues in the future:

1. Always check react-native-webview documentation for platform differences
2. Use TypeScript strict mode to catch type mismatches early
3. Test WebView components on both iOS and Android during development
4. Consider creating a reusable WebView wrapper component with built-in platform handling
