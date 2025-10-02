# Search Icon Configuration Guide

## Overview

The search icon color in the news header can now be configured per brand to ensure optimal contrast against different header background colors. This feature allows each brand to define appropriate search icon colors for both light and dark modes.

## Configuration

### Brand Configuration Structure

Add the `searchIcon` property to both `light` and `dark` color schemes in your brand configuration file:

```json
{
  "theme": {
    "colors": {
      "light": {
        "primary": "#FFDD00",
        "background": "#fff",
        "text": "#11181C",
        "icon": "#687076",
        "tabIconDefault": "#687076",
        "tabIconSelected": "#FFDD00",
        "tabBarBackground": "#fff",
        "progressIndicator": "#FFDD00",
        "headerBackground": "#ffffff",
        "searchIcon": "#333333"
      },
      "dark": {
        "primary": "#FFDD00",
        "background": "#151718",
        "text": "#ECEDEE",
        "icon": "#9BA1A6",
        "tabIconDefault": "#9BA1A6",
        "tabIconSelected": "#FFDD00",
        "tabBarBackground": "#151718",
        "progressIndicator": "#FFDD00",
        "headerBackground": "#000000",
        "searchIcon": "#FFFFFF"
      }
    }
  }
}
```

### Current Brand Configurations

#### Construction News (CN)

- **Light Mode**: `#333333` (dark gray) - provides good contrast against white header background (`#ffffff`)
- **Dark Mode**: `#FFFFFF` (white) - provides good contrast against black header background (`#000000`)

#### Nursing Times (NT)

- **Light Mode**: `#FFFFFF` (white) - provides good contrast against dark blue header background (`#00334c`)
- **Dark Mode**: `#FFFFFF` (white) - provides good contrast against black header background (`#000000`)

## Implementation Details

### Files Modified

1. **Brand Configurations**:

   - `brands/cn/config.json` - Added searchIcon colors for Construction News
   - `brands/nt/config.json` - Added searchIcon colors for Nursing Times

2. **Type Definitions**:

   - `brands/index.ts` - Updated BrandConfig interface to include searchIcon property

3. **Color System**:

   - `constants/Colors.ts` - Added searchIcon mapping to Colors export

4. **UI Implementation**:
   - `app/(tabs)/_layout.tsx` - Updated all search icons to use brand-specific colors

### Technical Implementation

The search icon color is now dynamically determined using the following logic:

```typescript
const searchIconColor =
  themeColors?.searchIcon || Colors[colorScheme ?? "light"].searchIcon;
```

This ensures:

- Brand-specific colors are used when available
- Fallback to default colors if brand config is missing
- Automatic light/dark mode switching

## Color Contrast Guidelines

When configuring search icon colors, ensure adequate contrast ratios for accessibility:

- **Minimum contrast ratio**: 3:1 for UI components
- **Recommended contrast ratio**: 4.5:1 for better accessibility

### Testing Contrast

Use tools like:

- WebAIM Contrast Checker
- Chrome DevTools Accessibility panel
- Color Oracle for color blindness testing

## Usage in New Brands

When adding a new brand, include the `searchIcon` property in both light and dark color schemes:

1. Analyze the brand's header background colors
2. Choose search icon colors that provide sufficient contrast
3. Test in both light and dark modes
4. Verify accessibility compliance

## Fallback Behavior

If a brand configuration doesn't include the `searchIcon` property, the system will fall back to:

- Light mode: `#666666` (medium gray)
- Dark mode: `#9BA1A6` (light gray)

These fallback colors provide reasonable contrast on most header backgrounds but may not be optimal for all brands.

## Migration Guide

For existing brands without searchIcon configuration:

1. Add the `searchIcon` property to both light and dark color schemes
2. Choose colors based on your header background colors
3. Test the visual appearance and contrast
4. Update your brand configuration file

Example migration:

```diff
"light": {
  "primary": "#00AECA",
  "background": "#fff",
  "text": "#11181C",
  "icon": "#687076",
  "tabIconDefault": "#687076",
  "tabIconSelected": "#00AECA",
  "tabBarBackground": "#fff",
  "progressIndicator": "#00AECA",
- "headerBackground": "#00334c"
+ "headerBackground": "#00334c",
+ "searchIcon": "#FFFFFF"
}
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Ensure the BrandConfig interface includes the searchIcon property
2. **Color Not Applied**: Check that the brand configuration file is valid JSON
3. **Poor Contrast**: Test colors against actual header backgrounds in both modes

### Debugging

To debug search icon color issues:

1. Check browser developer tools for the applied color value
2. Verify brand configuration is loaded correctly
3. Test with different color schemes (light/dark)
4. Ensure fallback colors are working if brand config fails
