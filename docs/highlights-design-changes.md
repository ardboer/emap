# Highlights Tab Design Changes

## Overview

Updated the Highlights tab to match the Figma design specifications from the EMAP Apps library.

## Changes Implemented

### 1. Logo Size Increase

**Files Modified:** `app/(tabs)/index.tsx`

- **Before:** 100px × 32px
- **After:** 136px × 52px
- **Change:** Increased logo size by ~36% in width and ~62% in height to match Figma design
- **Lines Changed:**
  - Line 758: Loading state logo
  - Line 805: Active state logo

### 2. "Recommended for you" Badge Repositioning

**Files Modified:** `components/highlights/CarouselItem.tsx`

- **Before:** Badge positioned absolutely at top-left (top: insets.top + 60)
- **After:** Badge integrated into bottom content container, positioned above the title
- **Visual Hierarchy:** Badge → 32px gap → Title
- **Implementation:** Badge is now rendered conditionally within the content container for all three layout variants (landscape with color gradient, landscape with blur, and portrait)

### 3. Title Font Size Update

**Files Modified:** `components/highlights/CarouselItem.tsx`

- **Before:** 22px font size, 26px line height
- **After:** 28px font size, 30px line height (1.07 ratio)
- **Change:** Increased title prominence to match Figma specifications

### 4. Badge Styling Updates

**Files Modified:** `components/highlights/CarouselItem.tsx`

New badge styles matching Figma design:

- **Background Color:** `#CFF8FF` (light cyan) - previously used theme color
- **Text Color:** `#00334C` (dark blue) - previously `#011620`
- **Font Size:** 12px
- **Font Weight:** 600 (semibold)
- **Text Transform:** UPPERCASE
- **Border Radius:** 16px
- **Padding:** 8px horizontal and vertical
- **Margin Bottom:** 32px (gap to title)

### 5. Component Architecture Changes

#### Deprecated Component

- **File:** `components/highlights/RecommendedBadge.tsx`
- **Status:** No longer used (can be removed in future cleanup)
- **Reason:** Badge functionality integrated directly into CarouselItem for better layout control

#### Updated Component

- **File:** `components/highlights/CarouselItem.tsx`
- **Changes:**
  - Removed import of `RecommendedBadge` component
  - Added inline badge rendering within content container
  - Badge now appears in all three layout variants (landscape color gradient, landscape blur, portrait)
  - Badge positioned above title with proper spacing

## Figma Design Reference

**Design File:** EMAP Apps library
**Node ID:** 84-158 (402px wide frame)
**Section:** Highlights tab (first tab in bottom bar)

### Key Measurements from Figma:

- Logo: 136px × 52px
- Badge: 12px font, 600 weight, 8px padding, 16px border radius
- Title: 28px font, 700 weight, 30px line height
- Gap between badge and title: 32px
- Badge background: #CFF8FF
- Badge text: #00334C

## Testing Recommendations

1. **Visual Verification:**

   - Compare logo size with Figma design
   - Verify badge appears above title in bottom section
   - Check badge styling matches Figma colors
   - Confirm 32px gap between badge and title

2. **Layout Testing:**

   - Test on different screen sizes
   - Verify landscape and portrait image layouts
   - Check with and without mini player active
   - Test recommended vs non-recommended articles

3. **Functional Testing:**
   - Ensure badge only appears for recommended articles
   - Verify carousel navigation still works
   - Check that article tap functionality is preserved

## Related Files

- `app/(tabs)/index.tsx` - Main highlights screen
- `components/highlights/CarouselItem.tsx` - Individual carousel item with badge
- `components/highlights/HighlightsFlatList.tsx` - FlatList wrapper
- `components/BrandLogo.tsx` - Logo component
- `components/highlights/RecommendedBadge.tsx` - Deprecated (no longer used)

## Implementation Date

2025-01-16
