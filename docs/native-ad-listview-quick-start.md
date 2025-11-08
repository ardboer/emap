# Native Ad List View - Quick Start Guide

## Overview

This guide provides a quick reference for implementing and configuring native ads in list views that look like article teasers.

## Configuration Example

Add to your brand's `config.json`:

```json
{
  "nativeAds": {
    "enabled": true,
    "testMode": true,
    "carousel": {
      "enabled": true,
      "firstAdPosition": 2,
      "adInterval": 5,
      "preloadDistance": 1,
      "unloadDistance": 3,
      "maxCachedAds": 3,
      "maxAdsPerSession": null,
      "showLoadingIndicator": true,
      "skipIfNotReady": false
    },
    "listView": {
      "enabled": true,
      "views": {
        "news": {
          "enabled": true,
          "positions": [3, 8, 15, 22],
          "maxAdsPerList": 4,
          "blockPositions": [1, 3],
          "maxAdsPerBlock": 2
        },
        "clinical": {
          "enabled": true,
          "positions": [5, 12, 20],
          "maxAdsPerList": 3
        },
        "events": {
          "enabled": false,
          "positions": [],
          "maxAdsPerList": 0
        }
      },
      "preloadAds": true,
      "showLoadingIndicator": false,
      "skipIfNotReady": true
    },
    "adUnitIds": {
      "carousel": {
        "ios": "ca-app-pub-3940256099942544/3986624511",
        "android": "ca-app-pub-3940256099942544/2247696110"
      },
      "listView": {
        "ios": "ca-app-pub-3940256099942544/3986624511",
        "android": "ca-app-pub-3940256099942544/2247696110"
      }
    }
  }
}
```

## Configuration Options

### List View Configuration

| Option                 | Type    | Description                                     |
| ---------------------- | ------- | ----------------------------------------------- |
| `enabled`              | boolean | Master switch for list view native ads          |
| `views`                | object  | Per-view configuration (news, clinical, events) |
| `preloadAds`           | boolean | Whether to preload ads before they're visible   |
| `showLoadingIndicator` | boolean | Show loading state while ad loads               |
| `skipIfNotReady`       | boolean | Skip position if ad fails to load               |

### Per-View Configuration

| Option           | Type     | Description                                             |
| ---------------- | -------- | ------------------------------------------------------- |
| `enabled`        | boolean  | Enable ads for this specific view                       |
| `positions`      | number[] | Array of positions where ads should appear (0-based)    |
| `maxAdsPerList`  | number   | Maximum number of ads in the entire list                |
| `blockPositions` | number[] | (Optional) For section lists: which blocks can have ads |
| `maxAdsPerBlock` | number   | (Optional) Maximum ads per block in section lists       |

## Usage in Components

### Basic FlatList Integration

```typescript
import { NativeAdListItem } from "@/components/NativeAdListItem";
import { nativeAdVariantManager } from "@/services/nativeAdVariantManager";

const renderItem = ({ item, index }: { item: Article; index: number }) => {
  // Check if this position should show a native ad
  if (nativeAdVariantManager.shouldShowAdAtPosition("news", index)) {
    return (
      <NativeAdListItem
        position={index}
        viewType="news"
        onAdLoaded={(pos) => console.log(`Ad loaded at ${pos}`)}
        onAdFailed={(pos) => console.log(`Ad failed at ${pos}`)}
      />
    );
  }

  // Regular article rendering
  if (index === 0) {
    return <ArticleTeaserHero article={item} />;
  }
  return <ArticleTeaser article={item} />;
};
```

### Section-Based List Integration

```typescript
const renderBlock = (block: Block, blockIndex: number) => {
  const blockConfig = nativeAdVariantManager.getListViewConfig("news");
  const shouldShowAdsInBlock =
    blockConfig?.blockPositions?.includes(blockIndex);

  return (
    <FlatList
      data={block.items}
      renderItem={({ item, index }) => {
        if (
          shouldShowAdsInBlock &&
          nativeAdVariantManager.shouldShowAdAtPosition(
            "news",
            index,
            blockIndex
          )
        ) {
          return (
            <NativeAdListItem
              position={index}
              viewType="news"
              blockIndex={blockIndex}
            />
          );
        }
        return <ArticleTeaser article={item} />;
      }}
    />
  );
};
```

## Ad Unit IDs

### Test Mode (Development)

Use Google's official test ad unit IDs:

- iOS: `ca-app-pub-3940256099942544/3986624511`
- Android: `ca-app-pub-3940256099942544/2247696110`

### Production Mode

Replace with your actual AdMob ad unit IDs from the AdMob console.

## Position Calculation Examples

### Example 1: Simple Positions

```json
{
  "positions": [3, 8, 15, 22],
  "maxAdsPerList": 4
}
```

- Ads appear at indices: 3, 8, 15, 22
- Maximum 4 ads total in the list

### Example 2: Section-Based Positions

```json
{
  "positions": [2, 5, 8],
  "maxAdsPerList": 6,
  "blockPositions": [0, 2, 4],
  "maxAdsPerBlock": 2
}
```

- Ads can appear in blocks 0, 2, and 4
- Within each block, ads at positions 2, 5, 8
- Maximum 2 ads per block
- Maximum 6 ads total across all blocks

## Google AdMob Compliance

### Required Elements

✅ "Sponsored" badge clearly visible
✅ AdChoices icon (ⓘ) present and clickable
✅ All content wrapped in NativeAdView
✅ Proper asset attribution using NativeAsset
✅ Entire ad area is clickable

### Best Practices

- Keep ad styling consistent with article teasers
- Don't mislead users about sponsored content
- Ensure AdChoices icon is always accessible
- Track impressions and clicks accurately
- Properly destroy ads when unmounted

## Troubleshooting

### Ads Not Showing

1. Check `enabled: true` in config
2. Verify positions array is not empty
3. Ensure `maxAdsPerList > 0`
4. Check ad unit IDs are correct
5. Verify test mode is enabled for development

### Ads Loading Slowly

1. Enable `preloadAds: true`
2. Reduce `maxAdsPerList` if too many
3. Check network connectivity
4. Verify ad unit IDs are valid

### Layout Issues

1. Ensure NativeAdListItem matches ArticleTeaser styling
2. Check responsive thumbnail sizing
3. Verify "Sponsored" badge positioning
4. Test on different screen sizes

## Performance Tips

1. **Limit Ad Count**: Don't show too many ads (3-5 per list is optimal)
2. **Strategic Positioning**: Place ads after engaging content
3. **Preload Wisely**: Enable preloading but monitor memory usage
4. **Skip Failed Ads**: Set `skipIfNotReady: true` to avoid blank spaces
5. **Cache Management**: Ads are automatically cached and destroyed

## Testing Checklist

- [ ] Ads appear at configured positions
- [ ] "Sponsored" badge is visible
- [ ] AdChoices icon works
- [ ] Ad clicks are tracked
- [ ] Loading states work correctly
- [ ] Failed ads are handled gracefully
- [ ] Multiple ads in same list work
- [ ] Section-based positioning works
- [ ] Ads match ArticleTeaser styling
- [ ] Performance is acceptable (60 FPS)

## Migration from Carousel-Only

If you currently only have carousel native ads:

1. Keep existing carousel config unchanged
2. Add new `listView` section to config
3. Add `adUnitIds` with both variants
4. Enable list view ads per view type
5. Test thoroughly before production

## Support

For issues or questions:

- Review full implementation plan: `docs/native-ad-listview-implementation-plan.md`
- Check Google AdMob documentation
- Review existing carousel implementation: `components/NativeAdCarouselItem.tsx`
- Contact development team

## Related Documentation

- [Full Implementation Plan](./native-ad-listview-implementation-plan.md)
- [Display Ads Implementation](./DISPLAY-ADS-LAZY-LOADING-IMPLEMENTATION-COMPLETE.md)
- [Brand Configuration Guide](./brand-fonts-guide.md)
