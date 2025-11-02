# Display Ads Configuration Guide

## Overview

The display ads system provides a flexible, brand-configurable way to show Google AdMob banner ads throughout the app. This system is **separate from native ads** (carousel ads) and allows each brand to control ad placement, frequency, and sizes independently.

## Key Features

- ✅ **Per-Brand Control**: Each brand configures ads independently via `config.json`
- ✅ **Flexible Positioning**: Multiple ad positions in article detail and list views
- ✅ **Max Limits**: Prevent ad overload with `maxAdsPerPage` settings
- ✅ **Interval Control**: Configure spacing between ads (paragraphs/blocks)
- ✅ **Size Flexibility**: Support for multiple Google AdMob ad sizes
- ✅ **Test Mode**: Easy testing with Google's test ad units
- ✅ **Platform-Specific**: Separate iOS/Android ad unit IDs

## Configuration Structure

### Location

Add the `displayAds` configuration to your brand's `config.json` file:

```
brands/[brand-shortcode]/config.json
```

### Complete Configuration Example

```json
{
  "displayAds": {
    "enabled": true,
    "testMode": true,
    "articleDetail": {
      "enabled": true,
      "maxAdsPerPage": 3,
      "paragraphInterval": 4,
      "allowedSizes": ["MEDIUM_RECTANGLE", "BANNER"],
      "positions": [
        {
          "type": "after_lead",
          "size": "MEDIUM_RECTANGLE",
          "enabled": true
        },
        {
          "type": "in_content",
          "size": "BANNER",
          "enabled": true,
          "afterParagraph": 4
        }
      ]
    },
    "listView": {
      "enabled": true,
      "maxAdsPerPage": 4,
      "blockInterval": 3,
      "allowedSizes": ["BANNER"],
      "positions": [
        {
          "type": "between_blocks",
          "size": "BANNER",
          "enabled": true,
          "afterBlock": 3
        }
      ]
    },
    "adUnitIds": {
      "ios": "ca-app-pub-3940256099942544/2934735716",
      "android": "ca-app-pub-3940256099942544/6300978111"
    }
  }
}
```

## Configuration Options

### Root Level

| Property        | Type    | Required | Description                                                 |
| --------------- | ------- | -------- | ----------------------------------------------------------- |
| `enabled`       | boolean | Yes      | Master switch for all display ads                           |
| `testMode`      | boolean | Yes      | Use Google test ad units (true) or production units (false) |
| `articleDetail` | object  | Yes      | Configuration for article detail pages                      |
| `listView`      | object  | Yes      | Configuration for list views                                |
| `adUnitIds`     | object  | Yes      | Platform-specific ad unit IDs                               |

### Article Detail Configuration

| Property            | Type     | Required | Description                                           |
| ------------------- | -------- | -------- | ----------------------------------------------------- |
| `enabled`           | boolean  | Yes      | Enable ads on article detail pages                    |
| `maxAdsPerPage`     | number   | Yes      | Maximum number of ads per article (prevents overload) |
| `paragraphInterval` | number   | Yes      | Minimum paragraphs between ads                        |
| `allowedSizes`      | string[] | Yes      | List of allowed ad sizes for this context             |
| `positions`         | array    | Yes      | Array of ad position configurations                   |

### List View Configuration

| Property        | Type     | Required | Description                               |
| --------------- | -------- | -------- | ----------------------------------------- |
| `enabled`       | boolean  | Yes      | Enable ads in list views                  |
| `maxAdsPerPage` | number   | Yes      | Maximum number of ads per list page       |
| `blockInterval` | number   | Yes      | Minimum blocks/items between ads          |
| `allowedSizes`  | string[] | Yes      | List of allowed ad sizes for this context |
| `positions`     | array    | Yes      | Array of ad position configurations       |

### Position Configuration

| Property         | Type    | Required    | Description                                                          |
| ---------------- | ------- | ----------- | -------------------------------------------------------------------- |
| `type`           | string  | Yes         | Position type: `"after_lead"`, `"in_content"`, or `"between_blocks"` |
| `size`           | string  | Yes         | Ad size (see Available Sizes below)                                  |
| `enabled`        | boolean | Yes         | Enable this specific position                                        |
| `afterParagraph` | number  | Conditional | Required for `"in_content"` type - paragraph number to start         |
| `afterBlock`     | number  | Conditional | Required for `"between_blocks"` type - block number to start         |

### Available Ad Sizes

| Size Name          | Dimensions | Best For                         |
| ------------------ | ---------- | -------------------------------- |
| `BANNER`           | 320x50     | Standard banner, minimal space   |
| `LARGE_BANNER`     | 320x100    | Larger banner, more visibility   |
| `MEDIUM_RECTANGLE` | 300x250    | High engagement, article content |
| `FULL_BANNER`      | 468x60     | Tablet landscape                 |
| `LEADERBOARD`      | 728x90     | Tablet landscape, top placement  |

## Position Types

### 1. `after_lead` (Article Detail Only)

Places an ad immediately after the article's lead text, before the main content.

```json
{
  "type": "after_lead",
  "size": "MEDIUM_RECTANGLE",
  "enabled": true
}
```

**Use Case**: High-visibility placement for premium ad inventory.

### 2. `in_content` (Article Detail Only)

Places ads within article content at specified paragraph intervals.

```json
{
  "type": "in_content",
  "size": "BANNER",
  "enabled": true,
  "afterParagraph": 4
}
```

**Behavior**:

- First ad appears after paragraph 4
- Subsequent ads appear every `paragraphInterval` paragraphs
- Respects `maxAdsPerPage` limit

### 3. `between_blocks` (List View Only)

Places ads between content blocks in list views.

```json
{
  "type": "between_blocks",
  "size": "BANNER",
  "enabled": true,
  "afterBlock": 3
}
```

**Behavior**:

- First ad appears after block 3
- Subsequent ads appear every `blockInterval` blocks
- Respects `maxAdsPerPage` limit

## Brand Strategy Examples

### Conservative Strategy (JNL)

Minimal ads, maximum user experience:

```json
{
  "displayAds": {
    "enabled": true,
    "testMode": true,
    "articleDetail": {
      "enabled": true,
      "maxAdsPerPage": 2,
      "paragraphInterval": 5,
      "allowedSizes": ["BANNER"],
      "positions": [
        {
          "type": "in_content",
          "size": "BANNER",
          "enabled": true,
          "afterParagraph": 5
        }
      ]
    },
    "listView": {
      "enabled": true,
      "maxAdsPerPage": 3,
      "blockInterval": 4,
      "allowedSizes": ["BANNER"],
      "positions": [
        {
          "type": "between_blocks",
          "size": "BANNER",
          "enabled": true,
          "afterBlock": 4
        }
      ]
    }
  }
}
```

### Balanced Strategy (NT)

Good balance between revenue and experience:

```json
{
  "displayAds": {
    "enabled": true,
    "testMode": true,
    "articleDetail": {
      "enabled": true,
      "maxAdsPerPage": 3,
      "paragraphInterval": 4,
      "allowedSizes": ["MEDIUM_RECTANGLE", "BANNER"],
      "positions": [
        {
          "type": "after_lead",
          "size": "MEDIUM_RECTANGLE",
          "enabled": true
        },
        {
          "type": "in_content",
          "size": "BANNER",
          "enabled": true,
          "afterParagraph": 4
        }
      ]
    },
    "listView": {
      "enabled": true,
      "maxAdsPerPage": 4,
      "blockInterval": 3,
      "allowedSizes": ["BANNER"],
      "positions": [
        {
          "type": "between_blocks",
          "size": "BANNER",
          "enabled": true,
          "afterBlock": 3
        }
      ]
    }
  }
}
```

### Aggressive Strategy (CN)

Maximum ad density for revenue optimization:

```json
{
  "displayAds": {
    "enabled": true,
    "testMode": true,
    "articleDetail": {
      "enabled": true,
      "maxAdsPerPage": 4,
      "paragraphInterval": 3,
      "allowedSizes": ["MEDIUM_RECTANGLE", "BANNER", "LARGE_BANNER"],
      "positions": [
        {
          "type": "after_lead",
          "size": "MEDIUM_RECTANGLE",
          "enabled": true
        },
        {
          "type": "in_content",
          "size": "BANNER",
          "enabled": true,
          "afterParagraph": 3
        }
      ]
    },
    "listView": {
      "enabled": true,
      "maxAdsPerPage": 5,
      "blockInterval": 2,
      "allowedSizes": ["BANNER", "LARGE_BANNER"],
      "positions": [
        {
          "type": "between_blocks",
          "size": "BANNER",
          "enabled": true,
          "afterBlock": 2
        }
      ]
    }
  }
}
```

## Ad Unit IDs

### Test Mode

When `testMode: true`, the system automatically uses Google's official test ad units:

- iOS: `ca-app-pub-3940256099942544/2934735716`
- Android: `ca-app-pub-3940256099942544/6300978111`

### Production Mode

When `testMode: false`, provide your brand's actual AdMob ad unit IDs:

```json
{
  "adUnitIds": {
    "ios": "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY",
    "android": "ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ"
  }
}
```

**Important**: Use a single ad unit ID per platform. Google AdMob serves appropriate creatives based on the requested ad size.

## Implementation Details

### Components

1. **DisplayAd Component** (`components/DisplayAd.tsx`)

   - Reusable wrapper for banner ads
   - Automatically uses brand configuration
   - Handles loading states and errors

2. **DisplayAdManager Service** (`services/displayAdManager.ts`)
   - Calculates ad positions based on configuration
   - Validates ad placement rules
   - Provides ad unit IDs

### Usage in Code

```typescript
import { DisplayAd } from '@/components/DisplayAd';

// In article detail
<DisplayAd
  context="article_detail"
  size="MEDIUM_RECTANGLE"
  onAdLoaded={() => console.log('Ad loaded')}
/>

// In list view
<DisplayAd
  context="list_view"
  size="BANNER"
/>
```

## Testing

### Enable Test Mode

Set `testMode: true` in your brand's config.json to use Google's test ads.

### Disable Ads Temporarily

Set `enabled: false` at the root level to disable all display ads:

```json
{
  "displayAds": {
    "enabled": false,
    ...
  }
}
```

### Disable Specific Contexts

Disable ads in specific contexts:

```json
{
  "displayAds": {
    "enabled": true,
    "articleDetail": {
      "enabled": false,  // Disable article ads
      ...
    },
    "listView": {
      "enabled": true,   // Keep list ads
      ...
    }
  }
}
```

## Best Practices

1. **Start Conservative**: Begin with fewer ads and increase based on metrics
2. **Test Thoroughly**: Use test mode extensively before production
3. **Monitor Performance**: Track ad load rates and user engagement
4. **Respect UX**: Don't overwhelm users with too many ads
5. **Size Appropriately**: Use MEDIUM_RECTANGLE for high-value placements
6. **Maintain Intervals**: Keep reasonable spacing between ads

## Relationship with Native Ads

Display ads (banner ads) and native ads (carousel ads) are **completely separate systems**:

- **Native Ads**: Full-screen carousel ads between articles in highlights

  - Configured via `nativeAds` in config.json
  - Uses different ad unit IDs
  - Different placement logic

- **Display Ads**: Banner ads within content and lists
  - Configured via `displayAds` in config.json
  - Uses separate ad unit IDs
  - Independent placement logic

Both can be enabled simultaneously without conflict.

## Troubleshooting

### Ads Not Showing

1. Check `enabled: true` at all levels
2. Verify `testMode: true` for testing
3. Ensure ad unit IDs are correct
4. Check console logs for errors
5. Verify content has enough paragraphs/blocks

### Too Many/Few Ads

Adjust these settings:

- `maxAdsPerPage`: Overall limit
- `paragraphInterval` / `blockInterval`: Spacing between ads
- `afterParagraph` / `afterBlock`: Starting position

### Wrong Ad Size

- Check `allowedSizes` array includes the size
- Verify size is appropriate for the context
- Consider device screen size

## Support

For issues or questions:

- Check console logs for detailed error messages
- Review brand configuration syntax
- Verify AdMob account setup
- Contact development team

## Version History

- **v1.0.0** (2025-01-02): Initial implementation
  - Support for article detail and list view ads
  - Per-brand configuration
  - Multiple ad sizes and positions
  - Test mode support
