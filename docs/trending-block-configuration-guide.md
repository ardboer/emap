# Trending Block Configuration Guide

## Overview

The trending block feature allows you to display a horizontal scrollable list of trending articles from the Miso API in the news tabs. This block can be positioned at any location within the news feed and can be enabled or disabled per brand.

## Configuration

### Brand Config Schema

Add the following configuration to your brand's `config.json` file:

```json
{
  "trendingBlockListView": {
    "enabled": true,
    "position": 1
  }
}
```

### Configuration Options

| Property   | Type    | Required | Description                                                                  |
| ---------- | ------- | -------- | ---------------------------------------------------------------------------- |
| `enabled`  | boolean | Yes      | Whether to display the trending block                                        |
| `position` | number  | Yes      | The position (index) where the trending block should appear in the news feed |

### Position Values

- `0` - Insert as the first block (before all other content)
- `1` - Insert as the second block (after the hero block)
- `2` - Insert as the third block
- `n` - Insert at position n

**Note:** If the position value exceeds the number of existing blocks, the trending block will be appended at the end.

## Behavior

### When Enabled

When `enabled: true` and a valid `position` is set:

- The trending block will fetch 5 trending articles from the Miso API
- Articles are displayed in a horizontal scrollable list
- Each article shows an image, category, and title
- The block includes a "Trending" header
- Articles are clickable and navigate to the article detail view

### When Disabled

When `enabled: false` or the configuration is not present:

- The trending block will not be displayed
- No API calls to Miso will be made for trending articles
- The news feed will display normally without the trending block

### When Position is Null/Undefined

If `position` is `null` or `undefined`:

- The trending block will not be displayed
- This is equivalent to setting `enabled: false`

## Implementation Details

### Components

- **TrendingBlockHorizontal**: Main component that fetches and displays trending articles
- Located at: `components/TrendingBlockHorizontal.tsx`

### Data Flow

1. Brand configuration is read from `config.json`
2. News tab checks for `trendingBlockListView` configuration
3. If enabled, a trending block section is injected at the specified position
4. The `TrendingBlockHorizontal` component fetches articles from Miso API
5. Articles are rendered in a horizontal scrollable list

### API Integration

The trending block uses the existing `fetchTrendingArticles` function from `services/api.ts`:

- Fetches 5 trending articles by default
- Respects user authentication state
- Uses brand-specific Miso configuration
- Implements caching for performance

## Examples

### Example 1: Enable at Position 1 (Default)

```json
{
  "trendingBlockListView": {
    "enabled": true,
    "position": 1
  }
}
```

This will display the trending block as the second block in the news feed, right after the hero article.

### Example 2: Enable at Position 0 (First)

```json
{
  "trendingBlockListView": {
    "enabled": true,
    "position": 0
  }
}
```

This will display the trending block as the very first block, before all other content.

### Example 3: Disable Trending Block

```json
{
  "trendingBlockListView": {
    "enabled": false,
    "position": 1
  }
}
```

Or simply omit the configuration entirely from `config.json`.

## Testing

### Test Cases

1. **Enabled with valid position**: Verify trending block appears at correct position
2. **Enabled with position 0**: Verify trending block appears first
3. **Enabled with position > block count**: Verify trending block appears at end
4. **Disabled**: Verify trending block does not appear
5. **Null/undefined position**: Verify trending block does not appear
6. **No configuration**: Verify trending block does not appear

### Manual Testing Steps

1. Update brand `config.json` with desired configuration
2. Restart the development server
3. Navigate to the News tab
4. Verify the trending block appears (or doesn't appear) as expected
5. Test scrolling through trending articles
6. Test clicking on trending articles

## Troubleshooting

### Trending Block Not Appearing

1. Check that `enabled: true` in config.json
2. Verify `position` is a valid number (not null/undefined)
3. Ensure Miso API is configured for the brand
4. Check console for any API errors
5. Verify the brand has trending articles available

### Trending Block in Wrong Position

1. Verify the `position` value in config.json
2. Remember that position is 0-indexed
3. Check that other blocks are loading correctly

### No Trending Articles Displayed

1. Check Miso API configuration in brand config
2. Verify Miso API is returning data (check console logs)
3. Ensure the brand filter matches Miso data
4. Check network connectivity

## Related Files

- `brands/index.ts` - BrandConfig type definition
- `app/(tabs)/news.tsx` - News tab implementation
- `components/TrendingBlockHorizontal.tsx` - Trending block component
- `services/api.ts` - API service with fetchTrendingArticles
- `brands/*/config.json` - Brand-specific configurations

## Migration Guide

If you have an existing brand and want to add the trending block:

1. Open your brand's `config.json` file
2. Add the `trendingBlockListView` configuration object
3. Set `enabled: true` and choose a `position`
4. Save the file and restart the development server
5. Test the implementation

## Best Practices

1. **Position Selection**: Position 1 (second block) is recommended for most brands
2. **Testing**: Always test with different content scenarios
3. **Performance**: The component includes loading states and error handling
4. **Caching**: Trending articles are cached to improve performance
5. **Fallback**: If Miso API fails, the block gracefully hides itself

## Future Enhancements

Potential future improvements:

- Configurable number of trending articles
- Custom block title
- Different layout options (vertical, grid)
- Refresh interval configuration
- Analytics tracking for trending article clicks
