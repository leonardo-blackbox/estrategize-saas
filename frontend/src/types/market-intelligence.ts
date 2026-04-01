// ============================================================================
// Market Intelligence — Frontend TypeScript Types
// ============================================================================

// --------------------------------------------------------------------------
// Instagram Snapshot
// --------------------------------------------------------------------------

export interface InstagramLatestPost {
  type: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  url: string;
  displayUrl?: string;
}

export interface InstagramContentBreakdown {
  reels: number;
  photos: number;
  carousels: number;
}

export interface InstagramProfileData {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isBusinessAccount: boolean;
  businessCategoryName: string | null;
  externalUrl: string | null;
  profilePicUrl: string;
  engagementRate: number;
  postsPerWeek: number;
  contentBreakdown: InstagramContentBreakdown;
  latestPosts: InstagramLatestPost[];
}

export type InstagramSnapshotStatus = 'not_started' | 'pending' | 'running' | 'done' | 'failed';

export interface InstagramSnapshotResponse {
  status: InstagramSnapshotStatus;
  handle: string | null;
  data: InstagramProfileData | null;
  scraped_at: string | null;
}

// --------------------------------------------------------------------------
// Market Research
// --------------------------------------------------------------------------

export type MarketResearchStatus =
  | 'not_started'
  | 'pending'
  | 'running_maps'
  | 'running_instagram'
  | 'running_websites'
  | 'running_ai'
  | 'done'
  | 'failed';

export interface CompetitorData {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewsCount: number | null;
  instagramHandle: string | null;
  source: 'google_maps' | 'instagram_search';
  instagramData?: InstagramProfileData | null;
}

export interface KeyInsights {
  opportunities: string[];
  threats: string[];
  positioning: string;
}

export interface MarketResearchResponse {
  id?: string;
  status: MarketResearchStatus;
  progress_step: number;
  progress_label: string;
  competitors_count: number;
  competitors_discovered?: CompetitorData[] | null;
  report_markdown: string | null;
  key_insights: KeyInsights | null;
  rag_indexed: boolean;
  error_message: string | null;
  created_at?: string;
  completed_at: string | null;
}

// --------------------------------------------------------------------------
// Plugin Config
// --------------------------------------------------------------------------

export interface ReportSections {
  market_overview: boolean;
  competitor_analysis: boolean;
  social_media_analysis: boolean;
  digital_presence: boolean;
  opportunities: boolean;
  threats: boolean;
  positioning: boolean;
  action_plan: boolean;
}

export interface PesquisaMercadoConfig {
  enabled: boolean;
  instagram_scan_enabled: boolean;
  instagram_posts_count: 6 | 12 | 24 | 48;
  instagram_engagement_rate: boolean;
  instagram_posting_frequency: boolean;
  instagram_hashtag_analysis: boolean;
  instagram_content_breakdown: boolean;
  discovery_sources: Array<'google_maps' | 'instagram_search'>;
  max_competitors_discover: 5 | 10 | 20 | 50;
  max_competitors_instagram: 3 | 5 | 10 | 20;
  include_competitor_websites: boolean;
  max_websites_scrape: 3 | 5 | 10;
  report_language: 'pt-BR' | 'en';
  report_style: 'executive' | 'detailed' | 'action-focused';
  report_sections: ReportSections;
  custom_system_prompt: string | null;
  ai_temperature: 0.3 | 0.5 | 0.7;
  auto_index_rag: boolean;
  rag_context_tag: string;
  include_raw_data_in_rag: boolean;
  credits_cost_basic: number;
  credits_cost_deep: number;
  free_first_research: boolean;
}
