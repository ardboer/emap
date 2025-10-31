# Podcast RSS Feed Implementation

## Overview

This document describes the implementation of podcast RSS feed integration, replacing mock podcast data with real Podbean RSS feeds.

## Changes Made

### 1. Type Definitions

#### `brands/index.ts`

- Added `PodcastFeed` interface with `name` and `url` properties
- Added optional `podcastFeeds` array to `BrandConfig` interface

```typescript
export interface PodcastFeed {
  name: string;
  url: string;
}

export interface BrandConfig {
  // ... existing fields
  podcastFeeds?: PodcastFeed[];
}
```

### 2. Brand Configurations

#### NT Brand (`brands/nt/config.json`)

Added 4 Podbean RSS feeds:

- **CN First Site**: `https://feed.podbean.com/cnfirstsite/feed.xml`
- **LGC - The Local Authority**: `https://feed.podbean.com/thelocalauthority/feed.xml`
- **LGC – LGC Investment Series**: `https://feed.podbean.com/lgcinvestmentseries/feed.xml`
- **NCE – The Engineers Collective**: `https://feed.podbean.com/theengineerscollective/feed.xml`

#### CN Brand (`brands/cn/config.json`)

Added empty `podcastFeeds: []` array

#### JNL Brand (`brands/jnl/config.json`)

Added empty `podcastFeeds: []` array

### 3. Podcast Service (`services/podcast.ts`)

Created a new service to handle RSS feed fetching and parsing:

#### Key Functions:

**`parseXML(xmlString: string): RSSFeed`**

- Custom XML parser for RSS feeds
- Extracts channel information and episode items
- Handles iTunes-specific tags (image, duration)

**`formatDuration(duration?: string): string`**

- Converts duration from seconds or HH:MM:SS to readable format
- Examples: "45 min", "1h 30m"

**`formatPublishDate(pubDate?: string): string`**

- Converts publish date to relative time
- Examples: "Today", "Yesterday", "3 days ago"

**`fetchPodcastFeed(feedUrl: string, feedName: string): Promise<PodcastEpisode[]>`**

- Fetches RSS XML from Podbean
- Parses XML and converts to `PodcastEpisode` objects
- Handles errors gracefully, returns empty array on failure

**`fetchPodcastsByBrand(podcastFeeds: PodcastFeed[]): Promise<PodcastCategory[]>`**

- Main entry point for fetching podcasts
- Checks cache first (using existing cache service)
- Fetches all feeds in parallel
- Organizes episodes into categories by feed name
- Caches results for performance

**`clearPodcastCache(): Promise<void>`**

- Utility function to clear cached podcast data

#### RSS to PodcastEpisode Mapping:

| RSS Field             | PodcastEpisode Field      |
| --------------------- | ------------------------- |
| `<title>`             | `title`                   |
| `<description>`       | `description`             |
| `<itunes:image href>` | `coverUrl`                |
| `<itunes:duration>`   | `duration` (formatted)    |
| `<pubDate>`           | `publishDate` (formatted) |
| `<enclosure url>`     | `audioUrl`                |
| `<guid>`              | `id`                      |

### 4. Podcasts Screen (`app/(tabs)/podcasts.tsx`)

Updated to use RSS feeds instead of mock data:

#### New Features:

- **Loading State**: Shows spinner while fetching podcasts
- **Error Handling**: Displays error message with retry button
- **Smart Fallback**: Uses mock data if no feeds configured or on error
- **Automatic Loading**: Fetches podcasts on component mount
- **Brand-Aware**: Loads different feeds based on current brand

#### Flow:

1. Check if podcasts are enabled for brand
2. Load podcast feeds from brand config
3. If feeds exist, fetch from RSS using `fetchPodcastsByBrand()`
4. If no feeds or error, fallback to mock data
5. Display episodes organized by category (feed name)

## Usage

### For Brands with Podcast Feeds (NT)

The app will automatically fetch and display real podcast episodes from the configured Podbean RSS feeds.

### For Brands without Podcast Feeds (CN, JNL)

The app will use the existing mock podcast data as a fallback.

## Caching Strategy

- Podcast data is cached using the existing `CacheService`
- Cache key: `"podcast_feeds"`
- Cache is brand-specific (handled by CacheService)
- No explicit TTL, but cache can be cleared manually using `clearPodcastCache()`

## Error Handling

1. **Network Errors**: Caught and logged, displays error message with retry button
2. **Invalid RSS**: Caught and logged, returns empty episodes array
3. **Missing Feeds**: Displays "No podcast feeds configured for this brand" message
4. **Parsing Errors**: Logged, returns empty array for that feed
5. **No Episodes**: Displays "No podcast episodes available" message

## Testing

To test the implementation:

1. **NT Brand**: Should display 4 categories with real episodes from Podbean
2. **CN/JNL Brands**: Should display "No podcast feeds configured for this brand" error
3. **Offline**: Should use cached data or show error with retry button
4. **Error Scenarios**: Should show error message with retry button (only if feeds are configured)
5. **Empty Feeds**: Should display "No podcast episodes available" message

## Future Enhancements

1. **Pull-to-Refresh**: Add manual refresh capability
2. **Episode Details**: Show full episode description and metadata
3. **Download Support**: Allow offline listening
4. **Playback Progress**: Track and resume episode playback
5. **Search**: Search across all podcast episodes
6. **Favorites**: Mark episodes as favorites

## Dependencies

- **Native**: React Native's `fetch` API for HTTP requests
- **Storage**: `@react-native-async-storage/async-storage` (via CacheService)
- **No External XML Parser**: Custom lightweight XML parser included

## Performance Considerations

- Parallel fetching of multiple RSS feeds
- Caching to reduce network requests
- Graceful degradation on errors
- Minimal memory footprint with custom XML parser

## Backward Compatibility

- `podcastFeeds` is optional in `BrandConfig`
- Existing brands without feeds will show an appropriate error message
- No breaking changes to existing podcast functionality
- All existing podcast UI components remain unchanged
