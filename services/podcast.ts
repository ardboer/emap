import { PodcastFeed } from "@/brands";
import { PodcastCategory, PodcastEpisode } from "@/types";

const PODCAST_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

interface RSSItem {
  title?: string;
  description?: string;
  enclosure?: {
    url?: string;
  };
  pubDate?: string;
  "itunes:duration"?: string;
  "itunes:image"?: {
    href?: string;
  };
  guid?: string;
}

interface RSSChannel {
  title?: string;
  item?: RSSItem | RSSItem[];
  "itunes:image"?: {
    href?: string;
  };
}

interface RSSFeed {
  rss?: {
    channel?: RSSChannel;
  };
}

/**
 * Parse XML string to JavaScript object
 * Simple XML parser for RSS feeds
 */
function parseXML(xmlString: string): RSSFeed {
  try {
    // Remove XML declaration and namespaces for simpler parsing
    const cleanXml = xmlString
      .replace(/<\?xml[^?]*\?>/g, "")
      .replace(/xmlns[^"]*"[^"]*"/g, "");

    // Extract channel content
    const channelMatch = cleanXml.match(/<channel>([\s\S]*)<\/channel>/);
    if (!channelMatch) {
      throw new Error("No channel found in RSS feed");
    }

    const channelContent = channelMatch[1];

    // Extract channel title
    const titleMatch = channelContent.match(/<title>([^<]*)<\/title>/);
    const channelTitle = titleMatch ? titleMatch[1] : "Podcast";

    // Extract channel image
    const channelImageMatch = channelContent.match(
      /<itunes:image\s+href="([^"]*)"/
    );
    const channelImage = channelImageMatch ? channelImageMatch[1] : undefined;

    // Extract all items
    const itemMatches = channelContent.match(/<item>([\s\S]*?)<\/item>/g);
    const items: RSSItem[] = [];

    if (itemMatches) {
      for (const itemXml of itemMatches) {
        const item: RSSItem = {};

        // Extract title
        const titleMatch = itemXml.match(/<title>([^<]*)<\/title>/);
        if (titleMatch) item.title = titleMatch[1];

        // Extract description
        const descMatch = itemXml.match(/<description>([^<]*)<\/description>/);
        if (descMatch) item.description = descMatch[1];

        // Extract enclosure URL
        const enclosureMatch = itemXml.match(/<enclosure\s+url="([^"]*)"/);
        if (enclosureMatch) {
          item.enclosure = { url: enclosureMatch[1] };
        }

        // Extract pubDate
        const pubDateMatch = itemXml.match(/<pubDate>([^<]*)<\/pubDate>/);
        if (pubDateMatch) item.pubDate = pubDateMatch[1];

        // Extract duration
        const durationMatch = itemXml.match(
          /<itunes:duration>([^<]*)<\/itunes:duration>/
        );
        if (durationMatch) item["itunes:duration"] = durationMatch[1];

        // Extract image
        const imageMatch = itemXml.match(/<itunes:image\s+href="([^"]*)"/);
        if (imageMatch) {
          item["itunes:image"] = { href: imageMatch[1] };
        }

        // Extract guid
        const guidMatch = itemXml.match(/<guid[^>]*>([^<]*)<\/guid>/);
        if (guidMatch) item.guid = guidMatch[1];

        items.push(item);
      }
    }

    return {
      rss: {
        channel: {
          title: channelTitle,
          "itunes:image": channelImage ? { href: channelImage } : undefined,
          item: items,
        },
      },
    };
  } catch (error) {
    console.error("Error parsing XML:", error);
    throw error;
  }
}

/**
 * Format duration from seconds or HH:MM:SS to readable format
 */
function formatDuration(duration?: string): string {
  if (!duration) return "Unknown";

  // If it's already in a readable format, return it
  if (duration.includes(":")) {
    const parts = duration.split(":");
    if (parts.length === 3) {
      // HH:MM:SS
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} min`;
    } else if (parts.length === 2) {
      // MM:SS
      return `${parseInt(parts[0])} min`;
    }
  }

  // If it's in seconds
  const seconds = parseInt(duration);
  if (!isNaN(seconds)) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  }

  return duration;
}

/**
 * Format publish date to relative time
 */
function formatPublishDate(pubDate?: string): string {
  if (!pubDate) return "Unknown";

  try {
    const date = new Date(pubDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (error) {
    return pubDate;
  }
}

/**
 * Fetch and parse a single podcast RSS feed
 */
async function fetchPodcastFeed(
  feedUrl: string,
  feedName: string
): Promise<PodcastEpisode[]> {
  try {
    console.log(`Fetching podcast feed: ${feedName} from ${feedUrl}`);

    const response = await fetch(feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parsedFeed = parseXML(xmlText);

    const channel = parsedFeed.rss?.channel;
    if (!channel) {
      throw new Error("Invalid RSS feed structure");
    }

    // Get channel-level image as fallback
    const channelImage = channel["itunes:image"]?.href;

    // Convert items to array if it's a single item
    const items = Array.isArray(channel.item)
      ? channel.item
      : channel.item
      ? [channel.item]
      : [];

    // Map RSS items to PodcastEpisode format
    const episodes: PodcastEpisode[] = items.map((item, index) => ({
      id: item.guid || `${feedName}-${index}`,
      title: item.title || "Untitled Episode",
      description: item.description || "",
      coverUrl:
        item["itunes:image"]?.href ||
        channelImage ||
        "https://via.placeholder.com/200",
      duration: formatDuration(item["itunes:duration"]),
      publishDate: formatPublishDate(item.pubDate),
      audioUrl: item.enclosure?.url || "",
    }));

    console.log(
      `Successfully parsed ${episodes.length} episodes from ${feedName}`
    );
    return episodes;
  } catch (error) {
    console.error(`Error fetching podcast feed ${feedName}:`, error);
    return [];
  }
}

/**
 * Fetch all podcast feeds for a brand and organize into categories
 */
export async function fetchPodcastsByBrand(
  podcastFeeds: PodcastFeed[]
): Promise<PodcastCategory[]> {
  if (!podcastFeeds || podcastFeeds.length === 0) {
    console.log("No podcast feeds configured, returning empty array");
    return [];
  }

  try {
    console.log(`Fetching ${podcastFeeds.length} podcast feeds...`);

    // Fetch all feeds in parallel
    const feedPromises = podcastFeeds.map((feed) =>
      fetchPodcastFeed(feed.url, feed.name)
    );

    const feedResults = await Promise.all(feedPromises);

    // Create categories from feeds
    const categories: PodcastCategory[] = podcastFeeds
      .map((feed, index) => ({
        id: feed.name.toLowerCase().replace(/\s+/g, "-"),
        name: feed.name,
        episodes: feedResults[index],
      }))
      .filter((category) => category.episodes.length > 0); // Only include feeds with episodes

    console.log(`Successfully fetched ${categories.length} podcast categories`);
    return categories;
  } catch (error) {
    console.error("Error fetching podcasts by brand:", error);
    return [];
  }
}
