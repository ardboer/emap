# Analytics Events Reference

This document lists all analytics events tracked in the application for the data team.

## Global Parameters

All events automatically include these parameters:

- `brand` - Current brand shortcode
- `brand_name` - Full brand name
- `bundle_id` - Application bundle identifier
- `timestamp` - Event timestamp in milliseconds

## Standard Firebase Events (Auto-Collected)

| Event Name          | Description                                            | Custom Parameters |
| ------------------- | ------------------------------------------------------ | ----------------- |
| `first_open`        | User opens the app for the first time after installing | None              |
| `session_start`     | User session begins (Firebase reserved event)          | None              |
| `session_end`       | User session ends (Firebase reserved event)            | None              |
| `user_engagement`   | App is in the foreground                               | None              |
| `app_update`        | App is updated to a new version                        | None              |
| `app_remove`        | App is uninstalled (Android only)                      | None              |
| `app_clear_data`    | App data is cleared (Android only)                     | None              |
| `os_update`         | Device OS is updated                                   | None              |
| `firebase_campaign` | App is opened from a Firebase campaign link            | None              |

## Standard Firebase Events (Explicit)

| Event Name    | Description            | Custom Parameters                                                          |
| ------------- | ---------------------- | -------------------------------------------------------------------------- |
| `screen_view` | User views a screen    | `screen_name`, `screen_class`, `article_id`_, `article_title`_, `source`\* |
| `search`      | User performs a search | `search_term`                                                              |

\*Only included when viewing article detail screen

### screen_view Source Values

When viewing article detail, the `source` parameter indicates navigation origin:

- `highlights` - From highlights carousel
- `news` - From news tab
- `clinical` - From clinical tab
- `events` - From events tab
- `search` - From search results
- `push_notification` - From push notification
- `related_article` - From related articles
- `trending_block` - From trending articles block
- `settings_test` - From settings test button
- `direct` - Direct navigation or deep link

## Custom Events

### Session Events

| Event Name          | Description                 | Custom Parameters                                     |
| ------------------- | --------------------------- | ----------------------------------------------------- |
| `app_session_start` | Application session started | `brand`, `brand_name`, `timestamp`                    |
| `app_session_end`   | Application session ended   | `duration_ms`, `duration_seconds`, `duration_minutes` |

### Article Events

| Event Name     | Description                        | Custom Parameters                                   |
| -------------- | ---------------------------------- | --------------------------------------------------- |
| `article_view` | User viewed an article detail page | `article_id`, `article_title`, `article_category`\* |

\*Optional parameter

### Search Events

| Event Name         | Description                          | Custom Parameters              |
| ------------------ | ------------------------------------ | ------------------------------ |
| `search_performed` | User performed a search with results | `search_term`, `results_count` |

### Highlights Events

| Event Name         | Description                                           | Custom Parameters                      |
| ------------------ | ----------------------------------------------------- | -------------------------------------- |
| `highlights_view`  | User viewed an article in the highlights carousel     | `index`, `article_id`, `article_title` |
| `highlights_click` | User clicked on an article in the highlights carousel | `index`, `article_id`, `article_title` |

### Native Ad Events

| Event Name                     | Description                                | Custom Parameters                                                             |
| ------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------- |
| `native_ad_click`              | User clicked on a native ad in carousel    | `ad_id`, `position`, `dwell_time_ms`, `dwell_time_seconds`, `is_real_ad`      |
| `native_ad_choices_click`      | User clicked AdChoices icon in carousel ad | `ad_id`, `position`                                                           |
| `native_ad_list_impression`    | Native ad impression in list view          | `view_type`, `position`, `block_index`, `time_to_view_ms`                     |
| `native_ad_list_click`         | User clicked native ad in list view        | `view_type`, `position`, `block_index`, `dwell_time_ms`, `dwell_time_seconds` |
| `native_ad_list_choices_click` | User clicked AdChoices icon in list ad     | `view_type`, `position`, `block_index`                                        |

### Paywall Events

| Event Name                  | Description                              | Custom Parameters                           |
| --------------------------- | ---------------------------------------- | ------------------------------------------- |
| `paywall_shown`             | Paywall modal displayed to user          | `headline`, `has_benefits`                  |
| `paywall_subscribe_clicked` | User clicked subscribe button on paywall | `button_text`, `has_url`, `url`, `headline` |
| `paywall_signin_clicked`    | User clicked sign-in button on paywall   | `button_text`, `headline`                   |

## User Properties

These properties persist across sessions and are included with all events:

| Property Name      | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `user_id`          | User ID from authentication (when user is logged in) |
| `brand`            | Current brand shortcode                              |
| `brand_name`       | Full brand name                                      |
| `bundle_id`        | Application bundle identifier                        |
| `features_enabled` | Comma-separated list of enabled features             |

## Event Count Summary

- **Standard Firebase Events (Auto):** 9 events
- **Standard Firebase Events (Explicit):** 2 events
- **Custom Events:** 14 events
- **Total Events:** 25 events

## Notes

- All timestamps are in milliseconds since epoch
- Duration values are provided in multiple units (ms, seconds, minutes) for convenience
- The `screen_view` event is a standard Firebase event with additional custom parameters for article detail screens
- Native ad events distinguish between carousel and list view contexts
- Search events are logged twice: once as standard Firebase `search` and once as custom `search_performed` with results count
- The `user_id` property is automatically set when a user logs in and cleared when they log out
