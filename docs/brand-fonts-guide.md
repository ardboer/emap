# Brand-Specific Fonts Implementation Guide

## Overview

This guide explains how to implement and manage brand-specific fonts in the EMAP multi-brand application. Each brand can have its own custom fonts that are automatically applied throughout the app.

## Quick Start

### 1. Add Your Font Files

Place your font files (`.ttf` or `.otf`) in the `assets/fonts/` directory:

```
assets/fonts/
├── SpaceMono-Regular.ttf          # Default font (already exists)
├── YourFont-Regular.ttf           # Your custom font
├── YourFont-Bold.ttf              # Bold variant
└── AnotherFont-Regular.ttf        # Another brand's font
```

### 2. Run the Font Importer Script

```bash
node scripts/font-importer.js
```

This script will:

- Scan all fonts in `assets/fonts/`
- Show you the exact font names to use
- Display current brand configurations
- Provide configuration examples

### 3. Configure Brand Fonts

Edit each brand's config file to specify their font:

**Example: brands/brand-a/config.json:**

```json
{
  "fonts": {
    "primary": "YourFont",
    "secondary": "System"
  }
}
```

**Example: brands/brand-b/config.json:**

```json
{
  "fonts": {
    "primary": "AnotherFont",
    "secondary": "System"
  }
}
```

**Example: Using system font:**

```json
{
  "fonts": {
    "primary": "System",
    "secondary": "System"
  }
}
```

### 4. Restart Your Development Server

```bash
npm start -- --clear
```

The `--clear` flag ensures the font cache is cleared.

## How It Works

### Automatic Font Loading

**Fonts are automatically loaded!** The app uses a font loader utility ([`utils/fontLoader.ts`](../utils/fontLoader.ts)) that automatically imports all fonts from the `assets/fonts/` directory. No manual configuration needed in `app/_layout.tsx`!

### Automatic Font Application

The [`ThemedText`](../components/ThemedText.tsx) component automatically uses the brand's configured font. No changes needed in your component code!

```tsx
// This automatically uses the current brand's font
<ThemedText type="title">Welcome</ThemedText>
<ThemedText type="default">This text uses the brand font too</ThemedText>
```

### Font Loading Flow

1. **App Startup**: [`app/_layout.tsx`](../app/_layout.tsx) automatically loads all fonts from `assets/fonts/`
2. **Brand Selection**: User selects or app determines the active brand
3. **Font Retrieval**: [`useBrandConfig`](../hooks/useBrandConfig.ts) hook provides the brand's font configuration
4. **Font Application**: [`ThemedText`](../components/ThemedText.tsx) applies the font to all text

## Font File Requirements

### Supported Formats

- `.ttf` (TrueType Font) - Recommended
- `.otf` (OpenType Font)

### Font Licensing

Ensure you have the proper licenses to use fonts in your mobile application. Some fonts require commercial licenses for app distribution.

### Font Weights and Styles

If you need multiple weights or styles, add them all:

```
assets/fonts/
├── MyFont-Light.ttf
├── MyFont-Regular.ttf
├── MyFont-Medium.ttf
├── MyFont-Bold.ttf
└── MyFont-BoldItalic.ttf
```

All fonts will be automatically loaded and available for use.

## Brand Configuration Reference

### Font Configuration Structure

```typescript
interface BrandFonts {
  primary: string; // Main font used throughout the app
  secondary: string; // Optional secondary font (currently unused)
}
```

### Using System Fonts

To use the system default font, set the font to `"System"`:

```json
{
  "fonts": {
    "primary": "System",
    "secondary": "System"
  }
}
```

## Troubleshooting

### Font Not Loading

**Problem**: Font doesn't appear after configuration

**Solutions**:

1. Verify the font file exists in `assets/fonts/`
2. Check the font name matches exactly (case-sensitive)
3. Restart the development server with cache clear: `npm start -- --clear`
4. Run the font importer script to verify font names: `node scripts/font-importer.js`

### Font Name Mismatch

**Problem**: Error about font not found

**Solution**: Run the font importer script to get the exact font name:

```bash
node scripts/font-importer.js
```

The script shows a reference table with exact names to use.

### Font Not Switching Between Brands

**Problem**: Font stays the same when switching brands

**Solutions**:

1. Verify brand config files have different font values
2. Restart the app completely (not just refresh)
3. Clear app cache and restart

## Testing Fonts

### Visual Testing Checklist

Test fonts across:

- [ ] All text types (title, subtitle, default, etc.)
- [ ] Different screen sizes
- [ ] iOS and Android platforms
- [ ] Light and dark modes
- [ ] All brand configurations

### Test Script

```bash
# Run the font importer to verify configuration
node scripts/font-importer.js

# Start the app
npm start

# Test brand switching in the app
# Navigate to Settings > Switch Brand
```

## Font Importer Script Reference

### Running the Script

```bash
node scripts/font-importer.js
```

### Script Output

The script provides:

1. **Font Scan**: Lists all fonts found in `assets/fonts/`
2. **Font Families**: Groups fonts by family with weights/styles
3. **Automatic Loading Confirmation**: Confirms fonts are auto-loaded
4. **Brand Examples**: Sample configurations for each brand
5. **Current Brands**: Shows current font settings for all brands
6. **Font Reference Table**: Exact names to use in configs
7. **Quick Setup Guide**: Step-by-step instructions

## Adding a New Brand with Custom Font

1. Create brand directory: `brands/newbrand/`
2. Add brand config: `brands/newbrand/config.json`
3. Add font file: `assets/fonts/NewBrandFont.ttf`
4. Run font importer: `node scripts/font-importer.js`
5. Set font in brand config:
   ```json
   {
     "fonts": {
       "primary": "NewBrandFont"
     }
   }
   ```
6. Restart the app

## Best Practices

1. **Font File Naming**: Use descriptive names that include weight/style

   - Good: `MyFont-Bold.ttf`, `BrandFont-Regular.ttf`
   - Avoid: `font1.ttf`, `f.ttf`

2. **Automatic Loading**: Fonts are automatically loaded - just add them to `assets/fonts/`

3. **Fallback Fonts**: Always provide a fallback (System font)

4. **Testing**: Test fonts on real devices, not just simulators

5. **Performance**: Limit the number of font files to reduce app size

6. **Documentation**: Run the font importer script after adding new fonts

## Related Files

- [`scripts/font-importer.js`](../scripts/font-importer.js) - Font scanning and configuration tool
- [`utils/fontLoader.ts`](../utils/fontLoader.ts) - Automatic font loading utility
- [`app/_layout.tsx`](../app/_layout.tsx) - Uses automatic font loading
- [`components/ThemedText.tsx`](../components/ThemedText.tsx) - Text component with brand fonts
- [`hooks/useBrandConfig.ts`](../hooks/useBrandConfig.ts) - Brand configuration hook
- [`brands/*/config.json`](../brands/) - Brand-specific configurations

## Support

For issues or questions:

1. Run the font importer script for diagnostics
2. Check the troubleshooting section above
3. Review the related files for implementation details
