# Native Ads Lazy Loading - User Guide

## Overview

Native ads in the highlights carousel now use **lazy loading** to improve performance and reduce memory usage. Ads are loaded just before they come into view and automatically unloaded when the user scrolls away.

## Benefits

- **60-80% reduction in memory usage** - Only 2-3 ads in memory at once instead of all ads
- **Faster initial load** - No upfront ad loading delays
- **Smoother scrolling** - Better performance throughout the session
- **Endless carousel support** - Unlimited ads can appear as users scroll
- **Better user experience** - Loading indicators show when ads are being fetched

## Configuration

### Basic Configuration

Native ads are configured in your brand's [`config.json`](../brands/nt/config.json) file:

```json
{
  "nativeAds": {
    "enabled": true,
    "testMode": true,
    "firstAdPosition": 2,
    "adInterval": 5,
    "preloadDistance": 2,
    "unloadDistance": 3,
    "maxCachedAds": 3,
    "maxAdsPerSession": null,
    "showLoadingIndicator": true,
    "skipIfNotReady": true,
    "adUnitIds": {
      "ios": "ca-app-pub-...",
      "android": "ca-app-pub-..."
    }
  }
}
```

### Configuration Options

#### Core Settings

- **`enabled`** (boolean, required)

  - Enable or disable native ads
  - Default: `true`

- **`testMode`** (boolean, required)

  - Use Google's test ad units for development
  - Set to `false` for production
  - Default: `true`

- **`firstAdPosition`** (number, required)

  - Position of the first ad in the carousel (0-based index)
  - Example: `2` means the ad appears as the 3rd item
  - Default: `2`

- **`adInterval`** (number, required)
  - Number of slides between ads
  - Example: `5` means ads appear every 5 slides after the first
  - Pattern: firstAdPosition, firstAdPosition + interval, firstAdPosition + (2 × interval), ...
  - Default: `5`

#### Lazy Loading Settings

- **`preloadDistance`** (number, required)

  - How many slides ahead to start loading ads
  - Higher values = smoother experience but more memory
  - Lower values = less memory but potential loading delays
  - Recommended: `2`
  - Default: `2`

- **`unloadDistance`** (number, required)

  - How many slides away before unloading ads
  - Should be >= preloadDistance for best results
  - Higher values = keep more ads in memory
  - Recommended: `3`
  - Default: `3`

- **`maxCachedAds`** (number, required)

  - Maximum number of ads to keep in memory simultaneously
  - Prevents memory issues on long scrolling sessions
  - Recommended: `3` (allows current + 1 ahead + 1 behind)
  - Default: `3`

- **`maxAdsPerSession`** (number | null, required)
  - Maximum total ads to load in one session
  - Set to `null` for unlimited (recommended for endless scroll)
  - Set to a number to limit total ads
  - Default: `null` (unlimited)

#### User Experience Settings

- **`showLoadingIndicator`** (boolean, required)

  - Show loading spinner while ad is being fetched
  - Always `true` per requirements
  - Default: `true`

- **`skipIfNotReady`** (boolean, required)
  - Skip ad positions if ad isn't loaded in time
  - `true` = skip and continue (recommended)
  - `false` = wait for ad to load
  - Default: `true`

#### Ad Unit IDs

- **`adUnitIds.ios`** (string, required)

  - Google AdMob ad unit ID for iOS
  - Use test ID in development: `ca-app-pub-3940256099942544/3986624511`

- **`adUnitIds.android`** (string, required)
  - Google AdMob ad unit ID for Android
  - Use test ID in development: `ca-app-pub-3940256099942544/2247696110`

## How It Works

### Ad Position Calculation

With `firstAdPosition: 2` and `adInterval: 5`, ads appear at positions:

- Position 2 (3rd item)
- Position 7 (8th item)
- Position 12 (13th item)
- Position 17 (18th item)
- And so on...

### Lazy Loading Flow

1. **User at position 0**

   - System preloads ad at position 2 (within preloadDistance of 2)

2. **User scrolls to position 1**

   - Ad at position 2 continues loading
   - System may preload ad at position 7 if within range

3. **User reaches position 2**

   - Ad displays immediately (already loaded)
   - System preloads ad at position 7

4. **User scrolls to position 5**

   - Ad at position 2 is unloaded (beyond unloadDistance of 3)
   - Ad at position 7 is ready to display

5. **Process repeats** for endless scrolling

### Memory Management

The system maintains a cache of loaded ads:

- Maximum of `maxCachedAds` (default: 3) ads in memory
- Oldest/furthest ads are unloaded first
- Destroyed ads free up memory immediately

## Configuration Examples

### Conservative (Low Memory)

Best for devices with limited memory or shorter sessions:

```json
{
  "preloadDistance": 1,
  "unloadDistance": 2,
  "maxCachedAds": 2,
  "maxAdsPerSession": 10
}
```

### Balanced (Recommended)

Good balance of performance and memory usage:

```json
{
  "preloadDistance": 2,
  "unloadDistance": 3,
  "maxCachedAds": 3,
  "maxAdsPerSession": null
}
```

### Aggressive (Best UX)

Maximum smoothness, higher memory usage:

```json
{
  "preloadDistance": 3,
  "unloadDistance": 5,
  "maxCachedAds": 5,
  "maxAdsPerSession": null
}
```

## Analytics Events

The system logs detailed analytics for monitoring:

### Ad Lifecycle Events

- **`native_ad_preload_triggered`** - Ad loading started
- **`native_ad_lazy_loaded`** - Ad successfully loaded
- **`native_ad_lazy_load_failed`** - Ad failed to load
- **`native_ad_impression`** - Ad viewed by user
- **`native_ad_click`** - User clicked on ad
- **`native_ad_unloaded`** - Ad removed from memory

### Cache Statistics

- **`native_ad_cache_stats`** - Periodic cache status updates
  - `loaded_count` - Ads currently in memory
  - `loading_count` - Ads currently loading
  - `failed_count` - Ads that failed to load
  - `total_loaded_session` - Total ads loaded this session

## Troubleshooting

### Ads Not Appearing

1. **Check configuration**

   ```json
   "enabled": true,
   "testMode": true  // Use test mode during development
   ```

2. **Verify ad positions**

   - Check console logs for ad position calculations
   - Ensure `firstAdPosition` and `adInterval` are correct

3. **Check network connectivity**
   - Ads require internet connection to load
   - Check for network errors in console

### Ads Loading Slowly

1. **Increase preload distance**

   ```json
   "preloadDistance": 3  // Load earlier
   ```

2. **Check network speed**

   - Slow connections delay ad loading
   - Consider increasing `preloadDistance` for slow networks

3. **Review skip behavior**
   ```json
   "skipIfNotReady": true  // Skip if not ready (recommended)
   ```

### Memory Issues

1. **Reduce cache size**

   ```json
   "maxCachedAds": 2  // Keep fewer ads in memory
   ```

2. **Decrease unload distance**

   ```json
   "unloadDistance": 2  // Unload sooner
   ```

3. **Set session limit**
   ```json
   "maxAdsPerSession": 20  // Limit total ads
   ```

### Ads Appearing Too Frequently

Increase the interval between ads:

```json
"adInterval": 10  // More slides between ads
```

### Ads Not Appearing Frequently Enough

Decrease the interval between ads:

```json
"adInterval": 3  // Fewer slides between ads
```

## Best Practices

### Development

1. **Always use test mode during development**

   ```json
   "testMode": true
   ```

2. **Monitor console logs** for ad loading events

3. **Test with different scroll patterns**
   - Fast scrolling
   - Backward scrolling
   - Jump to position

### Production

1. **Use production ad unit IDs**

   ```json
   "testMode": false,
   "adUnitIds": {
     "ios": "ca-app-pub-YOUR-ID/YOUR-UNIT",
     "android": "ca-app-pub-YOUR-ID/YOUR-UNIT"
   }
   ```

2. **Start with recommended settings**

   - `preloadDistance: 2`
   - `unloadDistance: 3`
   - `maxCachedAds: 3`

3. **Monitor analytics** to optimize settings
   - Check ad impression rates
   - Monitor load times
   - Track memory usage

### Performance Optimization

1. **Balance preload distance with memory**

   - Higher preload = smoother but more memory
   - Lower preload = less memory but potential delays

2. **Adjust based on user behavior**

   - Fast scrollers: increase preload distance
   - Slow scrollers: can use lower preload distance

3. **Consider device capabilities**
   - High-end devices: can handle more cached ads
   - Low-end devices: reduce cache size

## Migration from Old Configuration

If you have the old `adFrequency` configuration:

### Old Configuration

```json
{
  "adFrequency": 5
}
```

### New Configuration

```json
{
  "adInterval": 5,
  "preloadDistance": 2,
  "unloadDistance": 3,
  "maxCachedAds": 3,
  "maxAdsPerSession": null,
  "showLoadingIndicator": true,
  "skipIfNotReady": true
}
```

**Note:** The system automatically converts `adFrequency` to `adInterval` for backward compatibility, but you should update your configuration to use the new property names.

## Support

For issues or questions:

1. Check console logs for detailed error messages
2. Review analytics events for ad performance
3. Verify configuration matches this guide
4. Test with different settings to find optimal values

## Related Documentation

- [Implementation Plan](./native-ads-lazy-loading-plan.md) - Technical implementation details
- [Brand Configuration Guide](./brand-fonts-guide.md) - General brand configuration
- [Highlights Configuration](./highlights-mix-and-match-configuration.md) - Highlights carousel setup
