# Article Sharing Implementation Plan

## Overview

Add native sharing functionality to article detail screens, allowing users to share articles via the device's native share sheet (WhatsApp, Email, SMS, etc.).

## Technical Approach

### 1. React Native Share API

- **Library**: Use React Native's built-in `Share` API (no additional dependencies needed)
- **Compatibility**: Works with Expo out of the box
- **Platforms**: iOS and Android native share sheets

### 2. Component Architecture

#### ShareButton Component

Create a reusable `ShareButton` component that:

- Displays a share icon (using `@expo/vector-icons`)
- Handles share action with proper error handling
- Provides haptic feedback on press
- Adapts to light/dark themes
- Accepts customizable styling props

**Props Interface:**

```typescript
interface ShareButtonProps {
  title: string;
  message: string;
  url: string;
  style?: ViewStyle;
  iconSize?: number;
  iconColor?: string;
  onShareSuccess?: () => void;
  onShareError?: (error: Error) => void;
}
```

### 3. Integration Points

#### Regular Article Detail Screen (`app/article/[id].tsx`)

- Add share button in the header area (next to back button)
- Share content includes:
  - Article title
  - Article URL (constructed from article ID and brand domain)
  - Optional: Brief excerpt or lead text

#### PDF Article Detail Screen (`app/pdf-article/[editionId]/[articleId].tsx`)

- Add share button in the header area
- Share content includes:
  - Article title
  - PDF article URL (constructed from edition ID and article ID)
  - Page number reference

### 4. Share Content Format

**For Regular Articles:**

```
Title: {article.title}
Read more: {brandConfig.domain}/article/{article.id}
```

**For PDF Articles:**

```
Title: {article.title}
Page: {article.page}
Read more: {brandConfig.domain}/pdf-article/{editionId}/{articleId}
```

### 5. Implementation Details

#### Share Function Logic

```typescript
const handleShare = async () => {
  try {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Share
    const result = await Share.share({
      message: shareMessage,
      url: shareUrl, // iOS only
      title: shareTitle,
    });

    if (result.action === Share.sharedAction) {
      // Successfully shared
      console.log("Article shared successfully");
    } else if (result.action === Share.dismissedAction) {
      // Share dismissed
      console.log("Share dismissed");
    }
  } catch (error) {
    console.error("Error sharing article:", error);
    // Optional: Show error toast/alert
  }
};
```

#### URL Construction

- Use brand configuration domain from `useBrandConfig()`
- Construct proper deep links that work with the app's routing
- Format: `{brandConfig.domain}/article/{id}` or `{brandConfig.domain}/pdf-article/{editionId}/{articleId}`

### 6. UI/UX Considerations

#### Button Placement

- Position in top-right corner of article detail screens
- Use consistent styling with existing back button
- Ensure proper spacing and touch target size (minimum 44x44 points)

#### Visual Design

- Use `Ionicons` share icon: `share-outline` or `share-social-outline`
- Match brand theme colors
- Provide visual feedback on press (opacity change)
- Support both light and dark modes

#### Accessibility

- Add proper accessibility labels
- Ensure button is keyboard accessible
- Provide screen reader support

### 7. Error Handling

**Potential Errors:**

1. Share API not available (rare, but handle gracefully)
2. User cancels share (not an error, just log)
3. Network issues when constructing URLs
4. Missing article data

**Handling Strategy:**

- Wrap share calls in try-catch blocks
- Log errors for debugging
- Optionally show user-friendly error messages
- Fail silently for non-critical errors

### 8. Testing Strategy

#### Manual Testing

1. **iOS Simulator:**

   - Test share sheet appearance
   - Verify share options available
   - Test cancel behavior
   - Verify URL format

2. **Android Emulator:**
   - Test share sheet appearance
   - Verify share options available
   - Test back button behavior
   - Verify URL format

#### Test Cases

- [ ] Share button appears in article detail screen
- [x] Share button appears in article detail screen (PDF articles excluded per requirements)
- [ ] Tapping share button opens native share sheet
- [ ] Share sheet contains correct article title
- [ ] Share sheet contains correct article URL
- [ ] Haptic feedback works on button press
- [ ] Share button styling matches theme (light/dark)
- [ ] Share works with different apps (Messages, Mail, etc.)
- [ ] Cancel/dismiss share sheet works correctly
- [ ] Error handling works for edge cases

### 9. File Structure

```
components/
  ShareButton.tsx          # New reusable share button component

app/
  article/
    [id].tsx              # Updated with share button
  pdf-article/
    [editionId]/
      [articleId].tsx     # Updated with share button

docs/
  article-sharing-implementation-plan.md  # This file
```

### 10. Dependencies

**No new dependencies required!**

- `Share` from `react-native` (built-in)
- `Haptics` from `expo-haptics` (already installed)
- `Ionicons` from `@expo/vector-icons` (already installed)
- `useBrandConfig` hook (already exists)

### 11. Implementation Steps

1. ✅ Create implementation plan document
2. ✅ Create `ShareButton` component
3. ✅ Integrate share button into regular article detail screen
4. ❌ Integrate share button into PDF article detail screen (not required per user)
5. ⏳ Test on iOS simulator
6. ⏳ Test on Android emulator
7. ✅ Handle edge cases and errors
8. ✅ Update documentation

### 12. Future Enhancements (Out of Scope)

- Share buttons in article teaser cards
- Share specific quotes/excerpts from articles
- Copy link to clipboard functionality
- Share analytics tracking
- Custom share messages per brand
- Social media preview optimization

## Design Mockup

```
┌─────────────────────────────────┐
│  ← BACK              [Share Icon]│  ← Header with share button
├─────────────────────────────────┤
│                                 │
│  [Article Image]                │
│                                 │
├─────────────────────────────────┤
│  Article Title                  │
│  Article Content...             │
│                                 │
└─────────────────────────────────┘
```

## Conclusion

This implementation provides a clean, native sharing experience that:

- Requires no additional dependencies
- Works seamlessly on both iOS and Android
- Follows platform conventions
- Is easily maintainable and extensible
- Provides good user experience with haptic feedback
