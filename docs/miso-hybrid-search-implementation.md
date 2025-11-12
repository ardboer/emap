# Miso Hybrid Search Implementation

## Overview

This document describes the implementation of the Miso Hybrid Search feature, which allows brands to toggle between native search functionality and a web-based hybrid search experience powered by Miso AI.

## Feature Description

The Miso Hybrid Search feature provides:

- **Configurable Search Mode**: Brands can enable/disable hybrid search via configuration
- **WebView Integration**: When enabled, displays Miso's AI-powered search interface
- **Seamless Fallback**: When disabled, uses the existing native search functionality
- **Brand-Specific URLs**: Each brand can configure their own hybrid search endpoint

## Configuration

### Brand Config Structure

Add the following configuration to each brand's `config.json` file under the `misoConfig` section:

```json
{
  "misoConfig": {
    "apiKey": "...",
    "publishableKey": "...",
    "brandFilter": "...",
    "baseUrl": "...",
    "hybridSearch": {
      "enabled": true,
      "webViewUrl": "https://www.nursingtimes.net/mobile-app-ai-search/"
    }
  }
}
```

### Configuration Parameters

- **`enabled`** (boolean, required): Controls whether hybrid search is active
  - `true`: Shows the Miso hybrid search webview
  - `false`: Shows the native search component
- **`webViewUrl`** (string, required): The base URL for the Miso hybrid search page
  - The hash parameter will be automatically appended from `apiConfig.hash`
  - Example: `https://www.nursingtimes.net/mobile-app-ai-search/`

### Current Brand Configuration

| Brand                               | Hybrid Search Enabled | WebView URL                                                |
| ----------------------------------- | --------------------- | ---------------------------------------------------------- |
| Nursing Times (nt)                  | ✅ Yes                | `https://www.nursingtimes.net/mobile-app-ai-search/`       |
| Journal of Nursing Leadership (jnl) | ❌ No                 | `https://jnl.nursingtimes.net/mobile-app-ai-search/`       |
| Construction News (cn)              | ❌ No                 | `https://www.constructionnews.co.uk/mobile-app-ai-search/` |

## Implementation Details

### Files Modified

1. **`brands/index.ts`**

   - Updated `MisoConfig` interface to include optional `hybridSearch` configuration

2. **`brands/nt/config.json`**

   - Added `hybridSearch` configuration with `enabled: true`

3. **`brands/jnl/config.json`**

   - Added `hybridSearch` configuration with `enabled: false`

4. **`brands/cn/config.json`**
   - Added `hybridSearch` configuration with `enabled: false`

### Files Created

1. **`components/HybridSearchWebView.tsx`**

   - New component that renders the Miso hybrid search webview
   - Handles loading states and errors
   - Automatically constructs URL with hash parameter
   - Provides consistent header with close button

2. **`app/search.tsx`** (Modified)
   - Updated to conditionally render either:
     - `HybridSearchWebView` when hybrid search is enabled
     - `NativeSearchScreen` when hybrid search is disabled
   - Extracted native search logic into separate component

### Component Architecture

```
SearchScreen (app/search.tsx)
├── Checks brandConfig.misoConfig.hybridSearch.enabled
├── If enabled → HybridSearchWebView
│   ├── Constructs URL: {webViewUrl}?hash={apiConfig.hash}
│   ├── Renders WebView with loading indicator
│   └── Handles errors gracefully
└── If disabled → NativeSearchScreen
    ├── Native search input
    ├── WordPress API search
    └── Results list
```

### URL Construction

The hybrid search URL is constructed as follows:

```typescript
const webViewUrl = `${brandConfig.misoConfig.hybridSearch.webViewUrl}?hash=${brandConfig.apiConfig.hash}`;
```

Example for Nursing Times:

```
https://www.nursingtimes.net/mobile-app-ai-search/?hash=5506c4c9af9349c87a364b3b0b1988
```

## User Experience

### When Hybrid Search is Enabled

1. User taps the search icon in the app
2. Component fetches user info (if logged in)
3. Search modal opens showing the Miso hybrid search webview
4. Full-screen loading indicator displays while the page loads
5. WebView loads with hash and user_id parameters
6. User interacts with the AI-powered search interface
7. **When user clicks an article link:**
   - Link is intercepted if it matches the app's domain
   - Search modal automatically closes
   - Article opens in native article view
8. User can manually close the modal using the close button

### When Hybrid Search is Disabled

1. User taps the search icon in the app
2. Native search modal opens
3. User enters search query
4. Results are fetched from WordPress API
5. Results display in a native list view

## Testing

### Manual Testing Steps

1. **Test Hybrid Search (Nursing Times)**

   - Switch to Nursing Times brand
   - Tap search icon
   - Verify webview loads with Miso search interface
   - Verify URL includes correct hash parameter
   - Test search functionality within webview
   - Verify close button works

2. **Test Native Search (JNL/CN)**

   - Switch to JNL or CN brand
   - Tap search icon
   - Verify native search interface appears
   - Enter search query
   - Verify results display correctly
   - Verify close button works

3. **Test Configuration Toggle**
   - Change `enabled` flag in config.json
   - Restart app
   - Verify correct search interface displays

### Error Scenarios

The implementation handles these error cases:

1. **Missing Configuration**: Shows error message if `webViewUrl` is not configured
2. **WebView Load Failure**: Displays error in console, shows loading indicator
3. **Network Issues**: WebView handles network errors natively

## Analytics

Both search modes track analytics:

- **Hybrid Search**: Logs screen view as "Hybrid Search" / "HybridSearchWebView"
- **Native Search**: Logs screen view as "Search" / "SearchScreen"
- **Search Events**: Native search logs search queries and result counts

## Future Enhancements

Potential improvements for future iterations:

1. **Deep Linking**: Handle search result clicks from webview to navigate to native article views
2. **Search History**: Sync search history between native and hybrid modes
3. **Offline Support**: Cache recent searches or provide offline fallback
4. **A/B Testing**: Support for testing hybrid vs native search effectiveness
5. **Custom Styling**: Pass theme colors to webview for brand consistency
6. **Analytics Integration**: Enhanced tracking of webview interactions

## Maintenance

### Enabling Hybrid Search for a Brand

1. Open the brand's `config.json` file (e.g., `brands/jnl/config.json`)
2. Locate the `misoConfig` section
3. Update the `hybridSearch.enabled` value to `true`
4. Verify the `webViewUrl` is correct for the brand
5. Test the implementation

### Disabling Hybrid Search for a Brand

1. Open the brand's `config.json` file
2. Locate the `misoConfig.hybridSearch` section
3. Set `enabled` to `false`
4. Native search will be used automatically

### Updating the WebView URL

1. Open the brand's `config.json` file
2. Update the `misoConfig.hybridSearch.webViewUrl` value
3. Ensure the URL is accessible and properly configured on the backend
4. Test the new URL

## Technical Notes

- The hash parameter is automatically appended from `apiConfig.hash`
- The user_id parameter is automatically added if user is logged in
- User info is fetched using `getUserInfo()` from the auth service
- WebView uses JavaScript and DOM storage for full functionality
- Loading indicator covers full screen (top: 0, bottom: 0) for better UX
- Component follows existing app patterns (similar to Ask tab implementation)
- TypeScript types are properly defined in `brands/index.ts`
- URL construction is logged to console for debugging

### Link Interception

The component uses the same link interception system as the Ask tab:

1. **JavaScript Injection**: Injects link interceptor code into the webview
2. **Navigation Interception**: Uses `onShouldStartLoadWithRequest` to catch navigation
3. **Message Handling**: Listens for `linkPress` messages from injected JavaScript
4. **Domain Matching**: Checks if links match configured brand domains
5. **Modal Closure**: Automatically closes search modal when domain link is clicked
6. **Native Navigation**: Routes intercepted links to appropriate native screens

This ensures a seamless user experience where clicking search results opens articles natively while closing the search interface.

## Support

For issues or questions regarding this feature:

- Check the webview console logs for errors
- Verify the backend URL is accessible
- Ensure the hash parameter is valid
- Review analytics to confirm proper tracking

## Version History

- **v1.0.1** (2025-01-12): Enhanced implementation

  - Added user_id parameter support
  - Changed loading indicator to full-screen
  - Added user info fetching on component mount
  - Improved URL construction with user context

- **v1.0.0** (2025-01-12): Initial implementation
  - Added hybrid search configuration to brand configs
  - Created HybridSearchWebView component
  - Updated search.tsx to support conditional rendering
  - Enabled for Nursing Times brand
