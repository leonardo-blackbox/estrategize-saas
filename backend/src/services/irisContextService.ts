/**
 * irisContextService — Consolida dados oficiais Meta + pesquisa de mercado
 * em contexto estruturado para alimentar o prompt do irisAIService.
 * Epic 10, Story 10.6.
 */
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { logger } from '../lib/logger.js';
import { getConnectionByConsultancy } from './metaConnectionService.js';
import {
  fetchAccountInsightsAggregate28d,
  fetchMediaWithInsights,
  fetchAudienceDemographics,
} from './metaInsightsService.js';
import type { AccountInsightsAggregate, MediaWithInsights, AudienceData } from '../types/metaApi.js';

export interface IrisInstagramContext {
  igUsername: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  account28d: AccountInsightsAggregate;
  account28dDelta: AccountInsightsAggregate;
  topPostsByValue: Array<{
    type: string;
    productType: string;
    caption: string;
    saves: number;
    shares: number;
    reach: number;
    likes: number;
    comments: number;
    permalink?: string;
    postedAt?: string;
  }>;
  topReels: Array<{
    caption: string;
    avgWatchTimeSec: number;
    totalWatchTimeSec: number;
    views: number;
    replays: number;
  }>;
  followerDemographics: AudienceData | null;
  engagedDemographics: AudienceData | null;
  postingCadence: {
    postsLast30d: number;
    postsPerWeek: number;
    distribution: { feed: number; reels: number; story: number };
  };
}

export interface IrisMarketContext {
  reportGeneratedAt: string;
  keyInsights: {
    opportunities: string[];
    threats: string[];
    positioning: string[];
  } | null;
  competitorCount: number;
  topCompetitors: Array<{ name: string; url?: string; rating?: number }>;
}

function ensureDb() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

function pickTopByValue(media: MediaWithInsights[]): IrisInstagramContext['topPostsByValue'] {
  return [...media]
    .map((m) => ({
      ...m,
      _score: (m.metrics.saved ?? 0) * 2 + (m.metrics.shares ?? 0) * 2,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)
    .map((m) => {
      const base = {
        type: m.media_type,
        productType: m.media_product_type,
        caption: (m.caption ?? '').slice(0, 200),
        saves: m.metrics.saved ?? 0,
        shares: m.metrics.shares ?? 0,
        reach: m.metrics.reach ?? 0,
        likes: m.metrics.likes ?? m.like_count ?? 0,
        comments: m.metrics.comments ?? m.comments_count ?? 0,
      };
      const out: IrisInstagramContext['topPostsByValue'][number] = { ...base };
      if (m.permalink !== undefined) out.permalink = m.permalink;
      if (m.timestamp !== undefined) out.postedAt = m.timestamp;
      return out;
    });
}

function pickTopReels(media: MediaWithInsights[]): IrisInstagramContext['topReels'] {
  return media
    .filter((m) => m.media_product_type === 'REELS')
    .sort((a, b) => (b.metrics.ig_reels_avg_watch_time ?? 0) - (a.metrics.ig_reels_avg_watch_time ?? 0))
    .slice(0, 5)
    .map((m) => ({
      caption: (m.caption ?? '').slice(0, 200),
      avgWatchTimeSec: Math.round((m.metrics.ig_reels_avg_watch_time ?? 0) / 1000),
      totalWatchTimeSec: Math.round((m.metrics.ig_reels_video_view_total_time ?? 0) / 1000),
      views: m.metrics.views ?? 0,
      replays: m.metrics.clips_replays_count ?? 0,
    }));
}

function computeCadence(media: MediaWithInsights[]): IrisInstagramContext['postingCadence'] {
  const thirty = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = media.filter((m) => m.timestamp && new Date(m.timestamp).getTime() > thirty);
  const dist = { feed: 0, reels: 0, story: 0 };
  for (const m of recent) {
    if (m.media_product_type === 'REELS') dist.reels++;
    else if (m.media_product_type === 'STORY') dist.story++;
    else dist.feed++;
  }
  return {
    postsLast30d: recent.length,
    postsPerWeek: Math.round((recent.length / 4.3) * 10) / 10,
    distribution: dist,
  };
}

export async function buildInstagramContext(consultancyId: string): Promise<IrisInstagramContext | null> {
  const conn = await getConnectionByConsultancy(consultancyId);
  if (!conn || conn.status !== 'active') return null;

  try {
    const [accountAgg, mediaList, follower, engaged] = await Promise.all([
      fetchAccountInsightsAggregate28d(consultancyId),
      fetchMediaWithInsights(consultancyId, 25),
      fetchAudienceDemographics(consultancyId, 'follower'),
      fetchAudienceDemographics(consultancyId, 'engaged'),
    ]);

    return {
      igUsername: accountAgg.summary.ig_username,
      followersCount: accountAgg.summary.followers_count,
      followsCount: accountAgg.summary.follows_count,
      mediaCount: accountAgg.summary.media_count,
      account28d: accountAgg.current,
      account28dDelta: accountAgg.delta,
      topPostsByValue: pickTopByValue(mediaList.items),
      topReels: pickTopReels(mediaList.items),
      followerDemographics: follower,
      engagedDemographics: engaged,
      postingCadence: computeCadence(mediaList.items),
    };
  } catch (err) {
    logger.warn('[irisContext] Instagram context build failed', { err: (err as Error).message });
    return null;
  }
}

export async function buildMarketResearchContext(consultancyId: string): Promise<IrisMarketContext | null> {
  const db = ensureDb();
  const { data, error } = await db
    .from('market_research')
    .select('completed_at, key_insights, competitors_discovered')
    .eq('consultancy_id', consultancyId)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  type Competitor = { name?: string; title?: string; url?: string; website?: string; totalScore?: number; rating?: number };
  const competitors = Array.isArray(data.competitors_discovered)
    ? (data.competitors_discovered as Competitor[])
    : [];

  return {
    reportGeneratedAt: data.completed_at,
    keyInsights: (data.key_insights as IrisMarketContext['keyInsights']) ?? null,
    competitorCount: competitors.length,
    topCompetitors: competitors.slice(0, 5).map((c) => {
      const base: { name: string; url?: string; rating?: number } = {
        name: c.name ?? c.title ?? 'Concorrente',
      };
      const url = c.url ?? c.website;
      if (url !== undefined) base.url = url;
      const rating = c.totalScore ?? c.rating;
      if (rating !== undefined) base.rating = rating;
      return base;
    }),
  };
}
