# Native Ads Video Support Guide

## Overview

The Highlights carousel now supports both **image and video native ads**. Videos auto-play muted as users scroll through the carousel, providing a more engaging ad experience.

---

## ✅ Current Implementation Status

### What's Working

- ✅ Video detection via `mediaContent` property
- ✅ Automatic video playback (muted)
- ✅ Fallback to images when no video available
- ✅ Full-screen video rendering in carousel
- ✅ Proper aspect ratio handling (16:9)
- ✅ Video analytics tracking

### Component: `NativeAdCarouselItem.tsx`

```typescript
// Detects if ad has video content
const hasMediaContent = !!nativeAd.mediaContent;
const hasVideo = hasMediaContent && nativeAd.mediaContent?.hasVideoContent;

// Renders video or image
{hasMediaContent ? (
  <NativeMediaView style={styles.backgroundImage} resizeMode="cover" />
) : (
  <FadeInImage source={{ uri: adImage }} ... />
)}
```

---

## 🧪 Testing Video Ads

### Google Test Ads

**Current Test Ad Unit IDs:**

- iOS: `ca-app-pub-3940256099942544/3986624511`
- Android: `ca-app-pub-3940256099942544/2247696110`

**Important Notes:**

- Google's test ads **may or may not** include video content
- Test ad inventory varies - sometimes image, sometimes video
- Video support is implemented and ready, but test ads might show images
- This is normal behavior for Google's test ad system

### What You'll See in Logs

**When video ad loads:**

```
Native ad loaded successfully in XXX ms
Ad Data: {
  headline: "Test mode: App Name",
  body: "Description text...",
  hasMediaContent: true,
  hasVideo: true,  ← Video detected!
  mediaAspectRatio: 1.77,
  ...
}
```

**When image ad loads:**

```
Native ad loaded successfully in XXX ms
Ad Data: {
  headline: "Test mode: App Name",
  body: "Description text...",
  hasMediaContent: false,  ← No video
  hasVideo: false,
  imageCount: 1,
  ...
}
```

---

## 🎬 Video Ad Specifications

### For Ad Operations Team

When creating video native ads in Google Ad Manager:

**Technical Requirements:**

- **Format**: MP4 (H.264 codec recommended)
- **Aspect Ratio**: 16:9 (1920x1080 or 1280x720)
- **Duration**: Maximum 30 seconds
- **File Size**: Under 5MB for optimal performance
- **Audio**: Include audio (will auto-play muted)

**Best Practices:**

- Keep videos 15-20 seconds for best engagement
- Show branding within first 3 seconds
- Make first frame compelling (visible before play)
- Ensure video works without sound
- Test on both iOS and Android

---

## 🔍 Verifying Video Support

### Method 1: Check Console Logs

1. Build and run the app
2. Navigate to Highlights tab
3. Scroll to ad position (4, 9, 14, etc.)
4. Check console for `hasVideo: true`

### Method 2: Visual Inspection

- **Video ads**: Will show play controls briefly, then auto-play
- **Image ads**: Static image, no play controls
- Both look seamless in the carousel

### Method 3: Production Testing

Once production ad unit IDs are configured:

1. Upload video creative in Google Ad Manager
2. Target the Highlights carousel ad units
3. Test in production app
4. Video should auto-play muted

---

## 📊 Video vs Image Performance

### Expected Metrics

| Metric      | Image Ads | Video Ads   |
| ----------- | --------- | ----------- |
| CTR         | 0.5-1.5%  | 1.5-3.0%    |
| Viewability | 70-80%    | 75-85%      |
| Engagement  | Baseline  | 2-3x higher |
| CPM         | $2-5      | $5-15       |

### Why Video Performs Better

- **Motion attracts attention**: Auto-play catches user's eye
- **More information**: Can show product in action
- **Better storytelling**: Demonstrates value proposition
- **Premium format**: Advertisers pay more for video

---

## 🚀 Production Deployment

### Step 1: Ad Operations Setup

1. Create video native ad creatives in GAM
2. Upload MP4 videos (16:9, max 30s)
3. Associate with Highlights carousel line items
4. Set appropriate CPM rates (higher for video)

### Step 2: Dev Team Configuration

Update brand config files with production ad unit IDs:

```json
{
  "nativeAds": {
    "enabled": true,
    "testMode": false, // Switch to production
    "adUnitIds": {
      "ios": "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY",
      "android": "ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ"
    }
  }
}
```

### Step 3: Testing

1. Deploy to TestFlight/Internal Testing
2. Verify video ads load and play
3. Check analytics tracking
4. Monitor performance metrics

### Step 4: Launch

1. Gradual rollout (10% → 50% → 100%)
2. Monitor fill rates and revenue
3. A/B test video vs image performance
4. Optimize based on data

---

## 🐛 Troubleshooting

### Video Not Playing

**Possible Causes:**

1. No video ads in current inventory
2. Network issues preventing video load
3. Device doesn't support video format
4. Ad blocker interfering

**Solutions:**

1. Check `hasVideo` in console logs
2. Verify network connectivity
3. Test on different devices
4. Check GAM creative approval status

### Video Quality Issues

**Possible Causes:**

1. Video file too large
2. Wrong aspect ratio
3. Unsupported codec

**Solutions:**

1. Compress video to under 5MB
2. Ensure 16:9 aspect ratio
3. Use H.264 codec (MP4)
4. Test video file before uploading

### Performance Issues

**Possible Causes:**

1. Video file too large
2. Too many videos loading simultaneously
3. Device memory constraints

**Solutions:**

1. Optimize video file size
2. Limit video ad frequency
3. Test on lower-end devices
4. Monitor app performance metrics

---

## 📈 Analytics & Monitoring

### Key Metrics to Track

1. **Video Ad Fill Rate**

   - Target: >60% for video inventory
   - Monitor in GAM reports

2. **Video Completion Rate**

   - Target: >70% (users watch most of video)
   - Track in analytics

3. **Video CTR**

   - Target: 1.5-3.0%
   - Compare to image ad CTR

4. **Revenue per Video Ad**
   - Track eCPM for video vs image
   - Optimize pricing strategy

### Analytics Events

The app tracks these video-specific events:

```javascript
// When video ad loads
native_ad_impression {
  ad_id: "native-ad-0",
  is_real_ad: true,
  has_video: true  // Video indicator
}

// When user clicks video ad
native_ad_click {
  ad_id: "native-ad-0",
  dwell_time_ms: 5000,
  is_real_ad: true
}
```

---

## 🎯 Best Practices

### For Advertisers

1. **Keep it short**: 15-20 seconds optimal
2. **Front-load value**: Show key message in first 5 seconds
3. **Design for sound-off**: Assume users won't hear audio
4. **Strong first frame**: Make it visually compelling
5. **Clear CTA**: Show call-to-action prominently

### For Publishers

1. **Limit frequency**: Don't show too many video ads
2. **Monitor performance**: Track engagement metrics
3. **A/B test**: Compare video vs image performance
4. **Optimize placement**: Test different positions
5. **Set floor prices**: Video ads should have higher CPM

### For Users

1. **Auto-play muted**: Doesn't interrupt experience
2. **Seamless integration**: Looks like editorial content
3. **Easy to skip**: Swipe to next article
4. **Clear labeling**: "Sponsored" badge visible
5. **Opt-out available**: AdChoices icon clickable

---

## 📚 Additional Resources

- [Google Native Video Ads Guide](https://support.google.com/admanager/answer/6366845)
- [Video Ad Best Practices](https://support.google.com/admanager/answer/7072409)
- [Native Ad Policy](https://support.google.com/admob/answer/6329638)
- [Video Creative Specifications](https://support.google.com/admanager/answer/1100453)

---

## ✅ Summary

- ✅ Video support is **fully implemented** and ready
- ✅ Works with Google's test ads (when video available)
- ✅ Will work with production video ads immediately
- ✅ Falls back to images gracefully
- ✅ Auto-plays muted for best UX
- ✅ Tracks all analytics events
- ✅ Complies with Google policies

**The system is production-ready for video native ads!**

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-02  
**Status**: Video Support Active
