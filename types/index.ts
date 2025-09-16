export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  leadText: string;
  content: string;
  imageUrl: string;
  timestamp: string;
  category: string;
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
