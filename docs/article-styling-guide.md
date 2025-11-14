# Article Detail Styling Guide

## 📋 Overview

This guide explains the new centralized styling system for article detail pages. The system provides a single source of truth for all article styling while maintaining brand-specific theming and preventing style overrides in recursive rendering.

## 🎯 Key Benefits

- ✅ **Single Source of Truth**: All layout styles in one file
- ✅ **Easy to Modify**: Change styles in one place, affects entire app
- ✅ **Brand-Aware**: Automatic color/font theming per brand
- ✅ **No Style Overrides**: Context-based provision prevents recursive override issues
- ✅ **Type-Safe**: Full TypeScript support with autocomplete

## 📐 Architecture

### Three-Layer System

```
1. ArticleStyles.ts (Layout Only)
   ↓
2. useArticleStyles() (Layout + Brand Theme)
   ↓
3. ArticleStyleContext (Provides to Component Tree)
```

### File Structure

```
styles/
└── ArticleStyles.ts          # Layout styles (sizes, spacing, margins)

hooks/
└── useArticleStyles.ts       # Merges layout + brand theme

contexts/
└── ArticleStyleContext.tsx   # Provides styles via context

app/article/
└── [id].tsx                  # Article page (uses provider)

components/
└── RichContentRenderer.tsx   # Content renderer (uses context)
```

## 🔧 How to Use

### 1. In Article Page

Wrap your article content with the provider:

```tsx
import { ArticleStyleProvider } from "@/contexts/ArticleStyleContext";

export default function ArticleScreen() {
  return (
    <ArticleStyleProvider>
      {/* Your article content here */}
      <ArticleHeader />
      <ArticleContent />
      <RichContentRenderer content={article.content} />
    </ArticleStyleProvider>
  );
}
```

### 2. In Any Child Component

Access styles using the context hook:

```tsx
import { useArticleStyleContext } from "@/contexts/ArticleStyleContext";

function MyComponent() {
  const styles = useArticleStyleContext();

  return (
    <View>
      <Text style={styles.h1}>Heading</Text>
      <Text style={styles.paragraph}>Body text</Text>
    </View>
  );
}
```

### 3. In Recursive Components

The context ensures styles remain consistent through recursion:

```tsx
function RichContentNode({ node }) {
  const styles = useArticleStyleContext();

  // Styles won't be overridden by children
  return (
    <Text style={styles.paragraph}>
      {node.children?.map((child) => (
        <RichContentNode node={child} /> // Recursion is safe!
      ))}
    </Text>
  );
}
```

## 📝 Modifying Styles

### To Change Layout (sizes, spacing, margins)

Edit `styles/ArticleStyles.ts`:

```typescript
// styles/ArticleStyles.ts
export const ArticleStyles = StyleSheet.create({
  h1: {
    fontSize: 28, // ← Change this
    lineHeight: 34, // ← Or this
    marginVertical: 16, // ← Or this
  },
});
```

### To Change Colors

Edit brand `config.json`:

```json
{
  "theme": {
    "colors": {
      "light": {
        "contentTitleText": "#00334C", // ← Change this
        "contentBodyText": "#011620", // ← Or this
        "highlightBoxBg": "#00334C" // ← Or this
      }
    }
  }
}
```

### To Change Fonts

Edit brand `config.json`:

```json
{
  "theme": {
    "fonts": {
      "primary": "OpenSans-Regular", // ← Change this
      "primaryBold": "OpenSans-Bold", // ← Or this
      "primaryItalic": "OpenSans-Italic" // ← Or this
    }
  }
}
```

## 🎨 Available Styles

### Typography

- `h1`, `h2`, `h3`, `h5` - Headings
- `paragraph` - Body paragraphs
- `inlineText` - Inline text
- `bold`, `italic`, `span` - Text formatting
- `leadText` - Lead paragraph
- `title`, `subtitle` - Article title/subtitle

### Content Elements

- `blockquote`, `blockquoteTitle`, `blockquoteText` - Blockquotes
- `factBox` - Fact boxes
- `list`, `listItem`, `bullet`, `listItemContent` - Lists
- `link` - Hyperlinks

### Images & Media

- `image`, `imageContainer` - Images
- `imageLeft`, `imageCenter`, `imageFullWidth` - Image alignment
- `imageCaption` - Image captions
- `gallery`, `galleryItem` - Image galleries
- `videoContainer`, `embedContainer` - Video/embeds

### Tables

- `table`, `tableContainer` - Table wrapper
- `tableRow`, `tableHeaderRow` - Table rows
- `tableCell`, `tableHeaderCell` - Table cells
- `tableCellText`, `tableHeaderText` - Table text

### Layout

- `container`, `scrollView`, `scrollContent` - Page layout
- `contentContainer` - Main content wrapper
- `headerContainer`, `headerImage` - Header section
- `metaContainer` - Metadata section

### Navigation

- `backButtonContainer`, `backButtonText` - Back button
- `shareButtonContainer` - Share button

## 🔍 Troubleshooting

### Problem: Styles not applying

**Solution**: Make sure you wrapped your component with `ArticleStyleProvider`:

```tsx
<ArticleStyleProvider>
  <YourComponent />
</ArticleStyleProvider>
```

### Problem: "useArticleStyleContext must be used within an ArticleStyleProvider"

**Solution**: The component using `useArticleStyleContext()` is not inside a provider. Move it inside or add the provider higher in the tree.

### Problem: Colors not changing per brand

**Solution**: Check that your brand's `config.json` has the color defined. If missing, it will use the fallback color from `constants/Colors.ts`.

### Problem: Styles being overridden in nested content

**Solution**: This shouldn't happen with the new system! If it does:

1. Verify you're using `useArticleStyleContext()` not `useArticleStyles()`
2. Check that you're not applying inline styles that override context styles
3. Ensure the provider wraps all content

## 🚀 Best Practices

### DO ✅

- Use `useArticleStyleContext()` in all article-related components
- Modify layout in `ArticleStyles.ts`
- Modify colors/fonts in brand `config.json`
- Keep the provider at the top level of your article page

### DON'T ❌

- Don't add colors or fonts to `ArticleStyles.ts`
- Don't use inline styles that override context styles
- Don't call `useArticleStyles()` directly in components (use context instead)
- Don't create duplicate style definitions

## 📊 Style Hierarchy

```
ArticleStyleProvider (Top Level)
  ↓
useArticleStyleContext() (In Components)
  ↓
Merged Styles (Layout + Brand Theme)
  ↓
Applied to Components
```

## 🔄 Migration from Old System

### Before (Old System)

```tsx
// Styles scattered across files
const styles = StyleSheet.create({
  h1: { fontSize: 28, color: '#000', fontFamily: 'Bold' }
});

// Inline overrides
<Text style={[styles.h1, { fontSize: 30 }]}>
```

### After (New System)

```tsx
// Single source of truth
const styles = useArticleStyleContext();

// No inline overrides needed
<Text style={styles.h1}>
```

## 📚 Related Files

- [`styles/ArticleStyles.ts`](../styles/ArticleStyles.ts) - Layout styles
- [`hooks/useArticleStyles.ts`](../hooks/useArticleStyles.ts) - Theme merger
- [`contexts/ArticleStyleContext.tsx`](../contexts/ArticleStyleContext.tsx) - Context provider
- [`constants/Colors.ts`](../constants/Colors.ts) - Color constants
- [`brands/*/config.json`](../brands/) - Brand configurations

## 💡 Examples

### Example 1: Simple Component

```tsx
import { useArticleStyleContext } from "@/contexts/ArticleStyleContext";

function ArticleTitle({ title }) {
  const styles = useArticleStyleContext();

  return <Text style={styles.title}>{title}</Text>;
}
```

### Example 2: Complex Component with Multiple Styles

```tsx
import { useArticleStyleContext } from "@/contexts/ArticleStyleContext";

function ArticleMetadata({ author, date }) {
  const styles = useArticleStyleContext();

  return (
    <View style={styles.metaContainer}>
      <Text style={styles.authorNameCompact}>{author}</Text>
      <Text style={styles.timestamp}>{date}</Text>
    </View>
  );
}
```

### Example 3: Recursive Content Rendering

```tsx
import { useArticleStyleContext } from "@/contexts/ArticleStyleContext";

function ContentNode({ node }) {
  const styles = useArticleStyleContext();

  switch (node.type) {
    case "h1":
      return <Text style={styles.h1}>{node.text}</Text>;
    case "p":
      return (
        <Text style={styles.paragraph}>
          {node.children?.map((child) => (
            <ContentNode key={child.id} node={child} />
          ))}
        </Text>
      );
    default:
      return null;
  }
}
```

## 🎓 Advanced Usage

### Accessing Colors Directly

```tsx
const styles = useArticleStyleContext();
const backgroundColor = styles.colors.contentBackground;
```

### Accessing Fonts Directly

```tsx
const styles = useArticleStyleContext();
const fontFamily = styles.fonts.primaryBold;
```

### Conditional Styling

```tsx
const styles = useArticleStyleContext();

<Text style={[
  styles.paragraph,
  isHighlighted && { backgroundColor: styles.colors.highlightBoxBg }
]}>
```

## 📞 Support

If you encounter issues or have questions:

1. Check this guide first
2. Review the troubleshooting section
3. Check the related files for implementation details
4. Consult the architecture plan in `docs/article-styling-refactor-plan.md`

---

**Last Updated**: 2024-11-14  
**Version**: 1.0.0
