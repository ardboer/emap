# Custom Analytics Events

This document lists all custom analytics events tracked in the application with their parameters.

## Session Events

### app_session_start

Application session started with brand context and timestamp

**Parameters:**

- `brand` - Brand shortcode
- `brand_name` - Full brand name
- `timestamp` - ISO timestamp of session start

### app_session_end

Application session ended with duration metrics

**Parameters:**

- `duration_ms` - Session duration in milliseconds
- `duration_seconds` - Session duration in seconds
- `duration_minutes` - Session duration in minutes

## Article Events

### article_view

User viewed an article with category and metadata

**Parameters:**

- `article_id` - Article identifier
- `article_title` - Article title
- `article_category` - Article category (optional)

## Search Events

### search_performed

User performed a search with term and results count

**Parameters:**

- `search_term` - Search query text
- `results_count` - Number of results returned

## Highlights Events

### highlights_view

User viewed an article in the highlights carousel

**Parameters:**

- `index` - Position in carousel (0-based)
- `article_id` - Article identifier
- `article_title` - Article title

### highlights_click

User clicked on an article in the highlights carousel

**Parameters:**

- `index` - Position in carousel (0-based)
- `article_id` - Article identifier
- `article_title` - Article title

## Carousel Session Events

### carousel_session_start

Carousel viewing session started with article composition details

**Parameters:**

- `total_articles` - Total number of articles in carousel
- `wordpress_count` - Number of WordPress articles
- `miso_count` - Number of Miso recommended articles
- `first_article_id` - ID of first article
- `first_article_title` - Title of first article
- `first_article_source` - Source of first article (wordpress/miso)
- `session_start_time` - ISO timestamp of session start

### carousel_session_end

Carousel viewing session ended with scroll depth and engagement metrics

**Parameters:**

- `session_duration_ms` - Total session duration in milliseconds
- `session_duration_seconds` - Total session duration in seconds
- `max_index_reached` - Highest index reached in carousel
- `scroll_depth_percentage` - Percentage of carousel scrolled
- `unique_indexes_viewed` - Number of unique articles viewed
- `completion_rate` - Percentage of articles viewed
- `reached_end` - Boolean if user reached end of carousel
- `total_articles` - Total number of articles
- `scroll_interactions` - Number of manual scroll interactions
- `avg_time_per_article` - Average time spent per article in ms

## Carousel Interaction Events

### carousel_article_press

User pressed on a carousel article to view full content

**Parameters:**

- `article_id` - Article identifier
- `article_title` - Article title
- `article_category` - Article category
- `article_source` - Article source (wordpress/miso)
- `is_recommended` - Boolean if article is recommended
- `position` - Position in carousel
- `total_articles` - Total articles in carousel
- `wordpress_count` - Number of WordPress articles
- `miso_count` - Number of Miso articles

### carousel_auto_advance

Carousel automatically advanced to next article

**Parameters:**

- `from_position` - Starting position
- `to_position` - Ending position
- `total_articles` - Total articles in carousel
- `max_index_reached` - Highest index reached so far
- `article_source` - Source of current article
- `is_native_ad` - Boolean if current item is a native ad

## Native Ad Events

### native_ad_click

User clicked on a native ad in the carousel

**Parameters:**

- `ad_id` - Ad identifier
- `position` - Position in carousel
- `dwell_time_ms` - Time spent viewing ad before click (ms)
- `dwell_time_seconds` - Time spent viewing ad before click (seconds)
- `is_real_ad` - Boolean indicating real ad vs placeholder

### native_ad_choices_click

User clicked on AdChoices icon in carousel native ad

**Parameters:**

- `ad_id` - Ad identifier
- `position` - Position in carousel

### native_ad_list_impression

Native ad impression tracked in list view

**Parameters:**

- `view_type` - Type of list view (e.g., "horizontal", "vertical")
- `position` - Position in list
- `block_index` - Index of content block
- `time_to_view_ms` - Time from load to view in milliseconds

### native_ad_list_click

User clicked on a native ad in list view

**Parameters:**

- `view_type` - Type of list view
- `position` - Position in list
- `block_index` - Index of content block
- `dwell_time_ms` - Time spent viewing before click (ms)
- `dwell_time_seconds` - Time spent viewing before click (seconds)

### native_ad_list_choices_click

User clicked on AdChoices icon in list view native ad

**Parameters:**

- `view_type` - Type of list view
- `position` - Position in list
- `block_index` - Index of content block

## Paywall Events

### paywall_shown

Paywall modal displayed to user

**Parameters:**

- `headline` - Paywall headline text
- `has_benefits` - Boolean if benefits list is shown

### paywall_subscribe_clicked

User clicked subscribe button on paywall

**Parameters:**

- `button_text` - Text on subscribe button
- `has_url` - Boolean if button has external URL
- `url` - URL or "callback" if using callback
- `headline` - Paywall headline text

### paywall_signin_clicked

User clicked sign-in button on paywall

**Parameters:**

- `button_text` - Text on sign-in button
- `headline` - Paywall headline text

## Global Parameters

All events automatically include these parameters:

- `brand` - Current brand shortcode
- `timestamp` - Event timestamp in milliseconds
