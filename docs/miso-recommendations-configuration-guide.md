# Miso Recommendations Configuration Guide

This guide explains how to configure the Miso API recommendation blocks in your brand's `config.json` file.

## Overview

The app integrates three types of Miso API recommendations:

1. **Trending Block (List View)** - Horizontal scrollable trending articles in news tabs
2. **Related Articles Block (Detail View)** - Horizontal scrollable related articles within article content
3. **Trending Articles (Detail View)** - Vertical list of trending articles below article detail

All three features are fully configurable per brand through the `config.json` file.

## Configuration Options

### 1. Trending Block List View

Displays a horizontal scrollable block of trending articles in the news tab list view.

```json
{
  "trendingBlockListView": {
    "enabled": true,
    "position": 1,
    "itemCount": 5
  }
}
```

**Properties:**

- `enabled` (boolean, required): Whether to show the trending block
- `position` (number, required): Position in the news list (0-based index, where 0 is first)
- `itemCount` (number, optional): Number of trending items to display (default: 5)

**API Used:** `user_to_trending` - Returns personalized trending articles based on user behavior

**Component:** `TrendingBlockHorizontal.tsx`

**Example:**

- `position: 0` - Shows trending block as the first item
- `position: 1` - Shows trending block as the second item (after first article)
- `position: 2` - Shows trending block as the third item (after two articles)

### 2. Related Articles Block

Displays a horizontal scrollable block of related articles within the article detail content.

```json
{
  "relatedArticlesBlock": {
    "enabled": true,
    "afterParagraph": 3,
    "itemCount": 5
  }
}
```

**Properties:**

- `enabled` (boolean, required): Whether to show the related articles block
- `afterParagraph` (number, required): Insert block after this paragraph number (1-based)
- `itemCount` (number, optional): Number of related articles to display (default: 5)

**API Used:** `product_to_products` - Returns articles related to the current article

**Component:** `RelatedArticlesBlock.tsx`

**Example:**

- `afterParagraph: 1` - Shows related articles after the first paragraph
- `afterParagraph: 3` - Shows related articles after the third paragraph
- `afterParagraph: 5` - Shows related articles after the fifth paragraph

### 3. Trending Articles Detail

Displays a vertical list of trending articles below the article detail content.

```json
{
  "trendingArticlesDetail": {
    "enabled": true,
    "itemCount": 5
  }
}
```

**Properties:**

- `enabled` (boolean, optional): Whether to show trending articles below article detail (default: true)
- `itemCount` (number, optional): Number of trending articles to display (default: 5)

**API Used:** `user_to_trending` - Returns personalized trending articles based on user behavior

**Component:** `TrendingArticles.tsx`

**Note:** If `enabled` is set to `false` or the configuration is omitted, the trending articles section will not be displayed.

## Complete Configuration Example

Here's a complete example showing all three recommendation blocks configured:

```json
{
  "shortcode": "nt",
  "name": "Nursing Times",
  "misoConfig": {
    "apiKey": "your-api-key",
    "publishableKey": "your-publishable-key",
    "brandFilter": "Nursing Times",
    "baseUrl": "https://api.askmiso.com/v1"
  },
  "trendingBlockListView": {
    "enabled": true,
    "position": 1,
    "itemCount": 5
  },
  "relatedArticlesBlock": {
    "enabled": true,
    "afterParagraph": 3,
    "itemCount": 5
  },
  "trendingArticlesDetail": {
    "enabled": true,
    "itemCount": 5
  }
}
```

## Disabling Features

To disable any of these features, set `enabled` to `false`:

```json
{
  "trendingBlockListView": {
    "enabled": false,
    "position": 1,
    "itemCount": 5
  },
  "relatedArticlesBlock": {
    "enabled": false,
    "afterParagraph": 3,
    "itemCount": 5
  },
  "trendingArticlesDetail": {
    "enabled": false,
    "itemCount": 5
  }
}
```

When disabled, the respective blocks will not be rendered in the app.

## Item Count Customization

You can customize the number of items displayed in each block:

```json
{
  "trendingBlockListView": {
    "enabled": true,
    "position": 1,
    "itemCount": 3
  },
  "relatedArticlesBlock": {
    "enabled": true,
    "afterParagraph": 3,
    "itemCount": 4
  },
  "trendingArticlesDetail": {
    "enabled": true,
    "itemCount": 6
  }
}
```

**Recommendations:**

- **Trending Block List View:** 3-7 items work well for horizontal scrolling
- **Related Articles Block:** 3-5 items provide good variety without overwhelming
- **Trending Articles Detail:** 5-10 items offer sufficient recommendations

## Authentication Handling

All three recommendation features automatically handle both authenticated and anonymous users:

- **Authenticated Users:** Uses `user_id` for personalized recommendations
- **Anonymous Users:** Uses `anonymous_id` (generated and stored locally)

The API calls are optimized to avoid unnecessary `getAnonymousId()` calls for authenticated users.

## Caching

All Miso API responses are cached for 5 minutes to improve performance and reduce API calls. The cache key includes:

- API endpoint
- User ID (or anonymous ID)
- Item count
- Article ID (for related articles)

## TypeScript Types

The configuration is type-safe through the `BrandConfig` interface in `brands/index.ts`:

```typescript
export interface BrandConfig {
  // ... other properties

  trendingBlockListView?: {
    enabled: boolean;
    position: number;
    itemCount?: number;
  };

  relatedArticlesBlock?: {
    enabled: boolean;
    afterParagraph: number;
    itemCount?: number;
  };

  trendingArticlesDetail?: {
    enabled: boolean;
    itemCount?: number;
  };
}
```

## Testing

To test the recommendations:

1. **Trending Block List View:**

   - Navigate to any news tab
   - Scroll to the configured position
   - Verify the horizontal scrollable trending block appears

2. **Related Articles Block:**

   - Open any article
   - Scroll to the configured paragraph
   - Verify the horizontal scrollable related articles block appears

3. **Trending Articles Detail:**
   - Open any article
   - Scroll to the bottom
   - Verify the vertical list of trending articles appears (if enabled)

## Troubleshooting

### Block Not Appearing

1. Check that `enabled` is set to `true`
2. Verify the Miso API credentials in `misoConfig`
3. Check the console for API errors
4. Ensure the position/paragraph number is valid

### Wrong Number of Items

1. Verify `itemCount` is set correctly in config.json
2. Check that the API is returning enough items
3. Review console logs for API response details

### Performance Issues

1. Verify caching is working (check console logs)
2. Consider reducing `itemCount` if loading is slow
3. Check network conditions and API response times

## Related Files

- **Configuration:** `brands/{brand}/config.json`
- **Type Definitions:** `brands/index.ts`
- **Components:**
  - `components/TrendingBlockHorizontal.tsx`
  - `components/RelatedArticlesBlock.tsx`
  - `components/TrendingArticles.tsx`
- **API Service:** `services/api.ts`
- **Miso Service:** `services/miso.ts`
- **Cache Service:** `services/cache.ts`

## API Endpoints Used

1. **user_to_trending:** `POST /v1/search/user_to_trending`

   - Used by: Trending Block List View, Trending Articles Detail
   - Returns: Personalized trending articles

2. **product_to_products:** `POST /v1/search/product_to_products`

   - Used by: Related Articles Block
   - Returns: Articles related to the current article

3. **user_to_products:** `POST /v1/search/user_to_products`
   - Used by: Swipe navigation (not configurable)
   - Returns: Personalized article recommendations

All endpoints support both authenticated and anonymous users.
