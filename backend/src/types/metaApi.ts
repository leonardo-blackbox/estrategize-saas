/**
 * Shared types for Meta Graph API integration (Epic 10)
 * Suporta Instagram Business Login (padrão Onda 1) e Facebook Login (futuro)
 */

export type MetaAuthFlow = 'instagram_business_login' | 'facebook_login';
export type MetaAccountType = 'BUSINESS' | 'CREATOR';
export type MetaConnectionStatus = 'active' | 'expired' | 'revoked' | 'error';

export interface MetaConnection {
  id: string;
  consultancy_id: string;
  user_id: string;
  ig_user_id: string;
  ig_username: string;
  account_type: MetaAccountType;
  auth_flow: MetaAuthFlow;
  page_id: string | null;
  page_name: string | null;
  scopes: string[];
  status: MetaConnectionStatus;
  expires_at: string;
  last_refreshed_at: string | null;
  last_snapshot_at: string | null;
  last_error: string | null;
  connected_at: string;
  updated_at: string;
}

/**
 * MetaConnection sem campos sensíveis — seguro para envio ao frontend.
 */
export type MetaConnectionPublic = Omit<MetaConnection, 'user_id'> & { user_id?: never };

export interface MetaApiErrorJson {
  message: string;
  type?: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export class MetaApiError extends Error {
  code: number;
  type?: string;
  subcode?: number;
  fbTraceId?: string;
  httpStatus: number;

  constructor(
    message: string,
    code: number,
    httpStatus: number,
    options: { type?: string; subcode?: number; fbTraceId?: string } = {},
  ) {
    super(message);
    this.name = 'MetaApiError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.type = options.type;
    this.subcode = options.subcode;
    this.fbTraceId = options.fbTraceId;
  }

  isTokenExpired(): boolean {
    return this.code === 190;
  }

  isRateLimited(): boolean {
    return this.code === 4 || this.code === 17 || this.code === 32 || this.httpStatus === 429;
  }

  isPermissionMissing(): boolean {
    return this.code === 200 || this.code === 10;
  }
}

// ============================================================================
// Insights — Account
// ============================================================================

export interface AccountMetric {
  name: string;
  values: Array<{ value: number; end_time?: string }>;
}

export interface AccountInsightsRaw {
  data: AccountMetric[];
}

export interface AccountInsightsAggregate {
  reach: number;
  views: number;
  accounts_engaged: number;
  profile_views: number;
  profile_links_taps: number;
  total_interactions: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  replies: number;
  follows: number;
  unfollows: number;
}

export interface AccountInsightsResponse {
  summary: AccountSummary;
  current: AccountInsightsAggregate;
  previous: AccountInsightsAggregate;
  delta: AccountInsightsAggregate;
  period: { since: string; until: string };
  capturedAt: string;
}

export interface AccountSummary {
  ig_username: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  biography: string | null;
  profile_picture_url: string | null;
  account_type: MetaAccountType;
}

// ============================================================================
// Insights — Media
// ============================================================================

export type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
export type MediaProductType = 'FEED' | 'REELS' | 'STORY';

export interface MediaItem {
  id: string;
  caption?: string;
  media_type: MediaType;
  media_product_type: MediaProductType;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

export interface MediaInsightsMetrics {
  reach?: number;
  views?: number;
  likes?: number;
  comments?: number;
  saved?: number;
  shares?: number;
  total_interactions?: number;
  profile_visits?: number;
  profile_activity?: number;
  follows?: number;
  ig_reels_avg_watch_time?: number;
  ig_reels_video_view_total_time?: number;
  clips_replays_count?: number;
}

export interface MediaWithInsights extends MediaItem {
  metrics: MediaInsightsMetrics;
}

export interface MediaListResponse {
  items: MediaWithInsights[];
  nextCursor: string | null;
}

// ============================================================================
// Insights — Audience
// ============================================================================

export type AudienceType = 'follower' | 'engaged';

export interface AgeGenderBreakdown {
  [key: string]: number;
}

export interface LocationBreakdown {
  city?: string;
  country: string;
  percent: number;
}

export interface AudienceData {
  total_followers: number | null;
  age_gender: AgeGenderBreakdown;
  top_cities: LocationBreakdown[];
  top_countries: LocationBreakdown[];
  locales: Array<{ locale: string; percent: number }>;
}

export interface AudienceResponse {
  follower: AudienceData | null;
  engaged: AudienceData | null;
  capturedAt: string;
}

// ============================================================================
// Stories
// ============================================================================

export interface StoryMetrics {
  views?: number;
  reach?: number;
  replies?: number;
  navigation?: number;
  profile_visits?: number;
  follows?: number;
  shares?: number;
  reposts?: number;
  total_interactions?: number;
}

export interface StoryItem {
  id: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
  media_type?: string;
  metrics: StoryMetrics;
}

// ============================================================================
// OAuth flow
// ============================================================================

export interface OAuthState {
  consultancyId: string;
  userId: string;
  nonce: string;
}

export interface IBLTokenExchangeResponse {
  access_token: string;
  user_id: number;
}

export interface IBLLongLivedTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface InstagramUserInfo {
  user_id: string;
  username: string;
  account_type: MetaAccountType;
  name?: string;
  profile_picture_url?: string;
}
