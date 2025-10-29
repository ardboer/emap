# Firebase Analytics Tracking Guide

**Version:** 1.0  
**Last Updated:** January 2025  
**Target Audience:** Data Team, Product Managers, Analysts

---

## Table of Contents

1. [Overview](#overview)
2. [Implementation Summary](#implementation-summary)
3. [User Properties](#user-properties)
4. [Event Catalog](#event-catalog)
5. [Carousel Analytics](#carousel-analytics)
6. [Session Tracking](#session-tracking)
7. [Navigation Tracking](#navigation-tracking)
8. [Data Dictionary](#data-dictionary)
9. [Analysis Examples](#analysis-examples)
10. [BigQuery Schema](#bigquery-schema)

---

## Overview

This document describes the Firebase Analytics implementation for the multi-brand news app. The tracking system captures comprehensive user behavior data with special focus on:

- **Carousel engagement** - Detailed scroll depth and interaction metrics
- **Session duration** - Time spent in app and per screen
- **Navigation patterns** - User flow through the app
- **Content engagement** - Article views, clicks, and dwell time
- **Multi-brand segmentation** - All events tagged with brand identifier

### Key Features

- ✅ Automatic screen view tracking
- ✅ Carousel scroll depth analysis (max index reached, completion rate)
- ✅ Article-level engagement metrics (dwell time, click-through)
- ✅ Session time tracking (foreground/background states)
- ✅ Navigation flow tracking
- ✅ Brand-specific segmentation
- ✅ Privacy-compliant (no PII collected)

---

## Implementation Summary

### Technology Stack

- **Platform:** React Native (Expo)
- **Analytics SDK:** `@react-native-firebase/analytics` v23.4.1
- **Firebase Project:** `mobileapps-cone-fab-reactnativ`
- **Supported Brands:** Construction News (CN), Nursing Times (NT), Journal of Nursing Leadership (JNL)

### Data Flow

```
User Action → Analytics Service → Firebase Analytics → BigQuery (optional)
```

### Files Modified

- `services/analytics.ts` - Core analytics service
- `app/_layout.tsx` - App-wide session and navigation tracking
- `app/(tabs)/index.tsx` - Carousel-specific tracking

---

## User Properties

User properties are set once per user session and persist across all events.

| Property           | Type   | Description                      | Example Values                           |
| ------------------ | ------ | -------------------------------- | ---------------------------------------- |
| `brand`            | string | Brand shortcode identifier       | `"cn"`, `"nt"`, `"jnl"`                  |
| `brand_name`       | string | Full brand display name          | `"Construction News"`, `"Nursing Times"` |
| `bundle_id`        | string | App bundle identifier            | `"metropolis.co.uk.constructionnews"`    |
| `features_enabled` | string | Comma-separated enabled features | `"enablePodcasts,enableEvents"`          |

### Usage in Analysis

User properties allow you to:

- Segment all metrics by brand
- Compare feature adoption across brands
- Filter data for specific brand analysis

---

## Event Catalog

### Session Events

#### `session_start`

**Trigger:** App launches or returns to foreground after being terminated  
**Purpose:** Mark beginning of user session

| Parameter    | Type   | Description        |
| ------------ | ------ | ------------------ |
| `brand`      | string | Brand shortcode    |
| `brand_name` | string | Brand display name |
| `timestamp`  | string | ISO 8601 timestamp |

#### `session_end`

**Trigger:** App terminates or goes to background for extended period  
**Purpose:** Calculate total session duration

| Parameter          | Type   | Description                      |
| ------------------ | ------ | -------------------------------- |
| `brand`            | string | Brand shortcode                  |
| `duration_ms`      | number | Session duration in milliseconds |
| `duration_seconds` | number | Session duration in seconds      |
| `duration_minutes` | number | Session duration in minutes      |
| `timestamp`        | number | Unix timestamp                   |

---

### App State Events

#### `app_foreground`

**Trigger:** App returns to foreground from background  
**Purpose:** Track app resume events

| Parameter        | Type   | Description                                       |
| ---------------- | ------ | ------------------------------------------------- |
| `brand`          | string | Brand shortcode                                   |
| `previous_state` | string | Previous app state (`"background"`, `"inactive"`) |
| `timestamp`      | number | Unix timestamp                                    |

#### `app_background`

**Trigger:** App moves to background  
**Purpose:** Track when users leave app

| Parameter    | Type   | Description                                   |
| ------------ | ------ | --------------------------------------------- |
| `brand`      | string | Brand shortcode                               |
| `next_state` | string | Next app state (`"background"`, `"inactive"`) |
| `timestamp`  | number | Unix timestamp                                |

---

### Screen Tracking Events

#### `screen_view` (Firebase Standard Event)

**Trigger:** User navigates to a new screen  
**Purpose:** Track screen views and navigation flow

| Parameter      | Type   | Description                                            |
| -------------- | ------ | ------------------------------------------------------ |
| `screen_name`  | string | Screen identifier (e.g., `"Highlights"`, `"Articles"`) |
| `screen_class` | string | Screen component class name                            |

#### `screen_time`

**Trigger:** User leaves a screen  
**Purpose:** Measure time spent on each screen

| Parameter          | Type   | Description                    |
| ------------------ | ------ | ------------------------------ |
| `brand`            | string | Brand shortcode                |
| `screen_name`      | string | Screen identifier              |
| `duration_ms`      | number | Time on screen in milliseconds |
| `duration_seconds` | number | Time on screen in seconds      |
| `timestamp`        | number | Unix timestamp                 |

#### `screen_navigation`

**Trigger:** User navigates between screens  
**Purpose:** Understand user flow patterns

| Parameter     | Type   | Description                      |
| ------------- | ------ | -------------------------------- |
| `brand`       | string | Brand shortcode                  |
| `from_screen` | string | Previous screen                  |
| `to_screen`   | string | New screen                       |
| `params`      | string | JSON string of navigation params |
| `timestamp`   | number | Unix timestamp                   |

---

## Carousel Analytics

The carousel (Highlights tab) has the most comprehensive tracking to measure content engagement and scroll depth.

### Carousel Session Events

#### `carousel_session_start`

**Trigger:** User enters Highlights tab  
**Purpose:** Mark beginning of carousel viewing session

| Parameter             | Type   | Description                |
| --------------------- | ------ | -------------------------- |
| `brand`               | string | Brand shortcode            |
| `total_articles`      | number | Total articles in carousel |
| `first_article_id`    | string | ID of first article        |
| `first_article_title` | string | Title of first article     |
| `session_start_time`  | string | ISO 8601 timestamp         |
| `timestamp`           | number | Unix timestamp             |

#### `carousel_session_end`

**Trigger:** User leaves Highlights tab  
**Purpose:** Calculate comprehensive carousel engagement metrics

| Parameter                    | Type    | Description                             | Analysis Use     |
| ---------------------------- | ------- | --------------------------------------- | ---------------- |
| `brand`                      | string  | Brand shortcode                         | Segmentation     |
| `session_duration_ms`        | number  | Total time in carousel (ms)             | Engagement depth |
| `session_duration_seconds`   | number  | Total time in carousel (seconds)        | Engagement depth |
| `max_index_reached`          | number  | Furthest article index viewed (0-based) | **Scroll depth** |
| `scroll_depth_percentage`    | number  | % of carousel explored (0-100)          | **Key metric**   |
| `unique_indexes_viewed`      | number  | Count of unique positions viewed        | Exploration      |
| `completion_rate`            | number  | % completion (0-100)                    | **Key metric**   |
| `reached_end`                | boolean | Whether user reached last article       | Completion       |
| `scroll_progression`         | string  | JSON array of index sequence            | User path        |
| `indexes_viewed`             | string  | JSON array of unique indexes            | Coverage         |
| `total_articles`             | number  | Total articles available                | Context          |
| `articles_viewed_ids`        | string  | JSON array of article IDs viewed        | Content analysis |
| `scroll_interactions`        | number  | Count of manual scrolls                 | Engagement       |
| `avg_time_per_article`       | number  | Average dwell time per article (ms)     | Engagement       |
| `avg_transition_duration_ms` | number  | Average scroll speed (ms)               | Velocity         |
| `min_transition_duration_ms` | number  | Fastest scroll (ms)                     | Velocity         |
| `max_transition_duration_ms` | number  | Slowest scroll (ms)                     | Velocity         |
| `total_transitions`          | number  | Total scroll events                     | Activity         |
| `timestamp`                  | number  | Unix timestamp                          | Time analysis    |

**Key Metrics for Analysis:**

- `scroll_depth_percentage` - Primary engagement metric
- `completion_rate` - Content interest indicator
- `max_index_reached` - Drop-off analysis
- `avg_time_per_article` - Content quality indicator

#### `carousel_drop_off`

**Trigger:** User leaves carousel before reaching the end  
**Purpose:** Identify where users lose interest

| Parameter                 | Type   | Description                          | Analysis Use        |
| ------------------------- | ------ | ------------------------------------ | ------------------- |
| `brand`                   | string | Brand shortcode                      | Segmentation        |
| `drop_off_index`          | number | Index where user stopped             | **Drop-off point**  |
| `drop_off_percentage`     | number | % of carousel viewed before drop-off | Engagement          |
| `articles_remaining`      | number | Articles not viewed                  | Opportunity loss    |
| `time_before_drop_off_ms` | number | Time before dropping off (ms)        | Engagement duration |
| `last_article_id`         | string | ID of last article viewed            | Content analysis    |
| `last_article_title`      | string | Title of last article viewed         | Content analysis    |
| `timestamp`               | number | Unix timestamp                       | Time analysis       |

**Analysis Use Cases:**

- Identify problematic content positions
- Optimize carousel length
- Improve content ordering

---

### Carousel Milestone Events

Track progression through carousel at key percentages.

#### `carousel_milestone_25`

**Trigger:** User reaches 25% of carousel  
**Purpose:** Track early engagement

| Parameter              | Type   | Description                |
| ---------------------- | ------ | -------------------------- |
| `brand`                | string | Brand shortcode            |
| `index`                | number | Article index at milestone |
| `article_id`           | string | Article ID at milestone    |
| `time_to_milestone_ms` | number | Time to reach 25% (ms)     |
| `timestamp`            | number | Unix timestamp             |

#### `carousel_milestone_50`

**Trigger:** User reaches 50% of carousel  
**Purpose:** Track mid-point engagement

| Parameter              | Type   | Description                |
| ---------------------- | ------ | -------------------------- |
| `brand`                | string | Brand shortcode            |
| `index`                | number | Article index at milestone |
| `article_id`           | string | Article ID at milestone    |
| `time_to_milestone_ms` | number | Time to reach 50% (ms)     |
| `timestamp`            | number | Unix timestamp             |

#### `carousel_milestone_75`

**Trigger:** User reaches 75% of carousel  
**Purpose:** Track high engagement

| Parameter              | Type   | Description                |
| ---------------------- | ------ | -------------------------- |
| `brand`                | string | Brand shortcode            |
| `index`                | number | Article index at milestone |
| `article_id`           | string | Article ID at milestone    |
| `time_to_milestone_ms` | number | Time to reach 75% (ms)     |
| `timestamp`            | number | Unix timestamp             |

#### `carousel_milestone_100`

**Trigger:** User reaches end of carousel  
**Purpose:** Track completion

| Parameter              | Type   | Description                     |
| ---------------------- | ------ | ------------------------------- |
| `brand`                | string | Brand shortcode                 |
| `index`                | number | Final article index             |
| `article_id`           | string | Final article ID                |
| `time_to_milestone_ms` | number | Time to complete (ms)           |
| `total_time_seconds`   | number | Total completion time (seconds) |
| `timestamp`            | number | Unix timestamp                  |

**Funnel Analysis:**

```
carousel_session_start (100%)
  ↓
carousel_milestone_25 (X%)
  ↓
carousel_milestone_50 (Y%)
  ↓
carousel_milestone_75 (Z%)
  ↓
carousel_milestone_100 (W%)
```

---

### Carousel Article Events

#### `carousel_article_view`

**Trigger:** Article becomes visible in carousel  
**Purpose:** Track individual article impressions with context

| Parameter                 | Type    | Description                            | Analysis Use         |
| ------------------------- | ------- | -------------------------------------- | -------------------- |
| `brand`                   | string  | Brand shortcode                        | Segmentation         |
| `article_id`              | string  | Article identifier                     | Content tracking     |
| `article_title`           | string  | Article title                          | Content analysis     |
| `article_category`        | string  | Article category                       | Category performance |
| `position`                | number  | Article position in carousel (0-based) | Position analysis    |
| `total_articles`          | number  | Total articles in carousel             | Context              |
| `position_percentage`     | number  | Position as % of total (0-100)         | Relative position    |
| `is_new_max`              | boolean | Whether this is furthest point reached | Progression          |
| `max_index_so_far`        | number  | Furthest index reached so far          | Scroll depth         |
| `scroll_depth_percentage` | number  | Current scroll depth %                 | Engagement           |
| `scroll_direction`        | string  | `"forward"`, `"backward"`, or `null`   | Navigation pattern   |
| `is_backward_scroll`      | boolean | Whether scrolling backwards            | Re-engagement        |
| `is_auto_play`            | boolean | Whether auto-advanced or manual        | Interaction type     |
| `unique_indexes_viewed`   | number  | Unique positions viewed so far         | Exploration          |
| `session_duration_ms`     | number  | Time in carousel so far (ms)           | Session context      |
| `timestamp`               | number  | Unix timestamp                         | Time analysis        |

**Key Insights:**

- Position performance (which positions get most views)
- Auto-play vs manual engagement
- Backward scrolling indicates re-engagement

#### `carousel_article_dwell`

**Trigger:** User moves away from an article  
**Purpose:** Measure time spent viewing each article

| Parameter            | Type    | Description                    | Analysis Use          |
| -------------------- | ------- | ------------------------------ | --------------------- |
| `brand`              | string  | Brand shortcode                | Segmentation          |
| `article_id`         | string  | Article identifier             | Content tracking      |
| `article_title`      | string  | Article title                  | Content analysis      |
| `article_category`   | string  | Article category               | Category performance  |
| `dwell_time_ms`      | number  | Time viewing article (ms)      | **Engagement metric** |
| `dwell_time_seconds` | number  | Time viewing article (seconds) | **Engagement metric** |
| `position`           | number  | Article position (0-based)     | Position analysis     |
| `was_auto_play`      | boolean | Whether auto-advanced          | Interaction type      |
| `timestamp`          | number  | Unix timestamp                 | Time analysis         |

**Analysis Use Cases:**

- Identify engaging content (high dwell time)
- Compare dwell time by position
- Correlate dwell time with click-through

#### `carousel_article_click`

**Trigger:** User taps article to read full content  
**Purpose:** Track click-through from carousel

| Parameter                         | Type    | Description                          | Analysis Use         |
| --------------------------------- | ------- | ------------------------------------ | -------------------- |
| `brand`                           | string  | Brand shortcode                      | Segmentation         |
| `article_id`                      | string  | Article identifier                   | Content tracking     |
| `article_title`                   | string  | Article title                        | Content analysis     |
| `article_category`                | string  | Article category                     | Category performance |
| `position`                        | number  | Article position (0-based)           | Position CTR         |
| `dwell_time_before_click_ms`      | number  | Dwell time before clicking (ms)      | Decision time        |
| `dwell_time_before_click_seconds` | number  | Dwell time before clicking (seconds) | Decision time        |
| `total_articles`                  | number  | Total articles in carousel           | Context              |
| `articles_viewed_before_click`    | number  | Articles viewed before clicking      | Exploration          |
| `max_index_reached`               | number  | Furthest index reached               | Scroll depth         |
| `scroll_depth_percentage`         | number  | Scroll depth at click (%)            | Engagement           |
| `click_depth_percentage`          | number  | Position of click as %               | Click position       |
| `clicked_before_completion`       | boolean | Whether clicked before end           | Early conversion     |
| `articles_remaining`              | number  | Articles not yet viewed              | Opportunity          |
| `timestamp`                       | number  | Unix timestamp                       | Time analysis        |

**Key Metrics:**

- Click-through rate (CTR) by position
- Dwell time before click (decision time)
- Scroll depth at click (engagement level)

---

### Carousel Interaction Events

#### `carousel_manual_scroll_start`

**Trigger:** User begins manual scroll gesture  
**Purpose:** Track active user engagement

| Parameter                 | Type   | Description              |
| ------------------------- | ------ | ------------------------ |
| `brand`                   | string | Brand shortcode          |
| `current_index`           | number | Current article index    |
| `max_index_reached`       | number | Furthest index reached   |
| `scroll_depth_percentage` | number | Current scroll depth (%) |
| `total_articles`          | number | Total articles           |
| `timestamp`               | number | Unix timestamp           |

#### `carousel_manual_scroll_end`

**Trigger:** User completes manual scroll gesture  
**Purpose:** Track scroll completion

| Parameter                 | Type   | Description            |
| ------------------------- | ------ | ---------------------- |
| `brand`                   | string | Brand shortcode        |
| `current_index`           | number | New article index      |
| `max_index_reached`       | number | Furthest index reached |
| `scroll_depth_percentage` | number | New scroll depth (%)   |
| `timestamp`               | number | Unix timestamp         |

#### `carousel_auto_advance`

**Trigger:** Carousel automatically advances to next article  
**Purpose:** Track auto-play progression

| Parameter           | Type   | Description            |
| ------------------- | ------ | ---------------------- |
| `brand`             | string | Brand shortcode        |
| `from_position`     | number | Previous article index |
| `to_position`       | number | New article index      |
| `total_articles`    | number | Total articles         |
| `max_index_reached` | number | Furthest index reached |
| `timestamp`         | number | Unix timestamp         |

#### `carousel_backward_scroll`

**Trigger:** User scrolls backwards to previous article  
**Purpose:** Track re-engagement with previous content

| Parameter           | Type   | Description                      | Analysis Use        |
| ------------------- | ------ | -------------------------------- | ------------------- |
| `brand`             | string | Brand shortcode                  | Segmentation        |
| `from_index`        | number | Previous index                   | Navigation pattern  |
| `to_index`          | number | New index                        | Navigation pattern  |
| `scroll_distance`   | number | Number of articles scrolled back | Re-engagement depth |
| `max_index_reached` | number | Furthest index reached           | Context             |
| `article_id`        | string | Article ID scrolled to           | Content interest    |
| `timestamp`         | number | Unix timestamp                   | Time analysis       |

**Analysis Insight:**
Backward scrolling indicates high engagement - users want to revisit content.

---

## Paywall Analytics

The paywall tracking captures subscription prompt interactions to measure conversion funnel effectiveness.

### Paywall Events

#### `paywall_shown`

**Trigger:** Paywall modal is displayed to user
**Purpose:** Track paywall impressions and configuration

| Parameter           | Type    | Description                      | Analysis Use         |
| ------------------- | ------- | -------------------------------- | -------------------- |
| `brand`             | string  | Brand shortcode                  | Segmentation         |
| `headline`          | string  | Paywall headline text            | A/B testing          |
| `has_benefits`      | boolean | Whether benefits list is shown   | Configuration impact |
| `benefits_count`    | number  | Number of benefits displayed     | Content analysis     |
| `has_primary_url`   | boolean | Whether primary button has URL   | Flow type            |
| `has_secondary_url` | boolean | Whether secondary button has URL | Flow type            |
| `timestamp`         | number  | Unix timestamp                   | Time analysis        |

**Analysis Use Cases:**

- Paywall impression rate
- Configuration impact on conversion
- A/B testing different headlines
- Benefits list effectiveness

#### `paywall_subscribe_clicked`

**Trigger:** User clicks primary subscription button
**Purpose:** Track subscription intent and button effectiveness

| Parameter     | Type    | Description                          | Analysis Use      |
| ------------- | ------- | ------------------------------------ | ----------------- |
| `brand`       | string  | Brand shortcode                      | Segmentation      |
| `button_text` | string  | Text on button clicked               | Button copy test  |
| `has_url`     | boolean | Whether button opens URL or callback | Flow type         |
| `url`         | string  | URL opened or "callback"             | Destination track |
| `headline`    | string  | Paywall headline shown               | Context           |
| `timestamp`   | number  | Unix timestamp                       | Time analysis     |

**Key Metrics:**

- Click-through rate (CTR): `paywall_subscribe_clicked` / `paywall_shown`
- Conversion by button text
- URL vs callback performance

#### `paywall_signin_clicked`

**Trigger:** User clicks secondary sign-in button
**Purpose:** Track existing subscriber engagement

| Parameter     | Type    | Description                          | Analysis Use      |
| ------------- | ------- | ------------------------------------ | ----------------- |
| `brand`       | string  | Brand shortcode                      | Segmentation      |
| `button_text` | string  | Text on button clicked               | Button copy test  |
| `has_url`     | boolean | Whether button opens URL or callback | Flow type         |
| `url`         | string  | URL opened or "callback"             | Destination track |
| `headline`    | string  | Paywall headline shown               | Context           |
| `timestamp`   | number  | Unix timestamp                       | Time analysis     |

**Key Metrics:**

- Sign-in rate: `paywall_signin_clicked` / `paywall_shown`
- Existing subscriber identification
- Authentication flow effectiveness

### Paywall Funnel Analysis

```
paywall_shown (100%)
  ↓
  ├─→ paywall_subscribe_clicked (X%)
  │     ↓
  │   [Subscription Flow]
  │
  └─→ paywall_signin_clicked (Y%)
        ↓
      [Authentication Flow]
```

**Key Conversion Metrics:**

- **Subscription CTR:** % of impressions leading to subscribe click
- **Sign-in CTR:** % of impressions leading to sign-in click
- **Total Engagement:** Combined CTR of both buttons
- **Button Preference:** Ratio of subscribe vs sign-in clicks

---

## Session Tracking

### Session Duration Calculation

**Session Start:**

- Triggered on app launch or return from background
- Timestamp recorded in `session_start` event

**Session End:**

- Triggered on app termination or extended background time
- Duration calculated: `session_end.timestamp - session_start.timestamp`

**Metrics Available:**

- `duration_ms` - Milliseconds (precise)
- `duration_seconds` - Seconds (readable)
- `duration_minutes` - Minutes (summary)

### Screen Time Calculation

**Per Screen:**

- Start time recorded on screen entry
- End time recorded on screen exit
- Duration logged in `screen_time` event

**Analysis:**

```sql
-- Average time per screen
SELECT
  screen_name,
  AVG(duration_seconds) as avg_seconds,
  COUNT(*) as view_count
FROM screen_time_events
GROUP BY screen_name
ORDER BY avg_seconds DESC
```

---

## Navigation Tracking

### Navigation Flow

Every screen transition is logged with:

- Source screen (`from_screen`)
- Destination screen (`to_screen`)
- Navigation parameters (if any)

### Common Navigation Paths

```
App Launch → Highlights (carousel)
Highlights → Article Detail
Article Detail → Back to Highlights
Highlights → Articles Tab
Articles Tab → Article Detail
```

### Analysis Queries

**Most Common Paths:**

```sql
SELECT
  from_screen,
  to_screen,
  COUNT(*) as transition_count
FROM screen_navigation_events
GROUP BY from_screen, to_screen
ORDER BY transition_count DESC
LIMIT 10
```

---

## Data Dictionary

### Common Parameters

| Parameter          | Type   | Range/Format            | Description              |
| ------------------ | ------ | ----------------------- | ------------------------ |
| `brand`            | string | `"cn"`, `"nt"`, `"jnl"` | Brand identifier         |
| `timestamp`        | number | Unix timestamp (ms)     | Event time               |
| `article_id`       | string | Numeric string          | Article identifier       |
| `article_title`    | string | Text                    | Article title            |
| `article_category` | string | Text                    | Article category         |
| `position`         | number | 0 to N-1                | Array index (0-based)    |
| `index`            | number | 0 to N-1                | Array index (0-based)    |
| `duration_ms`      | number | 0+                      | Duration in milliseconds |
| `duration_seconds` | number | 0+                      | Duration in seconds      |
| `percentage`       | number | 0-100                   | Percentage value         |

### Calculated Metrics

| Metric          | Formula                                    | Description              |
| --------------- | ------------------------------------------ | ------------------------ |
| Scroll Depth %  | `((max_index + 1) / total_articles) * 100` | How far user scrolled    |
| Completion Rate | `(unique_indexes / total_articles) * 100`  | % of carousel viewed     |
| Position %      | `((position + 1) / total_articles) * 100`  | Relative position        |
| CTR             | `(clicks / views) * 100`                   | Click-through rate       |
| Avg Dwell Time  | `SUM(dwell_time_ms) / COUNT(views)`        | Average time per article |

---

## Analysis Examples

### 1. Carousel Engagement Funnel

**Question:** How many users complete the carousel?

```sql
WITH funnel AS (
  SELECT
    user_pseudo_id,
    MAX(CASE WHEN event_name = 'carousel_session_start' THEN 1 ELSE 0 END) as started,
    MAX(CASE WHEN event_name = 'carousel_milestone_25' THEN 1 ELSE 0 END) as reached_25,
    MAX(CASE WHEN event_name = 'carousel_milestone_50' THEN 1 ELSE 0 END) as reached_50,
    MAX(CASE WHEN event_name = 'carousel_milestone_75' THEN 1 ELSE 0 END) as reached_75,
    MAX(CASE WHEN event_name = 'carousel_milestone_100' THEN 1 ELSE 0 END) as completed
  FROM `project.analytics_XXXXX.events_*`
  WHERE _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
  GROUP BY user_pseudo_id
)
SELECT
  SUM(started) as total_sessions,
  ROUND(100.0 * SUM(reached_25) / SUM(started), 2) as pct_reached_25,
  ROUND(100.0 * SUM(reached_50) / SUM(started), 2) as pct_reached_50,
  ROUND(100.0 * SUM(reached_75) / SUM(started), 2) as pct_reached_75,
  ROUND(100.0 * SUM(completed) / SUM(started), 2) as completion_rate
FROM funnel
```

### 2. Scroll Depth Distribution

**Question:** Where do users typically stop scrolling?

```sql
SELECT
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'max_index_reached') as max_index,
  COUNT(*) as session_count,
  ROUND(AVG(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'scroll_depth_percentage')
  ), 2) as avg_scroll_depth_pct
FROM `project.analytics_XXXXX.events_*`
WHERE event_name = 'carousel_session_end'
  AND _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
GROUP BY max_index
ORDER BY max_index
```

### 3. Article Performance by Position

**Question:** Which carousel positions get the most engagement?

```sql
SELECT
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'position') as position,
  COUNT(DISTINCT CASE WHEN event_name = 'carousel_article_view' THEN
    CONCAT(user_pseudo_id, event_timestamp) END) as views,
  COUNT(DISTINCT CASE WHEN event_name = 'carousel_article_click' THEN
    CONCAT(user_pseudo_id, event_timestamp) END) as clicks,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_name = 'carousel_article_click' THEN
    CONCAT(user_pseudo_id, event_timestamp) END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_name = 'carousel_article_view' THEN
    CONCAT(user_pseudo_id, event_timestamp) END), 0), 2) as ctr,
  ROUND(AVG(CASE WHEN event_name = 'carousel_article_dwell' THEN
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'dwell_time_seconds')
    END), 2) as avg_dwell_seconds
FROM `project.analytics_XXXXX.events_*`
WHERE event_name IN ('carousel_article_view', 'carousel_article_click', 'carousel_article_dwell')
  AND _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
GROUP BY position
ORDER BY position
```

### 4. Brand Comparison

**Question:** How does carousel engagement differ by brand?

```sql
SELECT
  (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'brand') as brand,
  COUNT(*) as total_sessions,
  ROUND(AVG(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'scroll_depth_percentage')
  ), 2) as avg_scroll_depth,
  ROUND(AVG(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'session_duration_seconds')
  ), 2) as avg_session_seconds,
  ROUND(100.0 * SUM(CASE WHEN
    (SELECT value.bool_value FROM UNNEST(event_params) WHERE key = 'reached_end') = true
    THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate
FROM `project.analytics_XXXXX.events_*`
WHERE event_name = 'carousel_session_end'
  AND _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
GROUP BY brand
ORDER BY brand
```

### 5. Drop-off Heatmap

**Question:** Where do users drop off most frequently?

```sql
SELECT
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'drop_off_index') as drop_off_index,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'last_article_id') as article_id,
  COUNT(*) as drop_off_count,
  ROUND(AVG(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'time_before_drop_off_ms')
  ) / 1000, 2) as avg_time_before_drop_off_sec
FROM `project.analytics_XXXXX.events_*`
WHERE event_name = 'carousel_drop_off'
  AND _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
GROUP BY drop_off_index, article_id
ORDER BY drop_off_count DESC
LIMIT 20
```

### 6. Session Duration Analysis

**Question:** What's the average session duration by brand?

```sql
SELECT
  (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'brand') as brand,
  COUNT(*) as total_sessions,
  ROUND(AVG(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'duration_seconds')
  ), 2) as avg_session_seconds,
  ROUND(PERCENTILE_CONT(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'duration_seconds'), 0.5
  ) OVER (PARTITION BY (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'brand')), 2) as median_session_seconds
FROM `project.analytics_XXXXX.events_*`
WHERE event_name = 'session_end'
  AND _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
GROUP BY brand
ORDER BY avg_session_seconds DESC
```

---

## BigQuery Schema

### Event Structure

```json
{
  "event_date": "20250120",
  "event_timestamp": 1705747200000000,
  "event_name": "carousel_article_view",
  "event_params": [
    { "key": "brand", "value": { "string_value": "cn" } },
    { "key": "article_id", "value": { "string_value": "528406" } },
    { "key": "position", "value": { "int_value": 2 } },
    { "key": "scroll_depth_percentage", "value": { "int_value": 30 } }
  ],
  "user_properties": [
    { "key": "brand", "value": { "string_value": "cn" } },
    { "key": "brand_name", "value": { "string_value": "Construction News" } }
  ],
  "user_pseudo_id": "ABC123XYZ"
}
```

### Key Tables

- `events_YYYYMMDD` - Daily event tables
- `events_intraday_YYYYMMDD` - Real-time events (last 3 days)
- `events_*` - Wildcard for querying multiple days

---

## Privacy & Compliance

### Data Collection

✅ **Collected:**

- Anonymous user IDs (Firebase-generated)
- Event timestamps
- Screen names and navigation paths
- Article IDs and titles
- Engagement metrics (time, scroll depth)
- Device type and OS version (Firebase automatic)

❌ **NOT Collected:**

- Personal Identifiable Information (PII)
- Email addresses
- Names
- Location data (unless explicitly enabled)
- Contact information

### User Control

Users can opt-out of analytics via:

```typescript
analyticsService.setAnalyticsEnabled(false);
```

### GDPR Compliance

- Data is anonymized
- No PII collected
- User can request data deletion via Firebase
- Complies with GDPR requirements

---

## Support & Questions

For questions about this tracking implementation, contact:

- **Technical Implementation:** Development Team
- **Data Analysis:** Data Team
- **Product Questions:** Product Management

**Document Version:** 1.0  
**Last Updated:** January 2025
