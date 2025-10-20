# Firebase Analytics Implementation Summary

**Date:** January 2025  
**Status:** ✅ Complete  
**Version:** 1.0

---

## Quick Overview

Firebase Analytics has been successfully integrated into the multi-brand news app with comprehensive tracking for:

✅ **Carousel scroll depth tracking** - Detailed metrics on how far users scroll  
✅ **Session time tracking** - Total time in app and per screen  
✅ **Navigation flow tracking** - User journey through the app  
✅ **Article engagement** - Views, clicks, and dwell time  
✅ **Multi-brand segmentation** - All events tagged with brand identifier

---

## Files Modified

### Core Implementation

1. **`services/analytics.ts`** (NEW)

   - Core analytics service with all tracking methods
   - Brand-aware event logging
   - Scroll depth calculation utilities
   - Session management

2. **`app/_layout.tsx`** (MODIFIED)

   - Analytics initialization on app start
   - App state tracking (foreground/background)
   - Navigation tracking
   - Session start/end events

3. **`app/(tabs)/index.tsx`** (MODIFIED)
   - Comprehensive carousel tracking
   - Scroll depth metrics
   - Article view/dwell/click events
   - Milestone tracking (25%, 50%, 75%, 100%)
   - Manual vs auto-play detection

### Documentation

4. **`docs/firebase-analytics-tracking-guide.md`** (NEW)

   - Complete data dictionary for data team
   - All events and parameters documented
   - BigQuery analysis examples
   - Privacy compliance information

5. **`docs/firebase-analytics-implementation-summary.md`** (THIS FILE)
   - Implementation overview
   - Testing guide
   - Deployment checklist

---

## Package Changes

### Added Dependencies

```json
{
  "@react-native-firebase/analytics": "^23.4.1"
}
```

### iOS Native Dependencies

- `FirebaseAnalytics` (12.4.0)
- `GoogleAppMeasurement` (12.4.0)
- `GoogleUtilities` (8.1.0)
- `RNFBAnalytics` (23.4.1)

**Status:** ✅ Installed via `pod install`

---

## Key Features Implemented

### 1. Carousel Scroll Depth Tracking

**What's Tracked:**

- Maximum index reached (furthest article viewed)
- Scroll depth percentage (0-100%)
- Unique articles viewed
- Completion rate
- Scroll progression path
- Manual vs auto-play interactions
- Backward scrolling (re-engagement)

**Key Events:**

- `carousel_session_start` / `carousel_session_end`
- `carousel_article_view` / `carousel_article_dwell` / `carousel_article_click`
- `carousel_milestone_25/50/75/100`
- `carousel_drop_off`
- `carousel_manual_scroll_start/end`
- `carousel_auto_advance`
- `carousel_backward_scroll`

### 2. Session Time Tracking

**What's Tracked:**

- Total session duration (ms, seconds, minutes)
- Time per screen
- App foreground/background events
- Session start/end timestamps

**Key Events:**

- `session_start` / `session_end`
- `screen_time`
- `app_foreground` / `app_background`

### 3. Navigation Tracking

**What's Tracked:**

- Screen views (automatic)
- Navigation paths (from → to)
- Screen time per view
- Navigation parameters

**Key Events:**

- `screen_view` (Firebase standard)
- `screen_navigation`
- `screen_time`

### 4. Multi-Brand Segmentation

**User Properties Set:**

- `brand` - Brand shortcode (cn, nt, jnl)
- `brand_name` - Full brand name
- `bundle_id` - App bundle identifier
- `features_enabled` - Enabled features list

**All events automatically tagged with:**

- `brand` parameter
- `timestamp` parameter

---

## Testing Guide

### 1. Enable Debug Mode

#### iOS

```bash
# Enable debug mode
xcrun simctl spawn booted log config --mode "level:debug" --subsystem com.google.firebase.analytics

# View debug logs
xcrun simctl spawn booted log stream --level debug --predicate 'subsystem == "com.google.firebase.analytics"'
```

#### Android

```bash
# Enable debug mode
adb shell setprop debug.firebase.analytics.app metropolis.co.uk.constructionnews

# View debug logs
adb logcat -s FA FA-SVC
```

### 2. Firebase Console DebugView

1. Open Firebase Console: https://console.firebase.google.com
2. Select project: `mobileapps-cone-fab-reactnativ`
3. Navigate to: **Analytics → DebugView**
4. Run app in debug mode
5. Verify events appear in real-time

### 3. Test Scenarios

#### Scenario 1: Carousel Engagement

```
1. Launch app
2. View Highlights tab (carousel)
3. Scroll through 3-4 articles manually
4. Let auto-play advance 1-2 articles
5. Click on an article
6. Return to carousel
7. Exit carousel

Expected Events:
✓ carousel_session_start
✓ carousel_article_view (multiple)
✓ carousel_manual_scroll_start/end
✓ carousel_auto_advance
✓ carousel_article_click
✓ carousel_session_end (with scroll depth data)
```

#### Scenario 2: Session Tracking

```
1. Launch app
2. Navigate to Articles tab
3. View an article
4. Return to app
5. Put app in background
6. Return to foreground
7. Close app

Expected Events:
✓ session_start
✓ screen_view (Highlights)
✓ screen_navigation (Highlights → Articles)
✓ screen_view (Articles)
✓ app_background
✓ app_foreground
✓ session_end (with duration)
```

#### Scenario 3: Scroll Depth Milestones

```
1. Launch app
2. View carousel with 8+ articles
3. Scroll to 25% (2nd article)
4. Scroll to 50% (4th article)
5. Scroll to 75% (6th article)
6. Scroll to 100% (last article)

Expected Events:
✓ carousel_milestone_25
✓ carousel_milestone_50
✓ carousel_milestone_75
✓ carousel_milestone_100
```

### 4. Verify Data in Firebase Console

**After 24 hours:**

1. Navigate to: **Analytics → Events**
2. Check for custom events:
   - `carousel_session_end`
   - `carousel_article_view`
   - `carousel_milestone_*`
3. Verify parameters are populated
4. Check user properties are set

**After 48 hours:**

1. Navigate to: **Analytics → Reports**
2. Check engagement metrics
3. Verify brand segmentation works
4. Review scroll depth distribution

---

## Deployment Checklist

### Pre-Deployment

- [x] Install `@react-native-firebase/analytics` package
- [x] Run `pod install` for iOS
- [x] Implement analytics service
- [x] Add carousel tracking
- [x] Add session tracking
- [x] Add navigation tracking
- [x] Create data team documentation

### Testing

- [ ] Test in iOS simulator with DebugView
- [ ] Test on iOS device with DebugView
- [ ] Test in Android emulator with DebugView
- [ ] Test on Android device with DebugView
- [ ] Verify all carousel events fire correctly
- [ ] Verify session tracking works
- [ ] Verify navigation tracking works
- [ ] Verify brand segmentation works
- [ ] Test across all brands (CN, NT, JNL)

### Firebase Console Setup

- [ ] Verify events appear in DebugView
- [ ] Create custom dimensions for key parameters
- [ ] Set up conversion events (if needed)
- [ ] Create audiences for segmentation
- [ ] Set up BigQuery export (optional)
- [ ] Configure data retention settings

### Documentation

- [x] Create data team documentation
- [x] Document all events and parameters
- [x] Provide BigQuery analysis examples
- [ ] Share documentation with data team
- [ ] Train team on Firebase Console

### Production Deployment

- [ ] Disable debug mode
- [ ] Build production iOS app
- [ ] Build production Android app
- [ ] Deploy to TestFlight/Internal Testing
- [ ] Verify analytics in production
- [ ] Monitor for 48 hours
- [ ] Review initial data with data team

---

## Key Metrics to Monitor

### Carousel Engagement

| Metric               | Target  | How to Measure                                     |
| -------------------- | ------- | -------------------------------------------------- |
| Average Scroll Depth | > 60%   | `carousel_session_end.scroll_depth_percentage`     |
| Completion Rate      | > 25%   | % of sessions with `carousel_milestone_100`        |
| Click-Through Rate   | > 15%   | `carousel_article_click` / `carousel_article_view` |
| Avg Dwell Time       | > 5 sec | `carousel_article_dwell.dwell_time_seconds`        |

### Session Metrics

| Metric                   | Target  | How to Measure                  |
| ------------------------ | ------- | ------------------------------- |
| Avg Session Duration     | > 3 min | `session_end.duration_minutes`  |
| Sessions per User        | > 2/day | Count `session_start` per user  |
| Screen Views per Session | > 5     | Count `screen_view` per session |

### Drop-off Analysis

| Metric                    | Purpose              | How to Measure                                  |
| ------------------------- | -------------------- | ----------------------------------------------- |
| Drop-off Index            | Find problem spots   | `carousel_drop_off.drop_off_index` distribution |
| Drop-off Rate by Position | Position performance | % drop-off at each index                        |
| Time Before Drop-off      | Engagement duration  | `carousel_drop_off.time_before_drop_off_ms`     |

---

## Troubleshooting

### Events Not Appearing in DebugView

**iOS:**

```bash
# Check if debug mode is enabled
xcrun simctl spawn booted log stream --predicate 'subsystem == "com.google.firebase.analytics"' | grep -i debug

# Re-enable debug mode
xcrun simctl spawn booted log config --mode "level:debug" --subsystem com.google.firebase.analytics
```

**Android:**

```bash
# Check if debug mode is enabled
adb shell getprop debug.firebase.analytics.app

# Re-enable debug mode
adb shell setprop debug.firebase.analytics.app YOUR_PACKAGE_NAME
```

### Events Not Appearing in Console

- Wait 24-48 hours for data to process
- Check Firebase Console → Analytics → Events
- Verify app is using correct Firebase project
- Check google-services.json / GoogleService-Info.plist is correct
- Ensure app has internet connection

### TypeScript Errors

If you see TypeScript errors related to analytics:

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Restart TypeScript server in VS Code
CMD+Shift+P → "TypeScript: Restart TS Server"
```

---

## Support & Resources

### Documentation

- **Data Team Guide:** [`docs/firebase-analytics-tracking-guide.md`](./firebase-analytics-tracking-guide.md)
- **Firebase Analytics Docs:** https://firebase.google.com/docs/analytics
- **React Native Firebase Docs:** https://rnfirebase.io/analytics/usage

### Firebase Console

- **Project:** `mobileapps-cone-fab-reactnativ`
- **Console URL:** https://console.firebase.google.com
- **DebugView:** Analytics → DebugView
- **Events:** Analytics → Events
- **Reports:** Analytics → Reports

### Contact

- **Technical Issues:** Development Team
- **Data Analysis:** Data Team
- **Product Questions:** Product Management

---

## Next Steps

1. **Complete Testing** (This Week)

   - Test all scenarios in debug mode
   - Verify events in DebugView
   - Test across all brands

2. **Deploy to Staging** (Next Week)

   - Build staging apps
   - Monitor analytics for 48 hours
   - Review data with team

3. **Production Deployment** (Following Week)

   - Deploy to production
   - Monitor closely for first week
   - Generate initial reports

4. **Ongoing Monitoring**
   - Weekly review of key metrics
   - Monthly deep-dive analysis
   - Quarterly optimization based on data

---

**Implementation Status:** ✅ Complete  
**Ready for Testing:** ✅ Yes  
**Ready for Production:** ⏳ Pending Testing

**Last Updated:** January 2025
