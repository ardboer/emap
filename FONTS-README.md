# Brand Fonts Quick Reference

## 🚀 Quick Start

### 1. Add Your Font Files

Place font files in `assets/fonts/`:

```bash
assets/fonts/
├── SpaceMono-Regular.ttf    # Default font (already exists)
├── YourFont-Regular.ttf      # Your custom font
└── AnotherFont-Bold.ttf      # Additional fonts
```

### 2. Run the Font Importer

```bash
node scripts/font-importer.js
```

This will **automatically**:

- ✅ Scan all fonts in `assets/fonts/`
- ✅ Update `utils/fontLoader.ts` with font imports
- ✅ Update `ios/emap/Info.plist` with font references
- ✅ Show exact font names for brand configs

### 3. Configure Brand Fonts

Edit any brand's config file (`brands/[brand-slug]/config.json`):

```json
{
  "fonts": {
    "primary": "YourFont",
    "secondary": "System"
  }
}
```

### 4. Rebuild and Restart

```bash
# For development
npm start -- --clear

# For iOS native build
npx expo run:ios
```

## ✅ That's It!

**Everything is automatic!** The font importer script:

- Imports fonts in `utils/fontLoader.ts`
- Links fonts in iOS `Info.plist`
- No manual Xcode configuration needed!

The [`ThemedText`](components/ThemedText.tsx) component automatically uses the brand's font.

```tsx
<ThemedText type="title">This uses the brand font</ThemedText>
```

## 📚 Full Documentation

For detailed information, troubleshooting, and advanced usage, see:

- [Brand Fonts Guide](docs/brand-fonts-guide.md) - Complete documentation
- [Font Importer Script](scripts/font-importer.js) - Automatic linking tool

## 🔧 Troubleshooting

**Font not loading?**

1. Run `node scripts/font-importer.js` to verify fonts are linked
2. Check that font file exists in `assets/fonts/`
3. Rebuild: `npx expo run:ios` (for iOS)
4. Restart with `npm start -- --clear`

**Font name mismatch?**

- Use the EXACT name shown by the font importer script
- Font names are case-sensitive

## 🎯 Key Files

- [`scripts/font-importer.js`](scripts/font-importer.js) - Automatic font linking tool
- [`utils/fontLoader.ts`](utils/fontLoader.ts) - Auto-generated font imports
- [`components/ThemedText.tsx`](components/ThemedText.tsx) - Text component with brand fonts
- [`app/_layout.tsx`](app/_layout.tsx) - Uses automatic font loading
- [`brands/*/config.json`](brands/) - Brand configurations
- [`ios/emap/Info.plist`](ios/emap/Info.plist) - iOS font references (auto-updated)
- [`docs/brand-fonts-guide.md`](docs/brand-fonts-guide.md) - Full documentation
