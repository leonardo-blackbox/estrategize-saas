/**
 * Meta API client (Epic 10)
 * Wraps backend endpoints for OAuth connections and insights.
 */
import { client } from './client.ts';

export type MetaAuthFlow = 'instagram_business_login' | 'facebook_login';
export type MetaAccountType = 'BUSINESS' | 'CREATOR';
export type MetaConnectionStatus = 'active' | 'expired' | 'revoked' | 'error';

export interface MetaConnectionPublic {
  id: string;
  consultancy_id: string;
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

export async function fetchMetaConnection(consultancyId: string): Promise<MetaConnectionPublic | null> {
  const res = await client
    .get(`/api/meta/connections/${consultancyId}`)
    .json<{ connection: MetaConnectionPublic | null }>();
  return res.connection;
}

export async function startMetaOAuth(consultancyId: string): Promise<{ url: string }> {
  return client.post('/api/meta/oauth/start', { json: { consultancyId } }).json<{ url: string }>();
}

export async function disconnectMeta(consultancyId: string): Promise<void> {
  await client.delete(`/api/meta/connections/${consultancyId}`).json<{ disconnected: boolean }>();
}

// ─── Insights ────────────────────────────────────────────────────

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

export interface AccountSummary {
  ig_username: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  biography: string | null;
  profile_picture_url: string | null;
  account_type: MetaAccountType;
}

export interface AccountInsightsResponse {
  summary: AccountSummary;
  current: AccountInsightsAggregate;
  previous: AccountInsightsAggregate;
  delta: AccountInsightsAggregate;
  period: { since: string; until: string };
  capturedAt: string;
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
  follows?: number;
  ig_reels_avg_watch_time?: number;
  ig_reels_video_view_total_time?: number;
  clips_replays_count?: number;
  // Stories-only metrics:
  replies?: number;
  navigation?: number;
}

export interface MediaWithInsights {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_product_type: 'FEED' | 'REELS' | 'STORY';
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  metrics: MediaInsightsMetrics;
}

export interface AudienceData {
  total_followers: number | null;
  age_gender: Record<string, number>;
  top_cities: Array<{ city?: string; country: string; percent: number }>;
  top_countries: Array<{ country: string; percent: number }>;
  locales: Array<{ locale: string; percent: number }>;
}

export interface AudienceResponse {
  follower: AudienceData | null;
  engaged: AudienceData | null;
  capturedAt: string;
}

export async function fetchAccountInsights(consultancyId: string): Promise<AccountInsightsResponse> {
  return client
    .get(`/api/meta/insights/${consultancyId}/account`)
    .json<AccountInsightsResponse>();
}

export async function fetchMediaInsights(
  consultancyId: string,
  limit = 25,
): Promise<{ items: MediaWithInsights[]; nextCursor: string | null }> {
  return client
    .get(`/api/meta/insights/${consultancyId}/media?limit=${limit}`)
    .json<{ items: MediaWithInsights[]; nextCursor: string | null }>();
}

export async function fetchAudienceInsights(consultancyId: string): Promise<AudienceResponse> {
  return client
    .get(`/api/meta/insights/${consultancyId}/audience`)
    .json<AudienceResponse>();
}
