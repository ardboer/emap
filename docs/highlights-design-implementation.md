# Highlights Tab Design Implementation

## Overview

This document details the design changes implemented to align the Highlights tab with the Figma design specifications, excluding bottom navbar changes which will be addressed separately.

## Implementation Date

October 30, 2025

## Figma Reference

Design URL: https://www.figma.com/design/tH7b9yaAOOowz2w0t48INH/EMAP-Apps-library?node-id=14-256

## Changes Implemented

### Phase 0: Brand Configuration Updates

#### New Color Properties Added

All three brand config files (`brands/nt/config.json`, `brands/cn/config.json`, `brands/jnl/config.json`) were updated with:

1. **progressIndicatorBackground** - Background color for progress indicator bars

   - NT: `#00334C` (dark teal)
   - CN: `#00334C` (dark teal)
   - JNL: `#00334C` (dark teal)

2. **progressIndicatorFill** - Fill color for active progress indicator

   - NT: `#10D1F0` (bright cyan)
   - CN: `#10D1F0` (bright cyan)
   - JNL: `#10D1F0` (bright cyan)

3. **overlayGradientStart** - Starting color for image overlay gradient

   - NT: `transparent`
   - CN: `transparent`
   - JNL: `transparent`

4. **overlayGradientEnd** - Ending color for image overlay gradient
   - NT: `#011620` (very dark blue-black)
   - CN: `#011620` (very dark blue-black)
   - JNL: `#011620` (very dark blue-black)

#### New Font Properties Added

All three brand config files were updated with generic font names:

1. **primaryBold** - Bold weight font for titles

   - NT: `"OpenSans-Bold"`
   - CN: `"OpenSans-Bold"`
   - JNL: `"OpenSans-Bold"`

2. **primarySemiBold** - Semi-bold weight font for categories

   - NT: `"OpenSans-SemiBold"`
   - CN: `"OpenSans-SemiBold"`
   - JNL: `"OpenSans-SemiBold"`

3. **primaryMedium** - Medium weight font for lead text
   - NT: `"OpenSans-Medium"`
   - CN: `"OpenSans-Medium"`
   - JNL: `"OpenSans-Medium"`

#### Utility Functions Created

**File:** `utils/colors.ts`

- Created `hexToRgba()` function to convert hex colors to rgba format with alpha channel
- Used for applying transparency to gradient overlay colors

### Phase 1: Visual Design Updates

#### 1. Progress Indicator Colors

**File:** `components/CarouselProgressIndicator.tsx`

**Changes:**

- Replaced hardcoded colors with brand config colors
- Background: Changed to `progressIndicatorBackground` (#00334C)
- Fill: Changed to `progressIndicatorFill` (#10D1F0)
- Gradient overlay: Updated to use `overlayGradientStart` with `hexToRgba()` for transparency
- **Color scheme inverted:** Dark background with bright fill (opposite of previous implementation)

#### 2. Typography Updates

**File:** `app/(tabs)/index.tsx`

**Title Text:**

- Font size: 28px → 24px
- Line height: Updated to 26px
- Font family: Applied `primaryBold` from brand config
- Margin bottom: 8px → 16px

**Category Text:**

- Font size: 14px → 16px
- Line height: Updated to 22px
- Font family: Applied `primarySemiBold` from brand config

**Lead Text (New):**

- Font size: 16px
- Line height: 22px
- Font family: Applied `primaryMedium` from brand config
- Margin bottom: 16px
- Conditionally rendered when `item.leadText` exists

#### 3. Gradient Overlay Colors

**File:** `app/(tabs)/index.tsx`

**Changes:**

- Replaced hardcoded black gradients with brand config colors
- Simplified from 5-color gradient to 2-color gradient
- Start: `overlayGradientStart` (transparent)
- End: `overlayGradientEnd` (#011620) with 0.7 alpha via `hexToRgba()`
- Applied to both landscape and portrait image layouts

#### 4. Content Container Spacing

**File:** `app/(tabs)/index.tsx`

**Changes:**

- Padding top: 24px → 48px
- Padding horizontal: 24px → 16px
- Spacing between title and category: 8px → 16px (via title marginBottom)
- Added 16px spacing between lead text and category

### Phase 2: Asset and Content Updates

#### 1. User Icon Replacement

**Asset:** `assets/images/user-icon.png`

- Exported from Figma (node ID: 20:549)
- Dimensions: 72x72px at 3x scale (24x24px display size)
- Format: PNG

**Implementation:**

- Replaced SF Symbol `person.fill` with custom PNG icon
- Updated user button in `app/(tabs)/index.tsx`
- Used `expo-image` Image component with `contentFit="contain"`

#### 2. Lead Text Display

**Changes:**

- Added conditional rendering of lead text below article titles
- Displays `item.leadText` from article data
- Applied brand-specific medium weight font
- Positioned between title and category with proper spacing

## Files Modified

### Configuration Files

1. `brands/nt/config.json` - Added 4 colors + 3 fonts
2. `brands/cn/config.json` - Added 4 colors + 3 fonts
3. `brands/jnl/config.json` - Added 4 colors + 3 fonts
4. `brands/index.ts` - Updated TypeScript interface

### Utility Files

1. `utils/colors.ts` - Created new utility function

### Component Files

1. `components/CarouselProgressIndicator.tsx` - Updated colors
2. `app/(tabs)/index.tsx` - Updated typography, spacing, gradients, user icon, lead text

### Asset Files

1. `assets/images/user-icon.png` - New asset added

## Design Specifications Summary

### Colors

| Element                 | Previous                | New                 | Source       |
| ----------------------- | ----------------------- | ------------------- | ------------ |
| Progress bar background | `rgba(255,255,255,0.3)` | `#00334C`           | Brand config |
| Progress bar fill       | `#FFFFFF`               | `#10D1F0`           | Brand config |
| Gradient overlay        | `rgba(0,0,0,0.7)`       | `rgba(1,22,32,0.7)` | Brand config |

### Typography

| Element   | Font Size | Line Height | Font Weight | Font Family           |
| --------- | --------- | ----------- | ----------- | --------------------- |
| Title     | 24px      | 26px        | Bold        | Brand primaryBold     |
| Lead Text | 16px      | 22px        | Medium      | Brand primaryMedium   |
| Category  | 16px      | 22px        | Semi-Bold   | Brand primarySemiBold |

### Spacing

| Element                    | Previous | New  |
| -------------------------- | -------- | ---- |
| Content padding top        | 24px     | 48px |
| Content padding horizontal | 24px     | 16px |
| Title margin bottom        | 8px      | 16px |
| Lead text margin bottom    | -        | 16px |

## Multi-Brand Support

All changes are fully compatible with the multi-brand architecture:

- Colors and fonts are sourced from brand config files
- Each brand can have unique values for all new properties
- Generic font naming allows easy brand-specific customization
- No hardcoded values in component implementations

## Testing Recommendations

1. **Visual Testing:**

   - Verify progress indicator colors match Figma design
   - Check typography sizes and weights across all brands
   - Validate gradient overlay appearance
   - Confirm user icon displays correctly
   - Verify lead text displays when available

2. **Brand Testing:**

   - Test all three brands (NT, CN, JNL)
   - Verify brand-specific fonts load correctly
   - Check color consistency across brands

3. **Layout Testing:**

   - Test both portrait and landscape image layouts
   - Verify spacing and alignment
   - Check with and without lead text
   - Test with mini player visible/hidden

4. **Device Testing:**
   - Test on various screen sizes
   - Verify responsive behavior
   - Check on iOS and Android

## Notes

- Bottom navbar changes were explicitly excluded from this implementation
- All changes maintain backward compatibility with existing article data
- Lead text is conditionally rendered (only shows when data exists)
- User icon is a static asset (not dynamically loaded)

## Future Considerations

1. Consider adding animation transitions for lead text appearance
2. Evaluate if user icon should support dynamic theming
3. Monitor performance impact of gradient overlays
4. Consider adding truncation for long lead text
