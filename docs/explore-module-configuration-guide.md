# Explore Module Configuration Guide

## Overview

The explore module feature allows brands to embed an interactive webview after a specific paragraph in article detail pages. This module loads content from a configurable URL with dynamic parameters including article ID and optional user ID.

## Configuration

Add the `exploreModule` configuration to your brand's `config.json` file:

```json
{
  "exploreModule": {
    "enabled": true,
    "afterParagraph": 3,
    "showWhenNotLoggedIn": true,
    "height": 400
  }
}
```

### Configuration Parameters

| Parameter             | Type    | Required | Default | Description                                                                        |
| --------------------- | ------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `enabled`             | boolean | Yes      | -       | Master switch to enable/disable the feature for this brand                         |
| `afterParagraph`      | number  | Yes      | -       | Paragraph number after which to insert the webview (e.g., 3 = after 3rd paragraph) |
| `showWhenNotLoggedIn` | boolean | Yes      | -       | Whether to show the webview for non-authenticated users                            |
| `height`              | number  | No       | 400     | Height of the webview in pixels                                                    |

## URL Structure

The webview automatically loads content from:

```
{baseUrl}/explore-module/?hash={hash}&post_id={articleId}&user_id={userId}
```

### URL Parameters

- **baseUrl**: Automatically populated from `apiConfig.baseUrl` in brand config
- **hash**: Automatically populated from `apiConfig.hash` in brand config
- **post_id**: Current article ID being viewed
- **user_id**: Authenticated user ID (omitted if user is not logged in)

## Implementation Details

### Component Location

The explore module is implemented in:

- **Component**: [`components/ExploreModuleWebView.tsx`](../components/ExploreModuleWebView.tsx)
- **Integration**: [`components/RichContentRenderer.tsx`](../components/RichContentRenderer.tsx)

### Rendering Logic

1. The module counts paragraphs in the article content
2. When the specified paragraph number is reached, it injects the webview
3. The webview is rendered inline within the article content flow
4. Loading states and error handling are built-in

### Authentication Handling

- **Authenticated users**: The `user_id` parameter is included in the URL
- **Non-authenticated users**:
  - If `showWhenNotLoggedIn` is `true`: Webview is shown without `user_id` parameter
  - If `showWhenNotLoggedIn` is `false`: Webview is not shown at all

## Examples

### Example 1: Enabled for All Users

```json
{
  "exploreModule": {
    "enabled": true,
    "afterParagraph": 3,
    "showWhenNotLoggedIn": true,
    "height": 400
  }
}
```

This configuration:

- Shows the webview after the 3rd paragraph
- Displays for both authenticated and non-authenticated users
- Uses a height of 400 pixels

### Example 2: Authenticated Users Only

```json
{
  "exploreModule": {
    "enabled": true,
    "afterParagraph": 5,
    "showWhenNotLoggedIn": false,
    "height": 500
  }
}
```

This configuration:

- Shows the webview after the 5th paragraph
- Only displays for authenticated users
- Uses a height of 500 pixels

### Example 3: Disabled

```json
{
  "exploreModule": {
    "enabled": false,
    "afterParagraph": 3,
    "showWhenNotLoggedIn": true
  }
}
```

This configuration disables the feature entirely for the brand.

## Brand-Specific Configuration

### Nursing Times (NT)

```json
{
  "exploreModule": {
    "enabled": true,
    "afterParagraph": 3,
    "showWhenNotLoggedIn": true
  }
}
```

### Journal of Nursing Leadership (JNL)

```json
{
  "exploreModule": {
    "enabled": false,
    "afterParagraph": 3,
    "showWhenNotLoggedIn": true
  }
}
```

## Testing

### Test Scenarios

1. **Enabled State**

   - Set `enabled: true`
   - Navigate to an article detail page
   - Verify webview appears after the specified paragraph

2. **Disabled State**

   - Set `enabled: false`
   - Navigate to an article detail page
   - Verify webview does not appear

3. **Paragraph Position**

   - Test with different `afterParagraph` values (1, 3, 5, 10)
   - Verify webview appears at the correct position

4. **Authentication States**

   - **Authenticated**: Verify `user_id` parameter is included in URL
   - **Not Authenticated with `showWhenNotLoggedIn: true`**: Verify webview shows without `user_id`
   - **Not Authenticated with `showWhenNotLoggedIn: false`**: Verify webview is hidden

5. **URL Construction**

   - Check browser console logs for constructed URL
   - Verify all parameters are correctly populated

6. **Error Handling**

   - Test with invalid URL
   - Verify error message displays gracefully

7. **Loading States**
   - Observe loading indicator while webview loads
   - Verify it disappears when content is ready

## Troubleshooting

### Webview Not Appearing

1. Check `enabled` is set to `true`
2. Verify article has enough paragraphs (must have at least `afterParagraph` paragraphs)
3. Check authentication state matches `showWhenNotLoggedIn` setting
4. Review console logs for any errors

### Incorrect URL Parameters

1. Verify `apiConfig.baseUrl` is correctly set in brand config
2. Verify `apiConfig.hash` is correctly set in brand config
3. Check authentication state for `user_id` parameter

### Webview Loading Errors

1. Check network connectivity
2. Verify the explore module endpoint is accessible
3. Review browser console for specific error messages
4. Check CORS settings if loading from different domain

## Technical Notes

### Performance Considerations

- The webview is lazy-loaded when the paragraph is reached
- Only one explore module can be shown per article
- The module does not interfere with existing display ads
- Height automatically adjusts to content (no fixed height needed)
- Uses the same flexible height mechanism as the Ask webview

### Compatibility

- Works on both iOS and Android platforms
- Requires React Native WebView component
- Compatible with all article content types (structured and plain text)

### Security

- All URLs are constructed server-side using brand configuration
- User IDs are only included for authenticated users
- WebView has JavaScript enabled for interactive content

## Related Documentation

- [Brand Configuration Guide](./brand-fonts-guide.md)
- [Display Ads Configuration](./display-ads-configuration.md)
- [Article Detail Implementation](./article-detail-design-spec.md)
