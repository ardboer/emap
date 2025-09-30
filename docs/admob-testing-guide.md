# AdMob Testing Guide

## Quick Start Testing

Since the AdMob integration requires a custom development build (not Expo Go), follow these steps to test the implementation:

### 1. Build the App

**For iOS:**

```bash
expo run:ios
```

**For Android:**

```bash
expo run:android
```

**Note**: This will create a custom development build with the AdMob SDK included.

### 2. Test the Banner Ad

1. Launch the app on your device/simulator
2. Navigate to any article (tap on an article from the home screen or news tab)
3. Scroll down to see the banner ad below the lead text
4. The ad should show:
   - Loading indicator initially
   - Test banner ad from Google AdMob
   - Console logs indicating ad load status

### 3. Expected Behavior

**Success Case:**

- Loading indicator appears briefly
- Test banner ad displays (320x50 banner)
- Console log: "Banner ad loaded successfully"
- Ad is centered and styled consistently with the app

**Error Case:**

- Loading indicator disappears
- No error message shown (configured to hide errors)
- Console log: "Banner ad failed to load: [error details]"

### 4. Console Monitoring

Open your development console to monitor ad loading:

**iOS (Xcode):**

```bash
npx react-native log-ios
```

**Android (Android Studio):**

```bash
npx react-native log-android
```

Look for these log messages:

- "AdMob initialized successfully"
- "Banner ad loaded successfully"
- "Banner ad failed to load: [error]"

### 5. Testing Different Scenarios

**Network Issues:**

- Turn off WiFi/mobile data
- Navigate to article
- Should see loading indicator that eventually times out

**Brand Switching:**

- Use the brand switcher (if available in settings)
- Navigate to article
- Ad should load with appropriate brand configuration

**Multiple Articles:**

- Navigate between different articles
- Each should show its own banner ad instance
- No memory leaks or performance issues

### 6. Troubleshooting

**Ad Not Showing:**

1. Check console for error messages
2. Verify internet connection
3. Ensure you're using custom development build (not Expo Go)
4. Try restarting the app

**Build Errors:**

1. Clean build cache:
   ```bash
   expo run:ios --clear
   expo run:android --clear
   ```
2. Check that all dependencies are installed
3. Verify app.json configuration

**Performance Issues:**

1. Monitor memory usage
2. Check for console warnings
3. Test on different devices/simulators

### 7. Test Checklist

- [ ] App builds successfully with AdMob plugin
- [ ] Banner ad appears on article detail page
- [ ] Loading indicator shows and disappears appropriately
- [ ] Console logs show successful ad initialization
- [ ] Ad is properly styled and positioned
- [ ] No crashes or performance issues
- [ ] Works on both iOS and Android
- [ ] Handles network errors gracefully
- [ ] Multiple article navigation works correctly

### 8. Next Steps for Production

Once testing is successful:

1. Create real AdMob account and app
2. Generate production Ad Unit IDs
3. Update configuration in `services/admob.ts`
4. Set `useTestAds: false` in production builds
5. Test with real ads before app store submission

---

**Important**: Always use test ads during development to avoid policy violations with Google AdMob.
