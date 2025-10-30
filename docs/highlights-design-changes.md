# Highlights Tab Design Changes

## Overview

This document compares the Figma design (node-id=14-256) with the current implementation of the Highlights tab ([`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>)) and lists all required design changes.

**Reference Figma Design:** https://www.figma.com/design/tH7b9yaAOOowz2w0t48INH/EMAP-Apps-library?node-id=14-256

**⚠️ IMPORTANT CONFIGURATION POLICY:**

- **Colors:** All colors must come from brand [`config.json`](../brands/jnl/config.json) files. Only white (`#FFFFFF`) and black (`#000000`) may be hardcoded for text.
- **Fonts:** All fonts must come from brand `config.json` files. No hardcoded font families in component code. Use generic, reusable font property names.

**Note:** Bottom navigation bar changes are excluded as requested - those will be addressed separately.

---

## Brand Config Requirements

### New Color Properties Needed

The following new color properties must be added to each brand's `config.json` under `theme.colors.light` and `theme.colors.dark`:

```json
{
  "theme": {
    "colors": {
      "light": {
        // ... existing colors ...
        "progressIndicator": "#00AECA", // Already exists
        "progressIndicatorBackground": "#00334C", // NEW - Dark blue for unfilled progress
        "progressIndicatorFill": "#10D1F0", // NEW - Cyan for filled progress
        "overlayGradientStart": "#011620", // NEW - Brand dark blue for gradients
        "overlayGradientEnd": "#011620" // NEW - Brand dark blue for gradients
      },
      "dark": {
        // ... same structure for dark mode ...
      }
    }
  }
}
```

### New Font Properties Needed

The following new font properties must be added to each brand's `config.json` under `theme.fonts`:

```json
{
  "theme": {
    "fonts": {
      "primary": "OpenSans-Regular", // Already exists
      "secondary": "OpenSans-Regular", // Already exists
      "primaryBold": "OpenSans-Bold", // NEW - Bold variant (700 weight) - reusable
      "primarySemiBold": "OpenSans-SemiBold", // NEW - SemiBold variant (600 weight) - reusable
      "primaryMedium": "OpenSans-Medium" // NEW - Medium variant (500 weight) - reusable (optional)
    }
  }
}
```

**Font Naming Convention:**

- Use **generic, reusable names** like `primaryBold`, `primarySemiBold`, not component-specific names
- These fonts can be used throughout the app, not just in highlights
- Benefits: Consistency, reusability, easier maintenance

**Font Usage in Highlights:**

- Title → `primaryBold` (700 weight)
- Subtitle → `primarySemiBold` (600 weight)
- Category → `primarySemiBold` (600 weight)

### Recommended Values by Brand

Based on Figma design and existing brand configurations:

#### Nursing Times (NT)

```json
{
  "theme": {
    "colors": {
      "light": {
        "progressIndicatorBackground": "#00334C",
        "progressIndicatorFill": "#10D1F0",
        "overlayGradientStart": "#011620",
        "overlayGradientEnd": "#011620"
      }
    },
    "fonts": {
      "primary": "OpenSans-Regular",
      "secondary": "OpenSans-Regular",
      "primaryBold": "OpenSans-Bold",
      "primarySemiBold": "OpenSans-SemiBold",
      "primaryMedium": "OpenSans-Medium"
    }
  }
}
```

#### Construction News (CN)

```json
{
  "theme": {
    "colors": {
      "light": {
        "progressIndicatorBackground": "#333333",
        "progressIndicatorFill": "#FFDD00", // Use brand yellow
        "overlayGradientStart": "#1a1a1a",
        "overlayGradientEnd": "#1a1a1a"
      }
    },
    "fonts": {
      "primary": "antenna-cond",
      "secondary": "antenna-cond",
      "primaryBold": "antenna-cond-bold",
      "primarySemiBold": "antenna-cond-semibold",
      "primaryMedium": "antenna-cond-medium"
    }
  }
}
```

#### Journal of Nursing Leadership (JNL)

```json
{
  "theme": {
    "colors": {
      "light": {
        "progressIndicatorBackground": "#4a2c1f",
        "progressIndicatorFill": "#df7446", // Use brand orange
        "overlayGradientStart": "#2a1810",
        "overlayGradientEnd": "#2a1810"
      }
    },
    "fonts": {
      "primary": "antenna-cond",
      "secondary": "antenna-cond",
      "primaryBold": "antenna-cond-bold",
      "primarySemiBold": "antenna-cond-semibold",
      "primaryMedium": "antenna-cond-medium"
    }
  }
}
```

---

## Current Implementation Analysis

### Current Features

- Full-screen carousel with horizontal swipe
- Auto-advancing slides with progress indicators
- Brand logo (top-left)
- User settings button (top-right)
- Article title and category overlay at bottom
- Gradient overlay for text readability
- Support for both portrait and landscape images
- Progress bars at the top showing slide progression

### Current Layout Structure

```
┌─────────────────────────────────┐
│ [Progress Bars]                 │ ← Top gradient overlay
│ [Logo]              [User Icon] │
│                                 │
│                                 │
│     [Full Screen Image]         │
│                                 │
│                                 │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Article Title               │ │ ← Bottom gradient overlay
│ │ Category                    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Figma Design Analysis

### Figma Design Structure

Based on the Figma data, the design shows:

1. **Top Navigation Area** (topnav - SVG gradient overlay)

   - Gradient: `linear-gradient(0deg, rgba(1, 22, 32, 0) 0%, rgba(1, 22, 32, 0.5) 33%)`
   - Contains logo and likely user controls

2. **Main Content Area**

   - Full-screen background image
   - Rectangle overlay with gradient: `linear-gradient(180deg, rgba(1, 22, 32, 0) 0%, rgba(1, 22, 32, 0.7) 33%)`

3. **Text Content Container** (Frame 19)

   - Two text elements with same content: "Mauris varius tortor est, suscipit viverra ex pharetra ut"
   - First text: Font size 24px, Bold (700), Line height 1.083em, **Open Sans**
   - Second text: Font size 16px, SemiBold (600), Line height 1.375em, **Open Sans**
   - Padding: 48px top, 16px bottom, 16px horizontal
   - Gap between texts: 16px

4. **Progress Indicators** (Frame 18, node-id=20-562)

   - Height: 4px
   - Width: 46px per indicator
   - Gap: 4px between bars
   - **Background (unfilled):** `#00334C` (dark blue) → Use `progressIndicatorBackground`
   - **Fill (progress):** `#10D1F0` (cyan/turquoise accent) → Use `progressIndicatorFill`
   - Layout: Row with stretch alignment

5. **Bottom Navigation Section** (section Main Nav)
   - Background: `#011620` (dark blue)
   - Contains 5 navigation items (excluded from this document)

---

## Design Changes Required

### 0. ✅ Brand Config Updates (PREREQUISITE)

**This must be done FIRST before implementing any visual changes.**

#### Changes Needed:

- [ ] Add `progressIndicatorBackground` to all brand configs (light & dark)
- [ ] Add `progressIndicatorFill` to all brand configs (light & dark)
- [ ] Add `overlayGradientStart` to all brand configs (light & dark)
- [ ] Add `overlayGradientEnd` to all brand configs (light & dark)
- [ ] Add `primaryBold` font to all brand configs
- [ ] Add `primarySemiBold` font to all brand configs
- [ ] Add `primaryMedium` font to all brand configs (optional but recommended)
- [ ] Update TypeScript types to include new color properties
- [ ] Update TypeScript types to include new font properties
- [ ] Test that brand switching works with new colors and fonts

#### Files to Update:

- [`brands/nt/config.json`](../brands/nt/config.json)
- [`brands/cn/config.json`](../brands/cn/config.json)
- [`brands/jnl/config.json`](../brands/jnl/config.json)
- Brand config TypeScript types (if they exist)

---

### 1. ✅ Typography Updates

#### Current Implementation

- Title: 28px, Bold, white
- Category: 14px, SemiBold (600), white with 0.8 opacity
- **Font:** Likely hardcoded or using generic font

#### Figma Design

- Title: 24px, Bold (700), white, line-height 1.083em (26px), **Open Sans**
- Subtitle/Lead: 16px, SemiBold (600), white, line-height 1.375em (22px), **Open Sans**

**Changes Needed:**

- [ ] Reduce title font size from 28px to 24px
- [ ] Update title line height to 26px (1.083em)
- [ ] Change subtitle/category to 16px (currently 14px)
- [ ] Update subtitle line height to 22px (1.375em)
- [ ] **Replace hardcoded fonts with `brandConfig.theme.fonts.primaryBold`** for title
- [ ] **Use `brandConfig.theme.fonts.primarySemiBold`** for subtitle
- [ ] **Use `brandConfig.theme.fonts.primarySemiBold`** for category
- [ ] Remove opacity from category text (use solid white `#FFFFFF`)

**Font Usage:**

- Title: `brandConfig.theme.fonts.primaryBold` (e.g., "OpenSans-Bold")
- Subtitle: `brandConfig.theme.fonts.primarySemiBold` (e.g., "OpenSans-SemiBold")
- Category: `brandConfig.theme.fonts.primarySemiBold` (e.g., "OpenSans-SemiBold")
- Text color: Hardcoded white (`#FFFFFF`) is acceptable

**Files to Update:**

- [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>) - styles.title, styles.category, styles.subtitle
- Remove any hardcoded `fontFamily` values
- Use brand config fonts via `useBrandConfig()` hook

---

### 2. ✅ Content Container Spacing

#### Current Implementation

- Padding: 24px all around
- Bottom padding: 120px (to account for tab bar)
- With mini player: 180px bottom padding

#### Figma Design

- Padding: 48px top, 16px bottom, 16px horizontal (implied from Frame 19)
- Gap between title and subtitle: 16px

**Changes Needed:**

- [ ] Update horizontal padding from 24px to 16px
- [ ] Update top padding from 24px to 48px
- [ ] Adjust bottom padding to 16px base (plus tab bar offset)
- [ ] Add 16px gap between title and subtitle/category

**Files to Update:**

- [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>) - styles.contentContainer

---

### 3. ✅ Gradient Overlay Adjustments

#### Current Implementation - Bottom Gradient

```javascript
colors={[
  "transparent",
  "transparent",
  "rgba(0,0,0,0.3)",
  "rgba(0,0,0,0.7)",
  "rgba(0,0,0,0.9)",
]}
locations={[0, 0.3, 0.5, 0.7, 1]}
```

#### Figma Design - Bottom Gradient

```
linear-gradient(180deg, rgba(1, 22, 32, 0) 0%, rgba(1, 22, 32, 0.7) 33%)
```

**Changes Needed:**

- [ ] Replace hardcoded black with `brandConfig.theme.colors.light.overlayGradientEnd`
- [ ] Simplify gradient to match Figma design
- [ ] Adjust gradient stops to: transparent at 0%, brand color at 33%
- [ ] Use rgba with brand color and varying opacity
- [ ] Consider if more stops are needed for smooth transition

**Color Usage:**

- Use `overlayGradientEnd` from brand config with opacity variations
- Example: `rgba(r, g, b, 0.7)` where rgb comes from brand config

**Files to Update:**

- [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>) - LinearGradient in renderCarouselItem

---

### 4. ✅ Top Gradient Overlay

#### Current Implementation

- Top gradient in [`CarouselProgressIndicator.tsx`](../components/CarouselProgressIndicator.tsx)
- Current gradient:

```javascript
colors={[
  "rgba(0, 0, 0, 0.5)",
  "rgba(0, 0, 0, 0.5)",
  "rgba(0, 0, 0, 0.5)",
  "rgba(0, 0, 0, 0.3)",
  "transparent",
]}
```

#### Figma Design - Top Gradient

```
linear-gradient(0deg, rgba(1, 22, 32, 0) 0%, rgba(1, 22, 32, 0.5) 33%)
```

**Changes Needed:**

- [ ] Replace hardcoded black with `brandConfig.theme.colors.light.overlayGradientStart`
- [ ] Update gradient to match Figma design
- [ ] Adjust gradient direction and stops
- [ ] Gradient should go from transparent at bottom to brand color at top
- [ ] Use rgba with brand color and varying opacity

**Color Usage:**

- Use `overlayGradientStart` from brand config with opacity variations
- Example: `rgba(r, g, b, 0.5)` where rgb comes from brand config

**Files to Update:**

- [`components/CarouselProgressIndicator.tsx`](../components/CarouselProgressIndicator.tsx) - styles.gradientBackground

---

### 5. ✅ Progress Indicator Styling

#### Current Implementation

- Multiple thin bars (4px height)
- Background: `rgba(255, 255, 255, 0.3)` (light/unfilled state)
- Fill: Brand color or white (progress/filled state)
- Gap: 4px between bars
- Border radius: 2px

#### Figma Design (node-id=20-562)

- Height: 4px
- Width: 46px per indicator
- Gap: 4px between bars
- **Background (unfilled):** `#00334C` (dark blue - darker than brand color)
- **Fill (progress):** `#10D1F0` (cyan/turquoise - bright accent color)
- Layout: Row with stretch alignment

**Key Insight:** The design uses **INVERTED colors** compared to current implementation:

- Current: Light background (`rgba(255,255,255,0.3)`), dark/brand fill
- Figma: Dark background (`#00334C`), bright cyan fill (`#10D1F0`)

**Changes Needed:**

- [ ] Replace hardcoded background with `brandConfig.theme.colors.light.progressIndicatorBackground`
- [ ] Replace fill color with `brandConfig.theme.colors.light.progressIndicatorFill`
- [ ] This inverts the current logic: dark background, bright progress
- [ ] Verify 46px width per indicator matches current calculation
- [ ] Ensure 4px gap is maintained
- [ ] Remove any hardcoded color values

**Color Usage:**

- Background: `progressIndicatorBackground` from brand config
- Fill: `progressIndicatorFill` from brand config
- NO hardcoded colors except in brand config files

**Files to Update:**

- [`components/CarouselProgressIndicator.tsx`](../components/CarouselProgressIndicator.tsx) - Update to use brand config colors
- [`hooks/useBrandConfig.ts`](../hooks/useBrandConfig.ts) - Verify it exposes new color properties

---

### 6. ✅ Logo and User Button Positioning & Icon

#### Current Implementation

- Logo: Absolute position, top: 80px, left: 12px
- User button: Absolute position, top: 80px, right: 16px
- User icon: Currently using `person.fill` SF Symbol

#### Figma Design

- Both elements appear to be within the top gradient area (Frame 33)
- Logo: 128x49px frame
- User icon: 24x24px frame (Figma node id: 20:549)
- Positioned with spacing in top navigation

**Changes Needed:**

- [ ] Verify logo and user button positioning matches design
- [ ] Adjust if needed based on new gradient and spacing
- [ ] Ensure proper z-index layering
- [ ] **Replace current user icon with Figma design icon**
- [ ] **Export user icon from Figma (24x24px, node id: 20:549)**
- [ ] **Update icon component to use Figma design asset**

**Icon Specifications:**

- Size: 24x24px
- Color: White (`#FFFFFF`)
- Location: Top right of screen within gradient area
- Source: Figma Frame 20:549 in topnav section
- Format: SVG or PNG @2x/@3x for React Native

**Color Usage:**

- Icon color: White (`#FFFFFF`) - hardcoded acceptable
- Logo uses brand logo from config

**Files to Update:**

- [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>) - styles.brandLogo, styles.userButton, icon component
- Export and add user icon asset from Figma design (node 20:549)

---

### 7. ✅ Content Layout Structure

#### Current Implementation

Shows only:

- Article title
- Category

#### Figma Design Shows

- Title (larger text)
- Subtitle/Lead text (smaller text below title)

**Changes Needed:**

- [ ] Add subtitle/lead text display below title
- [ ] Fetch and display article lead/excerpt from API
- [ ] Implement proper text truncation if needed
- [ ] Ensure proper spacing (16px gap) between title and subtitle
- [ ] **Use `brandConfig.theme.fonts.primarySemiBold` for subtitle font**

**Font Usage:**

- Subtitle: `brandConfig.theme.fonts.primarySemiBold`
- Text color: Hardcoded white (`#FFFFFF`) is acceptable

**Files to Update:**

- [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>) - renderCarouselItem function
- May need to update Article type in [`types/index.ts`](../types/index.ts) if lead text not available

---

### 8. ✅ Color & Font Consistency - Brand Config Integration

#### Current Implementation

- Uses hardcoded black (`#000`) for overlays and backgrounds
- White text with various opacities
- Some brand colors from config
- **Likely hardcoded font families**

#### Required Implementation

- ALL colors from brand config (except white/black for text)
- ALL fonts from brand config using generic names
- No hardcoded overlay colors
- No hardcoded font families
- Consistent use of brand config throughout

**Changes Needed:**

- [ ] Replace ALL hardcoded overlay colors with brand config values
- [ ] Replace ALL hardcoded font families with brand config values
- [ ] Ensure all gradient colors come from brand config
- [ ] Use brand config for progress indicators
- [ ] Verify brand switching updates all colors AND fonts correctly
- [ ] Add utility function to convert hex to rgba if needed

**Color Usage Rules:**

- ✅ Allowed: `#FFFFFF` (white) and `#000000` (black) for text only
- ❌ Not Allowed: Any other hardcoded colors
- ✅ Required: All colors from `brandConfig.theme.colors.light/dark`

**Font Usage Rules:**

- ✅ Required: All fonts from `brandConfig.theme.fonts` using generic names
- ❌ Not Allowed: Hardcoded font family names in component code
- ✅ Use: `primaryBold`, `primarySemiBold`, `primaryMedium` (reusable across app)
- ✅ Allowed: Font size, weight, and line-height can be hardcoded (but consider making configurable)

**Files to Update:**

- [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>) - All gradient/overlay colors AND fonts
- [`components/CarouselProgressIndicator.tsx`](../components/CarouselProgressIndicator.tsx) - All colors
- [`hooks/useBrandConfig.ts`](../hooks/useBrandConfig.ts) - Ensure new properties are exposed
- [`utils/colors.ts`](../utils/colors.ts) - Add hex to rgba conversion utility if needed

---

## Implementation Priority

### Phase 0: Prerequisites (MUST BE DONE FIRST)

1. **Add new color properties to all brand configs**
2. **Add new font properties to all brand configs** (primaryBold, primarySemiBold, primaryMedium)
3. **Update TypeScript types for colors**
4. **Update TypeScript types for fonts**
5. **Test brand config loading**

### Phase 1: High Priority (Core Visual Changes)

6. **Progress indicator colors** - Most visible change (dark bg, cyan fill)
7. **Typography updates** - Font sizes, line heights, AND font families from config
8. **Gradient overlay colors** - Brand colors instead of black
9. Content container spacing adjustments

### Phase 2: Medium Priority (Polish)

10. Add subtitle/lead text display
11. Logo and button positioning fine-tuning

### Phase 3: Low Priority (Nice to Have)

12. Additional text truncation logic if needed
13. Performance optimizations

---

## Technical Considerations

### Brand Configuration

- All new color properties must be added to ALL brand configs
- All new font properties must be added to ALL brand configs
- Each brand can have different values for colors AND fonts
- Light and dark mode must both be configured
- TypeScript types must be updated to include new properties

### Font Naming Convention

- **Use generic, reusable names**: `primaryBold`, `primarySemiBold`, `primaryMedium`
- **Benefits:**
  - Can be used throughout the app, not just in highlights
  - Easier to maintain consistency
  - Simpler to add new components
  - Clear hierarchy: primary > secondary, bold > semibold > medium > regular

### Font Loading

- Ensure all specified fonts are loaded in the app
- Verify font files exist for all brands
- Test font fallbacks if a font fails to load
- Consider font weight variations (Bold, SemiBold, Medium, etc.)

### Color Conversion Utility

Create a utility function to convert hex colors to rgba:

```typescript
// utils/colors.ts
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

### Responsive Design

- Ensure changes work on different screen sizes
- Test on iPhone SE (320x568) as shown in Figma
- Test on larger devices

### Performance

- Gradient changes should not impact performance
- Text rendering updates are minimal
- Color changes are CSS-only
- Font loading is already optimized
- Brand config loading is already optimized

### Accessibility

- Ensure text contrast ratios meet WCAG standards
- Verify text is readable against new gradient colors
- Test with different image backgrounds
- Verify cyan progress indicators are visible against dark background
- Test font readability across all brands

---

## Testing Checklist

After implementing changes:

- [ ] Visual comparison with Figma design
- [ ] Test on iPhone SE (320x568)
- [ ] Test on larger devices (iPhone 14 Pro, etc.)
- [ ] Test with portrait images
- [ ] Test with landscape images
- [ ] Verify text readability on light/dark images
- [ ] **Verify progress indicators are clearly visible (cyan on dark blue)**
- [ ] Test auto-advance functionality
- [ ] Test manual swipe functionality
- [ ] Verify progress indicators animate correctly
- [ ] Test with mini player visible
- [ ] **Test brand switching - verify all colors AND fonts update correctly**
- [ ] **Test light/dark mode switching**
- [ ] **Verify NO hardcoded colors remain (except white/black for text)**
- [ ] **Verify NO hardcoded fonts remain in component code**
- [ ] **Test all three brands (NT, CN, JNL) with their specific fonts**
- [ ] **Verify generic font names work across different components**

---

## Files Summary

### Phase 0: Brand Config Files (FIRST)

1. [`brands/nt/config.json`](../brands/nt/config.json) - Add new color & font properties
2. [`brands/cn/config.json`](../brands/cn/config.json) - Add new color & font properties
3. [`brands/jnl/config.json`](../brands/jnl/config.json) - Add new color & font properties
4. Brand config TypeScript types - Update type definitions

### Phase 1: Primary Implementation Files

5. [`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>)

   - Typography styles (sizes, line-heights, **font families from config**)
   - Content container spacing
   - Gradient colors (from brand config)
   - Add subtitle/lead text
   - Update overlay colors (from brand config)
   - Remove all hardcoded fonts
   - Use `primaryBold`, `primarySemiBold` from config

6. [`components/CarouselProgressIndicator.tsx`](../components/CarouselProgressIndicator.tsx)
   - Top gradient colors (from brand config)
   - Progress bar background color (from brand config)
   - Progress bar fill color (from brand config)

### Phase 2: Supporting Files

7. [`utils/colors.ts`](../utils/colors.ts) - Create hex to rgba utility
8. [`hooks/useBrandConfig.ts`](../hooks/useBrandConfig.ts) - Verify new properties exposed
9. [`types/index.ts`](../types/index.ts) - If Article type needs lead text field

---

## Design Specifications Reference

### Brand Config Properties

#### Required New Color Properties

```json
{
  "progressIndicatorBackground": "#00334C", // Dark blue for unfilled
  "progressIndicatorFill": "#10D1F0", // Cyan for filled
  "overlayGradientStart": "#011620", // For top gradient
  "overlayGradientEnd": "#011620" // For bottom gradient
}
```

#### Required New Font Properties (Generic, Reusable)

```json
{
  "primaryBold": "OpenSans-Bold", // Bold variant (700 weight) - reusable
  "primarySemiBold": "OpenSans-SemiBold", // SemiBold variant (600 weight) - reusable
  "primaryMedium": "OpenSans-Medium" // Medium variant (500 weight) - reusable
}
```

### Typography (from brand config)

- Title: 24px, line-height 26px, font from `primaryBold`
- Subtitle: 16px, line-height 22px, font from `primarySemiBold`
- Category: 14px (if kept separate), font from `primarySemiBold`

### Spacing

- Content horizontal padding: 16px
- Content top padding: 48px
- Content bottom padding: 16px (+ tab bar offset)
- Gap between title and subtitle: 16px

### Progress Indicators

- Height: 4px
- Width: 46px per indicator
- Gap: 4px between bars
- Background: From `progressIndicatorBackground`
- Fill: From `progressIndicatorFill`

### Gradients (using brand config colors)

- Top: `linear-gradient(0deg, transparent 0%, rgba(brand, 0.5) 33%)`
- Bottom: `linear-gradient(180deg, transparent 0%, rgba(brand, 0.7) 33%)`

---

## Notes

- **ALL colors must come from brand config** (except white/black for text)
- **ALL fonts must come from brand config** using generic, reusable names
- **Font naming:** Use `primaryBold`, `primarySemiBold`, `primaryMedium` (not component-specific names)
- **Reusability:** Generic font names can be used throughout the app
- Bottom navigation bar changes are intentionally excluded from this document
- The Figma design shows a specific navigation structure that will be addressed separately
- All measurements are based on iPhone SE (320x568) design
- Consider responsive scaling for larger devices
- **Progress indicators use inverted colors**: dark background with bright cyan fill
- Each brand can customize all colors AND fonts to match their brand identity
- Brand switching must update all colors AND fonts dynamically
- Ensure all specified fonts are loaded and available in the app

# Highlights Tab Design Changes

## Overview

This document compares the Figma design (node-id=14-256) with the current implementation of the Highlights tab ([`app/(tabs)/index.tsx`](<../app/(tabs)/index.tsx>)) and lists all required design changes.

**Reference Figma Design:** https://www.figma.com/design/tH7b9yaAOOowz2w0t48INH/EMAP-Apps-library?node-id=14-256

**⚠️ IMPORTANT CONFIGURATION POLICY:**

- **Colors:** All colors must come from brand [`config.json`](../brands/jnl/config.json) files. Only white (`#FFFFFF`) and black (`#000000`) may be hardcoded for text.
- **Fonts:** All fonts must come from brand `config.json` files. No hardcoded font families in component code. Use generic, reusable font property names.

**Note:** Bottom navigation bar changes are excluded as requested - those will be addressed separately.

---

## Deprecated Properties

### ⚠️ progressIndicator (DEPRECATED)

The existing `progressIndicator` color property will be **deprecated** and replaced by two more specific properties:

- `progressIndicatorBackground` - For the unfilled/background state
- `progressIndicatorFill` - For the filled/progress state

**Migration:**

- Old: Single `progressIndicator` color used for fill
- New: Separate `progressIndicatorBackground` and `progressIndicatorFill` colors
- **Action Required:** Update all components using `progressIndicator` to use the new properties
- **Timeline:** After implementation, `progressIndicator` can be removed from brand configs

---

## Brand Config Requirements

### New Color Properties Needed

The following new color properties must be added to each brand's `config.json` under `theme.colors.light` and `theme.colors.dark`:

```json
{
  "theme": {
    "colors": {
      "light": {
        // ... existing colors ...
        "progressIndicator": "#00AECA", // DEPRECATED - Will be removed after migration
        "progressIndicatorBackground": "#00334C", // NEW - Dark blue for unfilled progress
        "progressIndicatorFill": "#10D1F0", // NEW - Cyan for filled progress (replaces progressIndicator)
        "overlayGradientStart": "#011620", // NEW - Brand dark blue for gradients
        "overlayGradientEnd": "#011620" // NEW - Brand dark blue for gradients
      },
      "dark": {
        // ... same structure for dark mode ...
      }
    }
  }
}
```

**Migration Note:** Once all components are updated to use `progressIndicatorBackground` and `progressIndicatorFill`, the old `progressIndicator` property can be safely removed from all brand configs.
