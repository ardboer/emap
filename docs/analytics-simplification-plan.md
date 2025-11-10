# Analytics Simplification Implementation Plan

## Overview

This document outlines the plan to simplify the analytics implementation by removing non-standard custom events and keeping only the standard Firebase Analytics events and the approved custom events listed in the requirements.

## Current State Analysis

### Events to REMOVE (Non-Standard Custom Events)

From **app/(tabs)/index.tsx** (Highlights/Carousel):

- ❌ `carousel_session_start`
- ❌ `carousel_session_end`
- ❌ `carousel_article_click`
- ❌ `carousel_auto_advance`
- ❌ `carousel_endless_scroll_exhausted`
- ❌ `carousel_endless_scroll_loaded`
- ❌ `carousel_endless_scroll_error`
- ❌ `carousel_manual_scroll_start`
- ❌ `carousel_manual_scroll_end`
- ❌ `carousel_drop_off`
- ❌ `carousel_article_dwell`
- ❌ `carousel_milestone_25`
- ❌ `carousel_milestone_50`
- ❌ `carousel_milestone_75`
- ❌ `carousel_milestone_100`
- ❌ `carousel_article_view`
- ❌ `carousel_backward_scroll`
- ❌ `carousel_tab_press_scroll_to_top`

From **services/analytics.ts**:

- ❌ `screen_time` (tracked in logScreenView)
- ❌ `app_foreground`
- ❌ `app_went_background`
- ❌ `screen_navigation`
- ❌ Helper methods: `calculateScrollDepthMetrics()`, `analyzeScrollVelocity()`

### Events to KEEP (Standard Firebase + Approved Custom)

#### Standard Firebase Events (Automatically Collected)

- ✅ `first_open`
- ✅ `session_start`
- ✅ `session_end`
- ✅ `user_engagement`
- ✅ `app_update`
- ✅ `app_remove`
- ✅ `app_clear_data`
- ✅ `os_update`
- ✅ `firebase_campaign`

#### Standard Firebase Events (Explicitly Implemented)

- ✅ `screen_view` - Need to add to all screens with proper parameters
- ✅ `search` - Standard Firebase search event

#### Approved Custom Events

**Session Events:**

- ✅ `app_session_start` (already implemented)
- ✅ `app_session_end` (already implemented)

**Article Events:**

- ✅ `article_view` (need to implement)

**Search Events:**

- ✅ `search_performed` (already implemented)

**Highlights Events:**

- ✅ `highlights_view` (need to implement)
- ✅ `highlights_click` (need to implement)

**Native Ad Events:**

- ✅ `native_ad_click` (already implemented)
- ✅ `native_ad_choices_click` (already implemented)
- ✅ `native_ad_list_impression` (already implemented)
- ✅ `native_ad_list_click` (already implemented)
- ✅ `native_ad_list_choices_click` (already implemented)

**Paywall Events:**

- ✅ `paywall_shown` (already implemented)
- ✅ `paywall_subscribe_clicked` (already implemented)
- ✅ `paywall_signin_clicked` (already implemented)

#### User Properties (Keep)

- ✅ `brand`
- ✅ `brand_name`
- ✅ `bundle_id`
- ✅ `features_enabled`

## Implementation Tasks

### 1. Update Analytics Service ([`services/analytics.ts`](services/analytics.ts))

**Remove:**

- `calculateScrollDepthMetrics()` method
- `analyzeScrollVelocity()` method
- `logAppForeground()` method
- `logAppBackground()` method
- `logNavigation()` method
- Screen time tracking in `logScreenView()`

**Keep/Update:**

- `initialize()` - Keep as is
- `logScreenView()` - Simplify to remove screen_time tracking
- `logEvent()` - Keep as is
- `logArticleView()` - Keep as is
- `logSearch()` - Keep as is
- `endSession()` - Keep as is

**Add:**

- `logHighlightsView()` - New method for highlights_view event
- `logHighlightsClick()` - New method for highlights_click event

### 2. Update Highlights/Carousel Screen ([`app/(tabs)/index.tsx`](<app/(tabs)/index.tsx>))

**Changes Required:**

1. **Remove all milestone tracking** (lines 764-785)

   - Remove carousel_milestone_25, 50, 75, 100 events

2. **Remove all carousel events:**

   - Remove carousel_session_start (line 627)
   - Remove carousel_session_end (line 650)
   - Remove carousel_auto_advance (line 500)
   - Remove carousel_article_click (line 130)

3. **Remove all other detailed tracking events:**

   - Remove carousel_article_view (line 801)
   - Remove carousel_article_dwell (line 741)
   - Remove carousel_backward_scroll (line 839)
   - Remove carousel_manual_scroll_start (line 548)
   - Remove carousel_manual_scroll_end (line 561)
   - Remove carousel_tab_press_scroll_to_top (line 915)
   - Remove carousel_drop_off (line 689)
   - Remove carousel*endless_scroll*\* events (lines 376, 423, 439)

4. **Add new events:**

   - Add highlights_view when article is viewed in carousel
   - Add highlights_click when article is clicked in carousel

5. **Important Note:** All carousel-specific tracking is being removed. Only highlights_view and highlights_click will remain for tracking user interaction with the highlights carousel.

### 3. Add screen_view Tracking to All Screens

**Screens that need screen_view added:**

1. **[`app/(tabs)/news.tsx`](<app/(tabs)/news.tsx>)**

   - Add: `analyticsService.logScreenView("News", "NewsScreen")`

2. **[`app/(tabs)/clinical.tsx`](<app/(tabs)/clinical.tsx>)**

   - Add: `analyticsService.logScreenView("Clinical", "ClinicalScreen")`

3. **[`app/(tabs)/events.tsx`](<app/(tabs)/events.tsx>)**

   - Add: `analyticsService.logScreenView("Events", "EventsScreen")`

4. **[`app/(tabs)/magazine.tsx`](<app/(tabs)/magazine.tsx>)** (if exists)

   - Add: `analyticsService.logScreenView("Magazine", "MagazineScreen")`

5. **[`app/(tabs)/podcasts.tsx`](<app/(tabs)/podcasts.tsx>)** (if exists)

   - Add: `analyticsService.logScreenView("Podcasts", "PodcastsScreen")`

6. **[`app/(tabs)/ask.tsx`](<app/(tabs)/ask.tsx>)** (if exists)

   - Add: `analyticsService.logScreenView("Ask", "AskScreen")`

7. **[`app/search.tsx`](app/search.tsx)**

   - Add: `analyticsService.logScreenView("Search", "SearchScreen")`

8. **[`app/article/[id].tsx`](app/article/[id].tsx)**

   - Add: `analyticsService.logScreenView("Article Detail", "ArticleScreen")` with additional parameters:
     - `article_id`
     - `article_title`
     - `source` (from navigation params: highlights, news, clinical, events, search, push_notification, related_article, trending_block, settings_test, direct)

9. **[`app/settings.tsx`](app/settings.tsx)** (if exists)
   - Add: `analyticsService.logScreenView("Settings", "SettingsScreen")`

### 4. Update Article Detail Screen ([`app/article/[id].tsx`](app/article/[id].tsx))

**Add:**

1. `screen_view` event with parameters:

   - `screen_name`: "Article Detail"
   - `screen_class`: "ArticleScreen"
   - `article_id`: Article ID
   - `article_title`: Article title
   - `source`: Navigation source (from params or default to "direct")

2. `article_view` custom event with parameters:
   - `article_id`: Article ID
   - `article_title`: Article title
   - `article_category`: Article category (optional)

### 5. Update Search Screen ([`app/search.tsx`](app/search.tsx))

**Add:**

1. `screen_view` event in useFocusEffect
2. Keep both `search` (standard Firebase) and `search_performed` (custom) events

### 6. Verify Native Ad Components

**Files to verify:**

- [`components/NativeAdCarouselItem.tsx`](components/NativeAdCarouselItem.tsx) ✅ Already correct
- [`components/NativeAdListItem.tsx`](components/NativeAdListItem.tsx) ✅ Already correct

### 7. Verify Paywall Component

**File to verify:**

- [`components/PaywallBottomSheet.tsx`](components/PaywallBottomSheet.tsx) ✅ Already correct

## Event Parameters Reference

### screen_view (Standard Firebase Event)

```typescript
{
  screen_name: string,
  screen_class: string,
  // For Article Detail only:
  article_id?: string,
  article_title?: string,
  source?: 'highlights' | 'news' | 'clinical' | 'events' | 'search' |
          'push_notification' | 'related_article' | 'trending_block' |
          'settings_test' | 'direct'
}
```

### search (Standard Firebase Event)

```typescript
{
  search_term: string;
}
```

### app_session_start (Custom Event)

```typescript
{
  brand: string,
  brand_name: string,
  timestamp: string (ISO)
}
```

### app_session_end (Custom Event)

```typescript
{
  duration_ms: number,
  duration_seconds: number,
  duration_minutes: number
}
```

### article_view (Custom Event)

```typescript
{
  article_id: string,
  article_title: string,
  article_category?: string
}
```

### search_performed (Custom Event)

```typescript
{
  search_term: string,
  results_count: number
}
```

### highlights_view (Custom Event)

```typescript
{
  index: number,
  article_id: string,
  article_title: string
}
```

### highlights_click (Custom Event)

```typescript
{
  index: number,
  article_id: string,
  article_title: string
}
```

### native_ad_click (Custom Event)

```typescript
{
  ad_id: string,
  position: number,
  dwell_time_ms: number,
  dwell_time_seconds: number,
  is_real_ad: boolean
}
```

### native_ad_choices_click (Custom Event)

```typescript
{
  ad_id: string,
  position: number
}
```

### native_ad_list_impression (Custom Event)

```typescript
{
  view_type: string,
  position: number,
  block_index: number,
  time_to_view_ms: number
}
```

### native_ad_list_click (Custom Event)

```typescript
{
  view_type: string,
  position: number,
  block_index: number,
  dwell_time_ms: number,
  dwell_time_seconds: number
}
```

### native_ad_list_choices_click (Custom Event)

```typescript
{
  view_type: string,
  position: number,
  block_index: number
}
```

### paywall_shown (Custom Event)

```typescript
{
  headline: string,
  has_benefits: boolean
}
```

### paywall_subscribe_clicked (Custom Event)

```typescript
{
  button_text: string,
  has_url: boolean,
  url: string,
  headline: string
}
```

### paywall_signin_clicked (Custom Event)

```typescript
{
  button_text: string,
  headline: string
}
```

## Testing Plan

After implementation, verify each event fires correctly:

1. **Session Events**

   - [ ] app_session_start fires on app launch
   - [ ] app_session_end fires on app close

2. **Screen Views**

   - [ ] screen_view fires for Highlights tab
   - [ ] screen_view fires for News tab
   - [ ] screen_view fires for Clinical tab
   - [ ] screen_view fires for Events tab
   - [ ] screen_view fires for Magazine tab (if exists)
   - [ ] screen_view fires for Podcasts tab (if exists)
   - [ ] screen_view fires for Ask tab (if exists)
   - [ ] screen_view fires for Search screen
   - [ ] screen_view fires for Article Detail with source parameter
   - [ ] screen_view fires for Settings screen (if exists)

3. **Article Events**

   - [ ] article_view fires when viewing article detail
   - [ ] highlights_view fires when viewing article in carousel
   - [ ] highlights_click fires when clicking article in carousel

4. **Search Events**

   - [ ] search (standard) fires on search
   - [ ] search_performed (custom) fires on search

5. **Highlights Events**

   - [ ] highlights_view fires when viewing article in carousel
   - [ ] highlights_click fires when clicking article in carousel

6. **Native Ad Events**

   - [ ] native_ad_click fires on ad click
   - [ ] native_ad_choices_click fires on AdChoices click
   - [ ] native_ad_list_impression fires on list ad impression
   - [ ] native_ad_list_click fires on list ad click
   - [ ] native_ad_list_choices_click fires on list AdChoices click

7. **Paywall Events**
   - [ ] paywall_shown fires when paywall displays
   - [ ] paywall_subscribe_clicked fires on subscribe button
   - [ ] paywall_signin_clicked fires on sign-in button

## Files to Modify

1. [`services/analytics.ts`](services/analytics.ts) - Simplify service, remove unused methods
2. [`app/(tabs)/index.tsx`](<app/(tabs)/index.tsx>) - Remove 19+ carousel events, add highlights_view and highlights_click
3. [`app/(tabs)/news.tsx`](<app/(tabs)/news.tsx>) - Add screen_view
4. [`app/(tabs)/clinical.tsx`](<app/(tabs)/clinical.tsx>) - Add screen_view
5. [`app/(tabs)/events.tsx`](<app/(tabs)/events.tsx>) - Add screen_view
6. [`app/(tabs)/magazine.tsx`](<app/(tabs)/magazine.tsx>) - Add screen_view (if exists)
7. [`app/(tabs)/podcasts.tsx`](<app/(tabs)/podcasts.tsx>) - Add screen_view (if exists)
8. [`app/(tabs)/ask.tsx`](<app/(tabs)/ask.tsx>) - Add screen_view (if exists)
9. [`app/search.tsx`](app/search.tsx) - Add screen_view
10. [`app/article/[id].tsx`](app/article/[id].tsx) - Add screen_view with source, add article_view
11. [`app/settings.tsx`](app/settings.tsx) - Add screen_view (if exists)

## Summary

**Events Removed:** 23+ non-standard custom events (including all carousel events)
**Events Kept:** 9 standard Firebase events + 14 approved custom events
**New Events Added:** highlights_view, highlights_click, article_view
**Files Modified:** 11 files
**Lines of Code Reduced:** ~600+ lines of analytics tracking code

This simplification will make the analytics implementation cleaner, more maintainable, and focused on the most important user interactions.
