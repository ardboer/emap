# Link Interception Implementation

## Overview

This document describes the link interception system implemented to enable seamless in-app navigation for domain links without requiring server-side `.well-known` configuration (Universal Links/App Links).

## Problem Statement

When users click on links to your app's domain (e.g., `https://nursingtimes.net/article/123`) within the app:

- **Without `.well-known` files**: Links open in the browser instead of staying in the app
- **With `.well-known` files**: Links seamlessly open in the app (Universal Links/App Links)

Since setting up `.well-known` files requires server-side configuration, we've implemented a client-side workaround that intercepts domain links and converts them to custom scheme URLs.

## Solution

### Architecture

The solution consists of three main components:

1. **Link Interceptor Utility** (`utils/linkInterceptor.ts`)

   - Core logic for detecting and converting domain links
   - Handles link presses in React Native components
   - Generates JavaScript for WebView link interception

2. **React Native Component Integration**

   - `RichContentRenderer.tsx`: Intercepts links in article content
   - Updates all link press handlers to use the interceptor

3. **WebView Integration**
   - `ExploreModuleWebView.tsx`: Intercepts links in explore module
   - `app/(tabs)/ask.tsx`: Intercepts links in Ask feature
   - Injects JavaScript to capture link clicks and send them to React Native

### How It Works

#### For React Native Components (RichContentRenderer)

```typescript
// 1. Get configuration from brand config
const linkInterceptorConfig = getLinkInterceptorConfig(brandConfig);

// 2. Handle link press
const handleLinkPressInternal = (url: string) => {
  handleLinkPress(url, linkInterceptorConfig);
};

// 3. Link interceptor checks if URL matches configured domains
// If yes: Convert https://nursingtimes.net/article/123 → nt://article/123
// If no: Open in browser normally
```

#### For WebViews (Ask, Explore)

```typescript
// 1. Generate JavaScript interceptor code
const linkInterceptorJS = createWebViewLinkInterceptor(domains);

// 2. Inject into WebView
injectedJavaScript={`
  ${linkInterceptorJS}
  true;
`}

// 3. Listen for messages from WebView
onMessage={(event) => {
  const data = JSON.parse(event.nativeEvent.data);
  if (data.type === "linkPress") {
    handleLinkPress(data.url, linkInterceptorConfig);
  }
}}
```

The injected JavaScript:

- Listens for all link clicks in the WebView
- Checks if the link matches configured domains
- Prevents default browser behavior
- Sends message to React Native with the URL
- React Native handles the link using the same interceptor logic

## Configuration

The link interceptor automatically reads configuration from your brand config:

```json
{
  "domain": "nursingtimes.net",
  "shortcode": "nt"
}
```

This generates:

- **Domains to intercept**: `["nursingtimes.net", "www.nursingtimes.net"]`
- **Custom scheme**: `nt://`

## Files Modified

### Created

- `utils/linkInterceptor.ts` - Core link interception utility

### Modified

- `components/RichContentRenderer.tsx` - Added link interception for article content
- `components/ExploreModuleWebView.tsx` - Added WebView link interception
- `app/(tabs)/ask.tsx` - Added WebView link interception for Ask feature

## Testing

### Manual Testing

#### 1. Test RichContentRenderer Links

1. Open an article with links to your domain
2. Click on a link (e.g., to another article)
3. **Expected**: App navigates to the article (doesn't open browser)
4. **Check logs**: Look for `🔗 Link pressed:` and `✅ Domain link detected`

#### 2. Test WebView Links (Ask Feature)

1. Navigate to the Ask tab
2. Perform a search that returns results with links
3. Click on a result link to your domain
4. **Expected**: App navigates to the article (doesn't open browser)
5. **Check logs**: Look for `🔗 Ask WebView: Link pressed in WebView:`

#### 3. Test WebView Links (Explore Module)

1. Open an article with an explore module
2. Click on a recommended article link
3. **Expected**: App navigates to the article (doesn't open browser)
4. **Check logs**: Look for `🔗 ExploreModuleWebView: Link pressed in WebView:`

#### 4. Test External Links

1. Find a link to an external domain (not your app's domain)
2. Click the link
3. **Expected**: Opens in browser normally
4. **Check logs**: Look for `🌐 External link, opening normally`

### Debug Logging

The implementation includes comprehensive logging:

```
🔗 Link pressed: https://nursingtimes.net/article/123
✅ Domain link detected, converting to custom scheme
🔄 Opening custom URL: nt://article/123
```

Or for external links:

```
🔗 Link pressed: https://external-site.com
🌐 External link, opening normally
```

### Testing Commands

```bash
# Test deep linking on iOS simulator
npm run test:deeplink:ios

# Test deep linking on Android
npm run test:deeplink:android
```

## Limitations

### Current Implementation

1. **Only works within the app**: Links clicked outside the app (emails, SMS, other apps) will still open in browser
2. **Requires app to be installed**: Obviously, the app must be installed for custom schemes to work
3. **Not SEO friendly**: Custom scheme URLs can't be indexed or shared effectively

### What This Doesn't Replace

This is a **temporary workaround** until proper Universal Links/App Links are configured. It does NOT replace:

- Server-side `.well-known/apple-app-site-association` (iOS)
- Server-side `.well-known/assetlinks.json` (Android)
- Proper domain verification

## Migration Path to Universal Links

When you're ready to implement proper Universal Links/App Links:

1. **Keep this implementation**: It serves as a fallback
2. **Add server-side files**:
   - `https://nursingtimes.net/.well-known/apple-app-site-association`
   - `https://nursingtimes.net/.well-known/assetlinks.json`
3. **Verify configuration** in `app.json`:
   - iOS: `associatedDomains` already configured
   - Android: `intentFilters` with `autoVerify: true` already configured
4. **Test both methods**: Universal Links should take precedence, custom scheme as fallback

## Troubleshooting

### Links Still Opening in Browser

1. **Check logs**: Ensure interceptor is being called
2. **Verify domain configuration**: Check brand config has correct domain
3. **Test custom scheme**: Try opening `nt://article/123` directly
4. **Check deep link handler**: Ensure `app/[...slug].tsx` is handling routes

### WebView Links Not Working

1. **Check JavaScript injection**: Look for `🔗 Link interceptor initialized` in logs
2. **Verify message handling**: Check `onMessage` handler is receiving messages
3. **Test in browser**: Open WebView URL in browser and check console
4. **Check domain matching**: Ensure WebView content uses correct domain

### Custom Scheme Not Opening

1. **Verify app.json**: Check `scheme` is set correctly
2. **Rebuild app**: Custom schemes require native rebuild
3. **Check iOS/Android config**: Ensure scheme is registered in native code
4. **Test with adb/xcrun**: Use platform tools to test scheme directly

## API Reference

### `handleLinkPress(url, config)`

Handles a link press with interception logic.

**Parameters:**

- `url` (string): The URL to open
- `config` (LinkInterceptorConfig): Configuration with domains and custom scheme

**Returns:** Promise<void>

### `getLinkInterceptorConfig(brandConfig)`

Extracts link interceptor configuration from brand config.

**Parameters:**

- `brandConfig` (object): Brand configuration object

**Returns:** LinkInterceptorConfig

### `createWebViewLinkInterceptor(domains)`

Generates JavaScript code for WebView link interception.

**Parameters:**

- `domains` (string[]): Array of domains to intercept

**Returns:** string (JavaScript code)

### `isDomainLink(url, domains)`

Checks if a URL belongs to one of the configured domains.

**Parameters:**

- `url` (string): URL to check
- `domains` (string[]): Array of domains

**Returns:** boolean

### `convertToCustomScheme(url, customScheme)`

Converts an HTTPS URL to a custom scheme URL.

**Parameters:**

- `url` (string): HTTPS URL to convert
- `customScheme` (string): Custom scheme (e.g., "nt")

**Returns:** string (custom scheme URL)

## Performance Considerations

- **Minimal overhead**: Link interception adds negligible performance impact
- **WebView injection**: JavaScript is injected once on load, not per-click
- **No network requests**: All processing happens client-side
- **Efficient domain matching**: Uses simple string comparison

## Security Considerations

- **Domain validation**: Only configured domains are intercepted
- **No data leakage**: External links open normally in browser
- **XSS protection**: WebView JavaScript is generated, not user-provided
- **Scheme validation**: Custom scheme URLs are validated before opening

## Future Improvements

1. **Add analytics**: Track intercepted vs. external links
2. **Configurable behavior**: Allow per-domain interception rules
3. **Deep link parameters**: Preserve query parameters and fragments
4. **Error handling**: Better fallback for malformed URLs
5. **Testing utilities**: Automated tests for link interception

## Support

For issues or questions:

- Check logs for detailed error messages
- Review this documentation
- Test with provided testing commands
- Contact development team if issues persist
