export interface GeneratedContent {
  title: string;
  description: string;
  hashtags: string[];
  keywords: string[];
  contentType: string;
  estimatedReach: 'High' | 'Medium' | 'Low';
}

export interface CarouselIdea {
  id: string;
  title: string;
  hook: string;
  slides: number;
  engagementScore: number;
  trendingTag: string;
  format: 'Educational' | 'Story' | 'Tips' | 'Listicle' | 'Comparison';
}

export interface UserPreferences {
  platform: string;
  niche: string;
  isSetupComplete: boolean;
}

export type HomePlatform =
  | 'Instagram'
  | 'TikTok'
  | 'LinkedIn'
  | 'Pinterest'
  | 'YouTube'
  | 'Twitter/X';
