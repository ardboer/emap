export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  leadText: string;
  content: string | StructuredContentNode[];
  imageUrl: string;
  timestamp: string;
  category: string;
}

export interface StructuredContentNode {
  typename: string;
  type: string;
  text?: string;
  children?: StructuredContentNode[];
  href?: string;
  class?: string;
  target?: string;
  rel?: string;
  code?: string; // For custom embeds
  relation?: {
    alt?: string;
    caption?: string;
    href: string;
    photographer?: string;
    typename: string;
    width?: number;
    height?: number;
  };
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  duration: string;
  publishDate: string;
  audioUrl: string;
}

export interface PodcastCategory {
  id: string;
  name: string;
  episodes: PodcastEpisode[];
}

export interface MenuItem {
  ID: number;
  title: string;
  url: string;
  object_id: string;
  object: string;
  type: string;
  type_label: string;
  menu_order: number;
  parent: string;
  target: string;
}

export interface MenuResponse {
  menu_id: number;
  menu_items: MenuItem[];
}

export interface Event {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  timestamp: string;
  link: string;
}

export interface WordPressEvent {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  featured_media: number;
  link: string;
}

export interface SearchResult {
  id: number;
  title: string;
  url: string;
  type: string;
  subtype: string;
  _links: {
    self: {
      embeddable: boolean;
      href: string;
      targetHints: {
        allow: string[];
      };
    }[];
    about: {
      href: string;
    }[];
    collection: {
      href: string;
    }[];
  };
}
