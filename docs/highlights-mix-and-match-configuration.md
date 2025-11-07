# Highlights Mix-and-Match Configuration Guide

## Overview

The `mixAndMatch` configuration option allows you to control how WordPress articles and Miso recommendations are combined in the highlights carousel. This feature provides flexibility in content presentation to optimize user engagement.

## Configuration

### Location

The `mixAndMatch` setting is configured per brand in the `highlightsRecommendations` section of each brand's `config.json` file.

### Syntax

```json
{
  "highlightsRecommendations": {
    "enabled": true,
    "misoItemCount": 10,
    "mixAndMatch": true,
    "endlessScroll": {
      "enabled": true,
      "itemsPerLoad": 5,
      "triggerThreshold": 3
    }
  }
}
```

### Parameters

| Parameter     | Type    | Default | Description                                                                                                                               |
| ------------- | ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `mixAndMatch` | boolean | `true`  | When `true`, alternates WordPress and Miso articles in 1:1 pattern. When `false`, shows all WordPress articles first, then Miso articles. |

## Behavior

### With `mixAndMatch: true` (Alternating Pattern)

Articles are interleaved in a 1:1 pattern:

- WordPress article
- Miso recommendation
- WordPress article
- Miso recommendation
- ... continues until WordPress articles are exhausted
- Then continues with remaining Miso articles only

**Example:**

```
Input:
- WordPress: [WP1, WP2, WP3, WP4, WP5]
- Miso: [M1, M2, M3, M4, M5, M6, M7]

Output:
[WP1, M1, WP2, M2, WP3, M3, WP4, M4, WP5, M5, M6, M7]
```

### With `mixAndMatch: false` (Sequential Pattern)

All WordPress articles are shown first, followed by all Miso recommendations:

**Example:**

```
Input:
- WordPress: [WP1, WP2, WP3, WP4, WP5]
- Miso: [M1, M2, M3, M4, M5, M6, M7]

Output:
[WP1, WP2, WP3, WP4, WP5, M1, M2, M3, M4, M5, M6, M7]
```

## Native Ads Integration

Native ads are injected **after** the mixing logic is applied, at positions configured in the `nativeAds` section:

```json
{
  "nativeAds": {
    "enabled": true,
    "firstAdPosition": 2,
    "adFrequency": 5
  }
}
```

**Example with Mix-and-Match + Native Ads:**

```
After mixing: [WP1, M1, WP2, M2, WP3, M3, WP4, M4, WP5, M5, M6, M7]
After ads:    [WP1, M1, AD1, WP2, M2, WP3, M3, WP4, AD2, M4, WP5, M5, M6, AD3, M7]
                         ↑ position 2        ↑ position 7 (2+5)    ↑ position 12 (7+5)
```

## Use Cases

### When to Enable Mix-and-Match (`true`)

✅ **Recommended for:**

- Maximizing engagement with personalized content early in the carousel
- Providing variety to keep users interested
- Testing recommendation effectiveness throughout the carousel
- Brands with strong Miso recommendation performance

**Benefits:**

- Users see personalized content sooner
- Better distribution of recommendation exposure
- Reduced drop-off before reaching Miso content
- More balanced content mix

### When to Disable Mix-and-Match (`false`)

✅ **Recommended for:**

- Prioritizing editorial content (WordPress) over recommendations
- Maintaining traditional content hierarchy
- Brands with strong editorial curation
- A/B testing content ordering strategies

**Benefits:**

- Editorial content gets full attention first
- Clearer separation between curated and recommended content
- Simpler content progression
- Maintains existing user expectations

## Progress Indicator Behavior

The progress indicator in the carousel shows progress through WordPress articles (including native ads in the WordPress section). This behavior is consistent regardless of the `mixAndMatch` setting:

- **With mix-and-match:** Progress tracks the first N items where N = WordPress count + native ads before first Miso article
- **Without mix-and-match:** Progress tracks all WordPress articles + native ads in WordPress section

## Edge Cases

The implementation handles various edge cases automatically:

### More WordPress than Miso

```
WordPress: [WP1, WP2, WP3, WP4, WP5]
Miso: [M1, M2]

Result: [WP1, M1, WP2, M2, WP3, WP4, WP5]
```

### More Miso than WordPress

```
WordPress: [WP1, WP2]
Miso: [M1, M2, M3, M4, M5]

Result: [WP1, M1, WP2, M2, M3, M4, M5]
```

### Equal Counts

```
WordPress: [WP1, WP2, WP3]
Miso: [M1, M2, M3]

Result: [WP1, M1, WP2, M2, WP3, M3]
```

### No WordPress Articles

```
WordPress: []
Miso: [M1, M2, M3]

Result: [M1, M2, M3]
```

### No Miso Articles

```
WordPress: [WP1, WP2, WP3]
Miso: []

Result: [WP1, WP2, WP3]
```

## Implementation Details

### Code Location

- **Configuration Interface:** `brands/index.ts` - `BrandConfig.highlightsRecommendations.mixAndMatch`
- **Mixing Logic:** `services/api.ts` - `mixArticles()` function
- **Integration:** `services/api.ts` - `fetchHighlightsWithRecommendations()` function

### Logging

The implementation includes comprehensive logging for debugging:

```javascript
// When mix-and-match is enabled:
console.log("🔀 Mix-and-match enabled: alternating WP and Miso articles");
console.log("📊 Mixed articles: 12 total (5 WP + 7 Miso)");
console.log("📋 Pattern: WP, M, WP, M, WP, M, WP, M, WP, M, M, M");

// When mix-and-match is disabled:
console.log("📚 Sequential mode: WordPress first, then Miso");
```

## Testing

To test the mix-and-match feature:

1. **Enable mix-and-match** in your brand's `config.json`:

   ```json
   "mixAndMatch": true
   ```

2. **Launch the app** and navigate to the Highlights tab

3. **Check console logs** for mixing pattern confirmation

4. **Verify carousel order** matches expected pattern

5. **Test with different article counts** to verify edge case handling

6. **Disable mix-and-match** and verify sequential behavior:
   ```json
   "mixAndMatch": false
   ```

## Brand Configuration Examples

### Nursing Times (NT)

```json
{
  "highlightsRecommendations": {
    "enabled": true,
    "misoItemCount": 10,
    "mixAndMatch": true,
    "endlessScroll": {
      "enabled": true,
      "itemsPerLoad": 5,
      "triggerThreshold": 3
    }
  }
}
```

### Construction News (CN)

```json
{
  "highlightsRecommendations": {
    "enabled": true,
    "misoItemCount": 10,
    "mixAndMatch": true,
    "endlessScroll": {
      "enabled": true,
      "itemsPerLoad": 5,
      "triggerThreshold": 3
    }
  }
}
```

### Journal of Nursing Leadership (JNL)

```json
{
  "highlightsRecommendations": {
    "enabled": true,
    "misoItemCount": 10,
    "mixAndMatch": true,
    "endlessScroll": {
      "enabled": true,
      "itemsPerLoad": 5,
      "triggerThreshold": 3
    }
  }
}
```

## Analytics Considerations

The mix-and-match feature affects how content performance is measured:

- **Article position metrics** will differ between mixed and sequential modes
- **Engagement rates** may vary based on content ordering
- **Recommendation effectiveness** can be better measured with mix-and-match enabled
- Consider A/B testing to determine optimal configuration for your brand

## Troubleshooting

### Issue: Articles not mixing as expected

**Solution:** Check console logs for mixing pattern. Verify `mixAndMatch: true` in brand config.

### Issue: Progress indicator showing incorrect count

**Solution:** Progress indicator counts WordPress articles + native ads before first Miso article. This is expected behavior.

### Issue: Native ads appearing in wrong positions

**Solution:** Native ads are injected after mixing. Check `nativeAds.firstAdPosition` and `nativeAds.adFrequency` settings.

### Issue: Endless scroll not loading more items

**Solution:** Endless scroll is independent of mix-and-match. Check `endlessScroll.enabled` and `endlessScroll.triggerThreshold` settings.

## Related Documentation

- [Highlights Miso Recommendations Implementation Summary](./highlights-miso-recommendations-implementation-summary.md)
- [Highlights Endless Scroll Implementation Plan](./highlights-endless-scroll-implementation-plan.md)
- [Miso Recommendations Configuration Guide](./miso-recommendations-configuration-guide.md)
- [Native Ads Configuration](./native-ads-video-support-guide.md)

## Version History

- **v1.0.0** (2025-01-07): Initial implementation of mix-and-match feature
  - Added `mixAndMatch` configuration option
  - Implemented `mixArticles()` utility function
  - Updated `fetchHighlightsWithRecommendations()` to support both modes
  - Added comprehensive logging and documentation
