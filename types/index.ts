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
}

export interface PodcastCategory {
  id: string;
  name: string;
  episodes: PodcastEpisode[];
}
