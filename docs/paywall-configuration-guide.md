# Paywall Configuration Guide

## Overview

The paywall configuration allows each brand to customize the subscription prompt shown to users when they encounter paywalled content. This configuration is stored in each brand's `config.json` file and is fully optional with sensible defaults.

## Configuration Structure

Add a `paywall` object to your brand's `config.json` file:

```json
{
  "paywall": {
    "headline": "Subscribe Today",
    "subheadline": "Get unlimited access to all articles",
    "benefits": [
      "6,000 peer reviewed clinical articles",
      "Latest news and expert analysis",
      "AI powered ASK Nursing Times tool",
      "Over 40 topics from anatomy to workforce"
    ],
    "primaryButtonText": "Subscribe Now",
    "primaryButtonUrl": "https://www.nursingtimes.net/subscribe",
    "secondaryButtonText": "Sign In",
    "secondaryButtonUrl": "https://www.nursingtimes.net/login"
  }
}
```

## Configuration Properties

### Required Properties

All properties are technically optional, but if you include the `paywall` object, these properties should be provided:

- **`headline`** (string): The main heading displayed at the top of the paywall

  - Example: `"Subscribe Today"`
  - Recommended: Keep it short and action-oriented

- **`subheadline`** (string): Supporting text below the headline

  - Example: `"Get unlimited access to all articles"`
  - Recommended: Clearly state the value proposition

- **`primaryButtonText`** (string): Text for the main call-to-action button

  - Example: `"Subscribe Now"`
  - This button triggers the subscription flow

- **`secondaryButtonText`** (string): Text for the secondary action button
  - Example: `"Sign In"`
  - This button is for existing subscribers to log in

### Optional Properties

- **`benefits`** (array of strings): List of benefits shown to users
  - If omitted or empty, the benefits section will not be displayed
  - Each string represents one benefit item with a checkmark
  - Recommended: 3-5 concise benefit statements

## Default Behavior

If no `paywall` configuration is provided in the brand config, the component will use these defaults:

```typescript
{
  headline: "Subscribe Today",
  subheadline: "Get unlimited access to all articles",
  benefits: [
    "6,000 peer reviewed clinical articles",
    "Latest news and expert analysis",
    "AI powered ASK Nursing Times tool",
    "Over 40 topics from anatomy to workforce"
  ],
  primaryButtonText: "Subscribe Now",
  secondaryButtonText: "Sign In"
  // Note: No URLs by default - will use callback props
}
```

## Conditional Rendering

### Benefits Section

The benefits list is conditionally rendered:

- If `benefits` is undefined, null, or an empty array, the entire benefits section is hidden
- This allows brands to show a simpler paywall without a benefits list if desired

## Examples

### Full Configuration (with benefits)

```json
{
  "paywall": {
    "headline": "Subscribe to Construction News",
    "subheadline": "Stay ahead with industry insights",
    "benefits": [
      "Breaking construction industry news",
      "Expert analysis and commentary",
      "Project updates and tenders",
      "Weekly digital magazine"
    ],
    "primaryButtonText": "Start Subscription",
    "primaryButtonUrl": "https://www.constructionnews.co.uk/subscribe",
    "secondaryButtonText": "Already a member? Sign In",
    "secondaryButtonUrl": "https://www.constructionnews.co.uk/login"
  }
}
```

### Minimal Configuration (without benefits)

```json
{
  "paywall": {
    "headline": "Premium Content",
    "subheadline": "Subscribe for full access",
    "primaryButtonText": "Subscribe",
    "primaryButtonUrl": "https://example.com/subscribe",
    "secondaryButtonText": "Sign In",
    "secondaryButtonUrl": "https://example.com/login"
  }
}
```

### No Configuration

Simply omit the `paywall` object entirely, and the default configuration will be used.

## TypeScript Interface

The paywall configuration is defined in `brands/index.ts`:

```typescript
interface BrandConfig {
  // ... other properties
  paywall?: {
    headline: string;
    subheadline: string;
    benefits?: string[];
    primaryButtonText: string;
    primaryButtonUrl?: string;
    secondaryButtonText: string;
    secondaryButtonUrl?: string;
  };
}
```

## Implementation Details

### Component Location

- **File**: `components/PaywallBottomSheet.tsx`
- **Hook**: Uses `useBrandConfig()` to access paywall configuration

### Accessing Configuration

The component accesses the paywall configuration through the brand config hook:

```typescript
const { paywall } = useBrandConfig();

const paywallConfig =
  paywall ||
  {
    // fallback defaults
  };
```

### Styling

The paywall uses the brand's primary color for:

- Checkmark backgrounds (in benefits list)
- Primary button background
- Secondary button border and text

This ensures the paywall matches each brand's visual identity.

## Testing

To test different paywall configurations:

1. Update the `paywall` object in your brand's `config.json`
2. Rebuild the app or restart the development server
3. Trigger the paywall by accessing premium content
4. Verify all text and benefits display correctly
5. Test button functionality (URLs or callbacks)

### Test Cases

- ✅ With full benefits list
- ✅ With empty benefits array (should hide benefits section)
- ✅ Without benefits property (should hide benefits section)
- ✅ Without paywall configuration (should use defaults)
- ✅ With custom button text
- ✅ With long headlines/subheadlines (test text wrapping)
- ✅ With button URLs configured (should open in browser)
- ✅ Without button URLs (should call callback props)
- ✅ Test URL opening on both iOS and Android

## Migration Notes

### From Hardcoded Values

Previously, all paywall text was hardcoded in the component. The migration:

1. ✅ Added `paywall` property to `BrandConfig` interface
2. ✅ Updated all brand config.json files with default values
3. ✅ Modified `PaywallBottomSheet.tsx` to read from configuration
4. ✅ Added `paywall` accessor to `useBrandConfig()` hook
5. ✅ Implemented conditional rendering for benefits
6. ✅ Fixed typo: "Subsribe" → "Subscribe"
7. ✅ Added URL configuration for buttons
8. ✅ Implemented smart button handlers (URL or callback)

### Backward Compatibility

The implementation is fully backward compatible:

- Brands without `paywall` configuration will use sensible defaults
- No breaking changes to existing functionality
- All existing paywall behavior is preserved

## URL Configuration Best Practices

### When to Use URLs

Use `primaryButtonUrl` and `secondaryButtonUrl` when:

- You have a web-based subscription flow
- You want to direct users to an external payment provider
- Your authentication is handled via web interface
- You need to track conversions through web analytics

### When to Use Callbacks

Use the callback props (`onSubscribe`, `onSignIn`) when:

- You have in-app subscription handling (e.g., Apple In-App Purchase)
- You want to show a native authentication flow
- You need to perform actions before navigation
- You want to keep users within the app

### Hybrid Approach

You can mix both approaches:

- Use URL for primary button (web subscription)
- Use callback for secondary button (in-app sign in)
- Or vice versa, depending on your needs

## Future Enhancements

Potential future additions to the paywall configuration:

- Custom colors (override brand primary color)
- Multiple subscription tiers with different benefits
- Promotional messaging or discount codes
- A/B testing variants
- Localization support for multiple languages
- Custom images or icons for benefits
- Deep linking support for post-authentication return
- Trial period messaging

## Related Files

- `brands/index.ts` - TypeScript interface definition
- `brands/*/config.json` - Brand-specific configurations
- `components/PaywallBottomSheet.tsx` - Paywall component implementation
- `hooks/useBrandConfig.ts` - Brand configuration hook
- `config/BrandManager.ts` - Brand management logic
