export type WpRendered = {
  rendered: string;
  protected?: boolean;
};

export type WpPost = {
  id: number;
  slug: string;
  date: string;
  modified: string;
  link: string;
  title: WpRendered;
  excerpt: WpRendered;
  content: WpRendered;
  featured_media: number;
};

export type WpMedia = {
  id: number;
  source_url: string;
  alt_text: string;
  title?: WpRendered;
};

export type Story = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  index: string;
  link?: string;
  image?: {
    src: string;
    alt: string;
  };
};
