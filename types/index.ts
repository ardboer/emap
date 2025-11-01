export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  leadText: string;
  content: string | StructuredContentNode[];
  imageUrl: string;
  timestamp: string;
  category: string;
  isLandscape?: boolean;
  source?: "wordpress" | "miso"; // Article source
  isRecommended?: boolean; // Flag for recommended articles
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

export interface CategoryPost {
  post_id: number;
  post_title: string;
  post_url: string;
  post_image: string;
  post_image_width: number;
  post_image_height: number;
  post_publish_date: string;
}

export interface CategoryBlock {
  block_layout: string;
  block_title: string;
  block_description: string;
  block_bottom_more_news_link: string;
  block_bottom_more_news_link_url: string;
  posts: CategoryPost[];
}

export interface CategoryResponse {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: any[];
  yoast_head: string;
  yoast_head_json: any;
  blocks: CategoryBlock[];
}

// Transformed block structure for grouped article display
export interface ArticleBlock {
  blockTitle: string;
  blockLayout: string;
  blockDescription: string;
  blockBottomLink?: string;
  blockBottomLinkUrl?: string;
  articles: Article[];
}

export interface CategoryContentResponse {
  categoryInfo: {
    id: number;
    name: string;
    description: string;
    slug: string;
  };
  blocks: ArticleBlock[];
}

// Clinical articles API types
export interface ClinicalPost {
  post_id: number;
  post_title: string;
  post_excerpt: string;
  post_url: string;
  post_image: string;
  post_image_width: number;
  post_image_height: number;
  post_publish_date: string;
}

export interface ClinicalArticlesResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  articles: ClinicalPost[];
}

// Magazine-related types for emap-epaper-development API
export interface MagazineEditionsResponse {
  editions: string[];
}

export interface MagazineArticleContent {
  type: string;
  content?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  children?: MagazineArticleContent[];
}

export interface MagazineArticleResponse {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  publishDate: string;
  content: MagazineArticleContent[];
  tags?: string[];
  category?: string;
  imageUrl?: string;
  summary?: string;
}

export interface MagazineEdition {
  id: string;
  title?: string;
  publishDate?: string;
  coverUrl?: string;
  pdfUrl?: string;
}

// PDF Article Detail types for emap-epaper API
export interface PDFArticleBlock {
  bbox: number[];
  text: string;
  type: string;
  avg_size: number;
  bg_rgb: number[];
}

export interface PDFArticleInfobox {
  bbox: number[];
  text: string;
  type: string;
  avg_size: number;
  bg_rgb: number[];
}

export interface PDFArticleContent {
  plain: string;
  paragraphs: string[];
}

export interface PDFArticleDetail {
  article_id: string;
  page: number;
  title: string;
  bbox: number[];
  blocks: PDFArticleBlock[];
  infoboxes: PDFArticleInfobox[];
  content: PDFArticleContent;
  endpoints: {
    self: string;
  };
}
