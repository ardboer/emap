# FadeInImage Component Implementation Guide

## Overview

The `FadeInImage` component is a custom wrapper around `expo-image` that provides smooth fade-in animations when images load, creating a more polished user experience throughout the app.

## Features

✅ **Smooth 300ms fade-in animation** - Images gracefully appear instead of popping in  
✅ **Theme-aware placeholders** - Subtle gray background that matches light/dark mode  
✅ **Drop-in replacement** - Fully compatible with all `expo-image` props  
✅ **Configurable** - Optional props for customization  
✅ **Performant** - Leverages React Native's Animated API and expo-image optimizations

## Component Location

```
components/FadeInImage.tsx
```

## Usage

### Basic Usage

```tsx
import { FadeInImage } from "@/components/FadeInImage";

<FadeInImage
  source={{ uri: article.imageUrl }}
  style={styles.thumbnail}
  contentFit="cover"
/>;
```

### With Custom Props

```tsx
<FadeInImage
  source={{ uri: podcast.coverUrl }}
  style={styles.cover}
  contentFit="contain"
  fadeDuration={500} // Custom fade duration (default: 300ms)
  placeholderColor="#e0e0e0" // Custom placeholder color
  showPlaceholder={true} // Show/hide placeholder (default: true)
/>
```

## Props

| Prop                    | Type      | Default     | Description                                   |
| ----------------------- | --------- | ----------- | --------------------------------------------- |
| `fadeDuration`          | `number`  | `300`       | Duration of fade-in animation in milliseconds |
| `placeholderColor`      | `string`  | Theme-based | Custom placeholder background color           |
| `showPlaceholder`       | `boolean` | `true`      | Whether to show placeholder while loading     |
| ...all expo-image props | -         | -           | Fully supports all `expo-image` props         |

## Implementation Details

### Animation Flow

1. **Initial State**: Image starts with opacity 0
2. **Placeholder**: Theme-aware gray background shows while loading
3. **onLoad Event**: Triggers when image successfully loads
4. **Fade Animation**: Smoothly animates opacity from 0 to 1 over 300ms
5. **Final State**: Image fully visible, placeholder hidden

### Theme-Aware Placeholders

- **Light Mode**: `#f0f0f0` (subtle light gray)
- **Dark Mode**: `#2a2a2a` (subtle dark gray)
- Automatically switches based on device theme

## Files Updated

The following files have been migrated to use `FadeInImage`:

### Components (8 files)

- ✅ `components/ArticleTeaser.tsx`
- ✅ `components/ArticleTeaserHero.tsx`
- ✅ `components/PodcastPlayer.tsx`
- ✅ `components/MiniPlayer.tsx`
- ✅ `components/MagazineListItem.tsx`
- ✅ `components/RichContentRenderer.tsx`
- ✅ `components/ImageViewer.tsx`

### App Screens (4 files)

- ✅ `app/article/[id].tsx`
- ✅ `app/event/[id].tsx`
- ✅ `app/(tabs)/index.tsx`
- ✅ `app/(tabs)/podcasts.tsx`

**Total: 12 files updated**

## Migration Guide

### Before (using expo-image)

```tsx
import { Image } from "expo-image";

<Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />;
```

### After (using FadeInImage)

```tsx
import { FadeInImage } from "@/components/FadeInImage";

<FadeInImage
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
/>;
```

## Benefits

### User Experience

- **Smoother loading** - No harsh image pop-in
- **Professional feel** - Polished, app-store quality
- **Visual consistency** - All images load the same way

### Developer Experience

- **Reusable** - Single component for all images
- **Maintainable** - Centralized image loading logic
- **Flexible** - Easy to customize per use case

### Performance

- **Optimized** - Uses native driver for animations
- **Efficient** - Leverages expo-image's built-in optimizations
- **Lightweight** - Minimal overhead

## Testing Checklist

When testing the fade-in effect, verify:

- [ ] Article thumbnails (small images)
- [ ] Podcast covers (medium images)
- [ ] Hero images (large images)
- [ ] Light mode placeholder color
- [ ] Dark mode placeholder color
- [ ] Slow network simulation
- [ ] Error states
- [ ] Image viewer full-screen images

## Customization Examples

### Faster Fade for Small Images

```tsx
<FadeInImage
  source={{ uri: thumbnail }}
  style={styles.smallThumb}
  fadeDuration={200} // Faster for small images
/>
```

### Custom Placeholder Color

```tsx
<FadeInImage
  source={{ uri: brandImage }}
  style={styles.brandImage}
  placeholderColor="#your-brand-color"
/>
```

### No Placeholder

```tsx
<FadeInImage
  source={{ uri: transparentImage }}
  style={styles.icon}
  showPlaceholder={false} // For transparent images
/>
```

## Technical Notes

- Uses React Native's `Animated.Value` for smooth animations
- Placeholder uses `StyleSheet.absoluteFill` for proper layering
- Compatible with all `expo-image` features (caching, transitions, etc.)
- Automatically handles cleanup on unmount

## Future Enhancements

Potential improvements for future iterations:

- [ ] Blur-up effect (load low-res first, then high-res)
- [ ] Skeleton loader integration
- [ ] Dominant color extraction for placeholders
- [ ] Progressive image loading
- [ ] Retry logic for failed loads

## Support

For issues or questions about the FadeInImage component:

1. Check this documentation
2. Review the component source code
3. Test with different image types and sizes
4. Verify theme switching behavior

---

**Last Updated**: 2025-01-31  
**Component Version**: 1.0.0
