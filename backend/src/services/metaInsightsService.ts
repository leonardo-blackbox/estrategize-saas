/**
 * metaInsightsService — Leitura de métricas oficiais Instagram via Graph API.
 * Epic 10, Story 10.3.
 *
 * Cobre: Account insights, Media list + insights, Audience demographics.
 * Base URL muda conforme connection.auth_flow ('instagram' vs 'facebook').
 */
import { logger } from '../lib/logger.js';
import { metaGet, metaBatch, type MetaBaseUrl } from '../lib/metaApiClient.js';
import { cacheKey, withCache, TTL } from './metaInsightsCache.js';
import { getConnectionByConsultancy, getDecryptedToken, updateConnectionStatus } from './metaConnectionService.js';
import { MetaApiError } from '../types/metaApi.js';
import type {
  AccountInsightsAggregate,
  AccountInsightsResponse,
  AccountSummary,
  AudienceData,
  AudienceResponse,
  AudienceType,
  MediaItem,
  MediaListResponse,
  MediaProductType,
  MediaWithInsights,
  MediaInsightsMetrics,
  MetaConnection,
  StoryItem,
} from '../types/metaApi.js';

function getBaseUrlForConnection(conn: MetaConnection): MetaBaseUrl {
  return conn.auth_flow === 'facebook_login' ? 'facebook' : 'instagram';
}

async function loadConnection(consultancyId: string): Promise<MetaConnection> {
  const conn = await getConnectionByConsultancy(consultancyId);
  if (!conn) {
    throw new Error('NO_CONNECTION');
  }
  if (conn.status !== 'active') {
    throw new Error(`CONNECTION_${conn.status.toUpperCase()}`);
  }
  return conn;
}

async function getTokenAndBaseUrl(consultancyId: string): Promise<{ token: string; conn: MetaConnection; baseUrl: MetaBaseUrl }> {
  const conn = await loadConnection(consultancyId);
  const token = await getDecryptedToken(conn.id);
  return { token, conn, baseUrl: getBaseUrlForConnection(conn) };
}

const onTokenExpiredHandler = (consultancyId: string) => async () => {
  await updateConnectionStatus(consultancyId, 'expired', 'Token expirado (code 190)');
};

// ============================================================================
// Account Summary
// ============================================================================

interface RawAccountSummary {
  username?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  biography?: string;
  profile_picture_url?: string;
  account_type?: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
}

export async function fetchAccountSummary(consultancyId: string): Promise<AccountSummary> {
  return withCache(
    cacheKey(consultancyId, 'summary'),
    TTL.account,
    async () => {
      const { token, baseUrl, conn } = await getTokenAndBaseUrl(consultancyId);
      const data = await metaGet<RawAccountSummary>(`/${conn.ig_user_id}`, token, {
        baseUrl,
        params: {
          fields: 'username,followers_count,follows_count,media_count,biography,profile_picture_url,account_type',
        },
        onTokenExpired: onTokenExpiredHandler(consultancyId),
      });
      const accountType = data.account_type === 'PERSONAL' ? 'BUSINESS' : (data.account_type ?? 'BUSINESS');
      return {
        ig_username: data.username ?? conn.ig_username,
        followers_count: data.followers_count ?? 0,
        follows_count: data.follows_count ?? 0,
        media_count: data.media_count ?? 0,
        biography: data.biography ?? null,
        profile_picture_url: data.profile_picture_url ?? null,
        account_type: accountType,
      };
    },
  );
}

// ============================================================================
// Account Insights
// ============================================================================

const ACCOUNT_METRICS = [
  'reach',
  'views',
  'accounts_engaged',
  'profile_views',
  'profile_links_taps',
  'total_interactions',
  'likes',
  'comments',
  'saves',
  'shares',
  'replies',
  'follows',
];

interface RawInsightsResponse {
  data: Array<{
    name: string;
    period?: string;
    values: Array<{ value: number; end_time?: string }>;
  }>;
}

function fmtDate(d: Date): string {
  // Graph API espera ISO 8601 (segundos desde epoch ou YYYY-MM-DD)
  return d.toISOString().slice(0, 10);
}

function aggregateMetrics(raw: RawInsightsResponse): AccountInsightsAggregate {
  const agg: AccountInsightsAggregate = {
    reach: 0, views: 0, accounts_engaged: 0,
    profile_views: 0, profile_links_taps: 0,
    total_interactions: 0, likes: 0, comments: 0,
    saves: 0, shares: 0, replies: 0,
    follows: 0, unfollows: 0,
  };

  for (const metric of raw.data ?? []) {
    const total = metric.values.reduce((s, v) => s + (v.value ?? 0), 0);
    if (metric.name in agg) {
      (agg as unknown as Record<string, number>)[metric.name] = total;
    }
  }
  return agg;
}

function computeDelta(curr: AccountInsightsAggregate, prev: AccountInsightsAggregate): AccountInsightsAggregate {
  const delta = {} as AccountInsightsAggregate;
  for (const key of Object.keys(curr) as Array<keyof AccountInsightsAggregate>) {
    delta[key] = curr[key] - prev[key];
  }
  return delta;
}

export async function fetchAccountInsightsAggregate28d(consultancyId: string): Promise<AccountInsightsResponse> {
  return withCache(
    cacheKey(consultancyId, 'account-28d'),
    TTL.account,
    async () => {
      const { token, baseUrl, conn } = await getTokenAndBaseUrl(consultancyId);
      const now = new Date();
      const since28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const since56 = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);

      const path = `/${conn.ig_user_id}/insights`;
      const baseParams = (since: Date, until: Date) => ({
        metric: ACCOUNT_METRICS.join(','),
        period: 'day',
        metric_type: 'total_value',
        since: fmtDate(since),
        until: fmtDate(until),
      });

      let current: AccountInsightsAggregate;
      let previous: AccountInsightsAggregate;

      try {
        const [currRaw, prevRaw] = await Promise.all([
          metaGet<RawInsightsResponse>(path, token, {
            baseUrl,
            params: baseParams(since28, now),
            onTokenExpired: onTokenExpiredHandler(consultancyId),
          }),
          metaGet<RawInsightsResponse>(path, token, {
            baseUrl,
            params: baseParams(since56, since28),
            onTokenExpired: onTokenExpiredHandler(consultancyId),
          }),
        ]);
        current = aggregateMetrics(currRaw);
        previous = aggregateMetrics(prevRaw);
      } catch (err) {
        if (err instanceof MetaApiError && err.isPermissionMissing()) {
          logger.warn('[metaInsights] permission missing for account insights', { code: err.code });
          current = aggregateMetrics({ data: [] });
          previous = aggregateMetrics({ data: [] });
        } else {
          throw err;
        }
      }

      const summary = await fetchAccountSummary(consultancyId);

      return {
        summary,
        current,
        previous,
        delta: computeDelta(current, previous),
        period: { since: fmtDate(since28), until: fmtDate(now) },
        capturedAt: new Date().toISOString(),
      };
    },
  );
}

// ============================================================================
// Media list + insights
// ============================================================================

interface RawMediaListResponse {
  data: MediaItem[];
  paging?: { cursors?: { after?: string }; next?: string };
}

export async function fetchMediaList(
  consultancyId: string,
  limit = 25,
  after?: string,
): Promise<{ items: MediaItem[]; nextCursor: string | null }> {
  return withCache(
    cacheKey(consultancyId, 'media-list', `${limit}:${after ?? ''}`),
    TTL.mediaList,
    async () => {
      const { token, baseUrl, conn } = await getTokenAndBaseUrl(consultancyId);
      const params: Record<string, string> = {
        fields: 'id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count',
        limit: String(limit),
      };
      if (after) params['after'] = after;
      const data = await metaGet<RawMediaListResponse>(`/${conn.ig_user_id}/media`, token, {
        baseUrl,
        params,
        onTokenExpired: onTokenExpiredHandler(consultancyId),
      });
      return {
        items: data.data ?? [],
        nextCursor: data.paging?.cursors?.after ?? null,
      };
    },
  );
}

function metricsByProductType(productType: MediaProductType): string[] {
  if (productType === 'REELS') {
    return [
      'reach','views','likes','comments','saved','shares','total_interactions',
      'profile_visits','profile_activity','follows',
      'ig_reels_avg_watch_time','ig_reels_video_view_total_time','clips_replays_count',
    ];
  }
  if (productType === 'STORY') {
    return [
      'views','reach','replies','navigation','profile_visits','follows','shares','total_interactions',
    ];
  }
  // FEED (image, carousel, video não-reels)
  return [
    'reach','views','likes','comments','saved','shares','total_interactions',
    'profile_visits','profile_activity','follows',
  ];
}

function parseMediaInsights(raw: RawInsightsResponse): MediaInsightsMetrics {
  const m: MediaInsightsMetrics = {};
  for (const entry of raw.data ?? []) {
    const total = entry.values.reduce((s, v) => s + (v.value ?? 0), 0);
    (m as Record<string, number>)[entry.name] = total;
  }
  return m;
}

export async function fetchMediaInsights(
  consultancyId: string,
  igMediaId: string,
  productType: MediaProductType,
): Promise<MediaInsightsMetrics> {
  return withCache(
    cacheKey(consultancyId, 'media-insights', igMediaId),
    TTL.mediaInsights,
    async () => {
      const { token, baseUrl } = await getTokenAndBaseUrl(consultancyId);
      try {
        const raw = await metaGet<RawInsightsResponse>(`/${igMediaId}/insights`, token, {
          baseUrl,
          params: { metric: metricsByProductType(productType).join(',') },
          onTokenExpired: onTokenExpiredHandler(consultancyId),
        });
        return parseMediaInsights(raw);
      } catch (err) {
        if (err instanceof MetaApiError) {
          logger.warn('[metaInsights] media insights failed', {
            igMediaId, code: err.code, message: err.message,
          });
          return {};
        }
        throw err;
      }
    },
  );
}

export async function fetchMediaWithInsights(
  consultancyId: string,
  limit = 25,
): Promise<MediaListResponse> {
  const { items, nextCursor } = await fetchMediaList(consultancyId, limit);
  // Buscar insights em sequência (mais simples e respeita rate-limit interno)
  const enriched: MediaWithInsights[] = [];
  for (const item of items) {
    if (item.media_product_type === 'STORY') {
      enriched.push({ ...item, metrics: {} });
      continue;
    }
    const metrics = await fetchMediaInsights(consultancyId, item.id, item.media_product_type);
    enriched.push({ ...item, metrics });
  }
  return { items: enriched, nextCursor };
}

// ============================================================================
// Audience demographics
// ============================================================================

interface RawDemographicResponse {
  data: Array<{
    name: string;
    total_value?: {
      breakdowns?: Array<{
        dimension_keys: string[];
        results: Array<{ dimension_values: string[]; value: number }>;
      }>;
      value?: number;
    };
  }>;
}

function parseAudience(raw: RawDemographicResponse): AudienceData {
  const audience: AudienceData = {
    total_followers: null,
    age_gender: {},
    top_cities: [],
    top_countries: [],
    locales: [],
  };

  for (const metric of raw.data ?? []) {
    if (!metric.total_value?.breakdowns) continue;
    for (const breakdown of metric.total_value.breakdowns) {
      const keys = breakdown.dimension_keys;
      const total = breakdown.results.reduce((s, r) => s + (r.value ?? 0), 0) || 1;

      if (keys.includes('age') && keys.includes('gender')) {
        for (const r of breakdown.results) {
          const [age, gender] = r.dimension_values;
          if (age && gender) {
            audience.age_gender[`${gender}.${age}`] = r.value / total;
          }
        }
      } else if (keys.includes('city')) {
        audience.top_cities = breakdown.results
          .slice(0, 10)
          .map((r) => ({
            city: r.dimension_values[0],
            country: r.dimension_values[1] ?? '',
            percent: r.value / total,
          }));
      } else if (keys.includes('country')) {
        audience.top_countries = breakdown.results
          .slice(0, 10)
          .map((r) => ({ country: r.dimension_values[0] ?? '', percent: r.value / total }));
      }
    }
  }

  return audience;
}

export async function fetchAudienceDemographics(
  consultancyId: string,
  type: AudienceType,
): Promise<AudienceData | null> {
  return withCache(
    cacheKey(consultancyId, 'audience', type),
    TTL.audience,
    async () => {
      const { token, baseUrl, conn } = await getTokenAndBaseUrl(consultancyId);
      const metricName = type === 'follower' ? 'follower_demographics' : 'engaged_audience_demographics';

      try {
        const data = await metaGet<RawDemographicResponse>(`/${conn.ig_user_id}/insights`, token, {
          baseUrl,
          params: {
            metric: metricName,
            period: 'lifetime',
            metric_type: 'total_value',
            breakdown: 'age,gender,country,city',
            timeframe: 'this_month',
          },
          onTokenExpired: onTokenExpiredHandler(consultancyId),
        });
        const parsed = parseAudience(data);
        const summary = await fetchAccountSummary(consultancyId);
        parsed.total_followers = summary.followers_count;
        return parsed;
      } catch (err) {
        if (err instanceof MetaApiError) {
          // Code 100 / followers count too low (< 100)
          logger.warn('[metaInsights] audience demographics not available', {
            type, code: err.code, message: err.message,
          });
          return null;
        }
        throw err;
      }
    },
  );
}

export async function fetchAudienceResponse(consultancyId: string): Promise<AudienceResponse> {
  const [follower, engaged] = await Promise.all([
    fetchAudienceDemographics(consultancyId, 'follower'),
    fetchAudienceDemographics(consultancyId, 'engaged'),
  ]);
  return {
    follower,
    engaged,
    capturedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Stories (24h window)
// ============================================================================

interface RawStoriesListResponse {
  data: Array<{
    id: string;
    permalink?: string;
    thumbnail_url?: string;
    timestamp?: string;
    media_type?: string;
  }>;
}

export async function fetchActiveStoriesWithInsights(consultancyId: string): Promise<StoryItem[]> {
  const { token, baseUrl, conn } = await getTokenAndBaseUrl(consultancyId);
  let list: RawStoriesListResponse;
  try {
    list = await metaGet<RawStoriesListResponse>(`/${conn.ig_user_id}/stories`, token, {
      baseUrl,
      params: { fields: 'id,permalink,thumbnail_url,timestamp,media_type' },
      onTokenExpired: onTokenExpiredHandler(consultancyId),
    });
  } catch (err) {
    if (err instanceof MetaApiError) {
      logger.warn('[metaInsights] stories list failed', { code: err.code });
      return [];
    }
    throw err;
  }

  const items: StoryItem[] = [];
  for (const s of list.data ?? []) {
    const item: StoryItem = {
      id: s.id,
      ...(s.permalink !== undefined ? { permalink: s.permalink } : {}),
      ...(s.thumbnail_url !== undefined ? { thumbnail_url: s.thumbnail_url } : {}),
      ...(s.timestamp !== undefined ? { timestamp: s.timestamp } : {}),
      ...(s.media_type !== undefined ? { media_type: s.media_type } : {}),
      metrics: {},
    };
    try {
      const raw = await metaGet<RawInsightsResponse>(`/${s.id}/insights`, token, {
        baseUrl,
        params: { metric: metricsByProductType('STORY').join(',') },
        onTokenExpired: onTokenExpiredHandler(consultancyId),
      });
      item.metrics = parseMediaInsights(raw);
    } catch (err) {
      logger.warn('[metaInsights] story insights failed', { storyId: s.id, err: (err as Error).message });
    }
    items.push(item);
  }
  return items;
}

export { metaBatch };
