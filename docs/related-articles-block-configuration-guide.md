# Related Articles Block Configuration Guide

## Overview

The related articles block feature allows you to display a horizontal scrollable list of related articles from the Miso API within article detail views. This block can be positioned after any paragraph in the article content and can be enabled or disabled per brand.

## Configuration

### Brand Config Schema

Add the following configuration to your brand's `config.json` file:

```json
{
  "relatedArticlesBlock": {
    "enabled": true,
    "afterParagraph": 3
  }
}
```

### Configuration Options

| Property         | Type    | Required | Description                                                               |
| ---------------- | ------- | -------- | ------------------------------------------------------------------------- |
| `enabled`        | boolean | Yes      | Whether to display the related articles block                             |
| `afterParagraph` | number  | Yes      | The paragraph number after which the related articles block should appear |

### Paragraph Numbering

- `1` - Insert after the first paragraph
- `2` - Insert after the second paragraph
- `3` - Insert after the third paragraph (recommended)
- `n` - Insert after the nth paragraph

**Note:** If the `afterParagraph` value exceeds the total number of paragraphs in the article, the related articles block will not be displayed.

## Behavior

### When Enabled

When `enabled: true` and a valid `afterParagraph` is set:

- The related articles block will fetch 5 related articles from the Miso API based on the current article
- Articles are displayed in a horizontal scrollable list
- Each article shows an image, category, and title
- The block includes a "Related Articles" header
- Articles are clickable and navigate to the respective article detail view
- The block is injected seamlessly into the article content flow

### When Disabled

When `enabled: false` or the configuration is not present:

- The related articles block will not be displayed
- No API calls to Miso will be made for related articles
- The article content will display normally without the related articles block

### When afterParagraph is Null/Undefined

If `afterParagraph` is `null` or `undefined`:

- The related articles block will not be displayed
- This is equivalent to setting `enabled: false`

## Implementation Details

### Components

- **RelatedArticlesBlock**: Main component that fetches and displays related articles
  - Located at: `components/RelatedArticlesBlock.tsx`
- **RichContentRenderer**: Modified to inject the related articles block at the configured paragraph
  - Located at: `components/RichContentRenderer.tsx`

### Data Flow

1. Brand configuration is read from `config.json`
2. Article detail view passes the `articleId` to `RichContentRenderer`
3. `RichContentRenderer` checks for `relatedArticlesBlock` configuration
4. If enabled, the renderer counts paragraphs and injects the block after the specified paragraph
5. The `RelatedArticlesBlock` component fetches related articles from Miso API
6. Articles are rendered in a horizontal scrollable list

### API Integration

The related articles block uses the `fetchRelatedArticles` function from `services/api.ts`:

- Fetches 5 related articles by default
- Uses Miso's recommendation engine based on the current article
- Respects user authentication state
- Uses brand-specific Miso configuration
- Implements caching for performance

## Examples

### Example 1: Enable After 3rd Paragraph (Default/Recommended)

```json
{
  "relatedArticlesBlock": {
    "enabled": true,
    "afterParagraph": 3
  }
}
```

This will display the related articles block after the third paragraph in the article, which is typically after the introduction and before the main body content.

### Example 2: Enable After 1st Paragraph

```json
{
  "relatedArticlesBlock": {
    "enabled": true,
    "afterParagraph": 1
  }
}
```

This will display the related articles block very early in the article, right after the first paragraph.

### Example 3: Enable After 5th Paragraph

```json
{
  "relatedArticlesBlock": {
    "enabled": true,
    "afterParagraph": 5
  }
}
```

This will display the related articles block deeper into the article content, after the fifth paragraph.

### Example 4: Disable Related Articles Block

```json
{
  "relatedArticlesBlock": {
    "enabled": false,
    "afterParagraph": 3
  }
}
```

Or simply omit the configuration entirely from `config.json`.

## Integration with Trending Block

This feature works alongside the trending block feature for list views:

- **Trending Block** (`trendingBlockListView`): Displays trending articles in news list views
- **Related Articles Block** (`relatedArticlesBlock`): Displays related articles in article detail views

Both features can be configured independently and use the same Miso API infrastructure.

## Testing

### Test Cases

1. **Enabled with paragraph 1**: Verify block appears after first paragraph
2. **Enabled with paragraph 3**: Verify block appears after third paragraph
3. **Enabled with paragraph > article length**: Verify block does not appear
4. **Disabled**: Verify block does not appear
5. **Null/undefined afterParagraph**: Verify block does not appear
6. **No configuration**: Verify block does not appear
7. **Article with no paragraphs**: Verify block does not appear

### Manual Testing Steps

1. Update brand `config.json` with desired configuration
2. Restart the development server
3. Navigate to an article detail view
4. Scroll through the article content
5. Verify the related articles block appears (or doesn't appear) as expected
6. Test scrolling through related articles
7. Test clicking on related articles
8. Test with different article lengths

## Troubleshooting

### Related Articles Block Not Appearing

1. Check that `enabled: true` in config.json
2. Verify `afterParagraph` is a valid number (not null/undefined)
3. Ensure the article has enough paragraphs (afterParagraph ≤ total paragraphs)
4. Ensure Miso API is configured for the brand
5. Check console for any API errors
6. Verify the article has related articles available

### Related Articles Block in Wrong Position

1. Verify the `afterParagraph` value in config.json
2. Remember that paragraph counting starts at 1
3. Check that the article content is properly structured with paragraph elements
4. Inspect the article content structure in the console

### No Related Articles Displayed

1. Check Miso API configuration in brand config
2. Verify Miso API is returning data (check console logs)
3. Ensure the brand filter matches Miso data
4. Check network connectivity
5. Verify the current article has related content in Miso

### Block Appears Multiple Times

1. Ensure you're only passing `articleId` once to `RichContentRenderer`
2. Check that the configuration is not duplicated
3. Verify the paragraph counting logic is working correctly

## Related Files

- `brands/index.ts` - BrandConfig type definition
- `components/RelatedArticlesBlock.tsx` - Related articles block component
- `components/RichContentRenderer.tsx` - Content renderer with injection logic
- `app/article/[id].tsx` - Article detail view
- `services/api.ts` - API service with fetchRelatedArticles
- `brands/*/config.json` - Brand-specific configurations

## Migration Guide

If you have an existing brand and want to add the related articles block:

1. Open your brand's `config.json` file
2. Add the `relatedArticlesBlock` configuration object
3. Set `enabled: true` and choose an `afterParagraph` value (3 is recommended)
4. Save the file and restart the development server
5. Test the implementation with various articles

## Best Practices

1. **Paragraph Selection**: Position 3 (after third paragraph) is recommended for most brands

   - Provides context before showing related content
   - Doesn't interrupt the reading flow too early
   - Engages readers before they finish the article

2. **Testing**: Always test with articles of varying lengths

   - Short articles (1-2 paragraphs)
   - Medium articles (3-5 paragraphs)
   - Long articles (10+ paragraphs)

3. **Performance**: The component includes loading states and error handling

   - Related articles are cached to improve performance
   - Failed API calls gracefully hide the block

4. **User Experience**:

   - The block is visually distinct with a clear header
   - Horizontal scrolling provides a good mobile experience
   - Clicking articles navigates smoothly to new content

5. **Analytics**: Consider tracking related article clicks to measure engagement

## Comparison with List View Trending Block

| Feature           | Related Articles Block          | Trending Block              |
| ----------------- | ------------------------------- | --------------------------- |
| **Location**      | Article detail view             | News list view              |
| **Content**       | Related articles (personalized) | Trending articles (popular) |
| **Position**      | After specific paragraph        | At specific block index     |
| **Config Key**    | `relatedArticlesBlock`          | `trendingBlockListView`     |
| **Position Type** | Paragraph number                | Block index                 |
| **API**           | `fetchRelatedArticles`          | `fetchTrendingArticles`     |

## Future Enhancements

Potential future improvements:

- Configurable number of related articles
- Custom block title
- Different layout options (vertical, grid)
- Multiple injection points in a single article
- A/B testing different positions
- Analytics tracking for related article engagement
- Fallback to trending articles if no related articles found

## Support

For issues or questions:

1. Check the console logs for detailed error messages
2. Verify your Miso API configuration
3. Test with the provided curl commands in the console
4. Review the implementation in the related files listed above
