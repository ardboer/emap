# Article Styling Refactor - Complete Summary

## Problem Statement

The original article detail page styling was difficult to manage because:

1. **Scattered Styles**: Styles were split between `[id].tsx` and `RichContentRenderer.tsx`
2. **Hard to Modify**: Changing styles required hunting through multiple files
3. **Recursive Override Issues**: RichContentRenderer's recursive rendering caused style props to override each other
4. **Coupled Concerns**: Layout styles were mixed with brand-specific colors and fonts
5. **leadText Styling Issue**: Changing `inlineText` fontSize also affected `leadText` because structured leadText was rendered through RichContentRenderer using the same text style

## Solution Architecture

### 1. Centralized Style System

Created a three-layer architecture:

```
┌─────────────────────────────────────┐
│   ArticleStyles.ts                  │
│   (Layout only: sizes, spacing)     │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   useArticleStyles.ts               │
│   (Merges layout + brand theme)     │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   ArticleStyleContext.tsx           │
│   (Provides styles via Context)     │
└─────────────────────────────────────┘
```

### 2. Key Components

#### **styles/ArticleStyles.ts** (619 lines)

- Single source of truth for ALL layout styles
- Contains only sizes, spacing, margins, padding
- NO colors or fonts (those come from brand config)
- Organized into logical sections:
  - Page layout
  - Header styles
  - Navigation
  - Metadata
  - Typography (h1, h2, h3, paragraph, leadText, inlineText)
  - Rich content elements (blockquotes, lists, tables, images)

#### **hooks/useArticleStyles.ts** (331 lines)

- Merges `ArticleStyles` with brand-specific colors and fonts
- Returns complete themed styles object
- Memoized for performance
- Type-safe with `ThemedArticleStyles` interface

#### **contexts/ArticleStyleContext.tsx** (99 lines)

- React Context provider that wraps article pages
- Prevents style overrides in recursive rendering
- Provides `useArticleStyleContext()` hook
- Throws clear error if used outside provider

### 3. Text Style Override Feature

Added `textStyleOverride` prop to `RichContentRenderer` to solve the leadText styling issue:

```typescript
interface RichContentRendererProps {
  content: StructuredContentNode[];
  style?: any;
  articleId?: string;
  textStyleOverride?: "leadText" | "paragraph" | "inlineText";
}
```

**How it works:**

1. When rendering structured leadText, pass `textStyleOverride="leadText"`
2. RichContentRenderer uses this style for all text nodes instead of `inlineText`
3. Now you can independently style leadText and inlineText by changing their fontSize in `ArticleStyles.ts`

**Usage in article page:**

```tsx
<RichContentRenderer
  content={article.leadText as StructuredContentNode[]}
  style={styles.leadText}
  articleId={id}
  textStyleOverride="leadText" // ← This makes leadText independently styleable
/>
```

## Files Modified

### Created Files

1. `styles/ArticleStyles.ts` - Centralized layout styles
2. `hooks/useArticleStyles.ts` - Theme-aware style merging
3. `contexts/ArticleStyleContext.tsx` - Context provider
4. `docs/article-styling-guide.md` - Usage documentation

### Refactored Files

1. `app/article/[id].tsx` - Now uses ArticleStyleProvider and context
2. `components/RichContentRenderer.tsx` - Uses context styles, added textStyleOverride

## How to Style the Article Detail Page

### Quick Start

**To change any article style:**

1. Open `styles/ArticleStyles.ts`
2. Find the style you want to change (e.g., `leadText`, `h1`, `paragraph`)
3. Modify the fontSize, lineHeight, margins, etc.
4. Save - changes apply immediately!

**Example: Change leadText font size**

```typescript
// In styles/ArticleStyles.ts
leadText: {
  fontSize: 20,        // ← Change this
  lineHeight: 28,      // ← And this
  marginBottom: 24,
  fontWeight: "600",
},
```

**Example: Change paragraph spacing**

```typescript
// In styles/ArticleStyles.ts
paragraph: {
  fontSize: 16,
  lineHeight: 24,
  marginBottom: 20,    // ← Change this
},
```

### Style Independence

Each text style is now completely independent:

- **leadText**: Controls structured lead text (when it's an array)
- **inlineText**: Controls inline text within rich content
- **paragraph**: Controls paragraph text
- **h1, h2, h3, h5**: Control heading styles

Changing one does NOT affect the others!

### Brand-Specific Styling

Colors and fonts come from brand config (`brands/[brand]/config.json`):

```json
{
  "theme": {
    "fonts": {
      "primary": "OpenSans-Regular",
      "primaryBold": "OpenSans-Bold",
      "primarySemiBold": "OpenSans-SemiBold"
    },
    "colors": {
      "contentTitleText": "#1a1a1a",
      "contentBodyText": "#333333",
      "linkColor": "#007AFF"
    }
  }
}
```

## Benefits

### ✅ Easy to Style

- Single file (`ArticleStyles.ts`) for all layout changes
- Clear, organized structure
- No hunting through multiple files

### ✅ Independent Text Styles

- leadText, inlineText, and paragraph are completely independent
- Change one without affecting others
- textStyleOverride feature enables this

### ✅ No Recursive Override Issues

- Context-based style provision prevents overrides
- Styles remain consistent throughout recursive rendering

### ✅ Separation of Concerns

- Layout (ArticleStyles.ts) separate from theming (brand config)
- Easy to maintain and update

### ✅ Type Safety

- Full TypeScript support
- Clear error messages if context is missing

### ✅ Performance

- Memoized style merging
- Context prevents unnecessary re-renders

## Migration Notes

### Old Way (DON'T DO THIS)

```tsx
// Styles scattered across files
const styles = StyleSheet.create({
  leadText: { fontSize: 18 },
  // ... 200+ lines of styles
});

// Passed as props (gets overridden in recursion)
<RichContentRenderer styles={styles} />;
```

### New Way (DO THIS)

```tsx
// Wrap with provider
export default function ArticleScreen() {
  return (
    <ArticleStyleProvider>
      <ArticleScreenContent />
    </ArticleStyleProvider>
  );
}

// Use context hook
function ArticleScreenContent() {
  const styles = useArticleStyleContext();

  return (
    <RichContentRenderer
      content={article.leadText}
      textStyleOverride="leadText" // For independent styling
    />
  );
}
```

## Testing Checklist

- [ ] Test leadText fontSize changes independently from inlineText
- [ ] Test paragraph spacing changes
- [ ] Test heading styles (h1, h2, h3)
- [ ] Test blockquote styling
- [ ] Test list styling
- [ ] Test table styling
- [ ] Test image caption styling
- [ ] Test across different brands (JNL, CN, etc.)
- [ ] Test in light and dark modes
- [ ] Test on different screen sizes (phone, tablet)

## Common Tasks

### Change Lead Text Size

```typescript
// styles/ArticleStyles.ts
leadText: {
  fontSize: 20,  // ← Change this
  lineHeight: 28,
}
```

### Change Paragraph Spacing

```typescript
// styles/ArticleStyles.ts
paragraph: {
  marginBottom: 20,  // ← Change this
}
```

### Change Heading Sizes

```typescript
// styles/ArticleStyles.ts
h1: {
  fontSize: 32,  // ← Change this
  marginVertical: 20,
}
```

### Change Blockquote Styling

```typescript
// styles/ArticleStyles.ts
blockquote: {
  paddingVertical: 20,  // ← Change this
  paddingHorizontal: 16,
  marginVertical: 20,
}
```

## Troubleshooting

### Issue: Styles not applying

**Solution**: Make sure the component is wrapped with `ArticleStyleProvider`

### Issue: TypeScript error "Cannot find name 'styles'"

**Solution**: Use `const styles = useArticleStyleContext()` hook

### Issue: leadText and inlineText have same size

**Solution**: Make sure you're passing `textStyleOverride="leadText"` to RichContentRenderer

### Issue: Colors not changing

**Solution**: Colors come from brand config, not ArticleStyles.ts. Check `brands/[brand]/config.json`

## Future Enhancements

Possible improvements:

1. Add more textStyleOverride options (e.g., "caption", "quote")
2. Create style presets for different article types
3. Add responsive breakpoints for tablet/desktop
4. Create visual style editor tool

## Related Documentation

- [Article Styling Guide](./article-styling-guide.md) - Detailed usage guide
- [Brand Fonts Guide](./brand-fonts-guide.md) - Font configuration
- [Brand Safeguards Guide](./brand-safeguards-guide.md) - Brand switching

## Summary

The article styling refactor successfully addresses all the original pain points:

✅ **Centralized**: All styles in one place (`ArticleStyles.ts`)  
✅ **Easy to Modify**: Change styles in seconds, not minutes  
✅ **No Overrides**: Context prevents recursive override issues  
✅ **Separated Concerns**: Layout separate from theming  
✅ **Independent Styles**: leadText, inlineText, paragraph are independent  
✅ **Type Safe**: Full TypeScript support  
✅ **Well Documented**: Comprehensive guides and examples

**Result**: Styling the article detail page is now straightforward and maintainable!
