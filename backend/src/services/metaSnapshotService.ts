/**
 * metaSnapshotService — Snapshot diário + stories cron 6h.
 * Epic 10, Story 10.4.
 *
 * - runDailySnapshot: account insights, media insights, audience snapshot
 *   por consultoria conectada. Idempotente via ON CONFLICT DO UPDATE.
 * - runStoriesSnapshot: stories ativas (expiram em 24h).
 * - Refresh automático de tokens próximos do vencimento (<14d).
 * - Lock global previne concorrência.
 */
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { logger } from '../lib/logger.js';
import {
  fetchAccountInsightsAggregate28d,
  fetchMediaWithInsights,
  fetchAudienceDemographics,
  fetchActiveStoriesWithInsights,
} from './metaInsightsService.js';
import {
  listActiveConnections,
  updateConnectionStatus,
} from './metaConnectionService.js';
import { encryptToken } from './metaTokenService.js';
import { refreshLongLivedToken } from './metaOAuthService.js';
import { getDecryptedToken } from './metaConnectionService.js';
import type { MetaConnection } from '../types/metaApi.js';

export interface SnapshotReport {
  startedAt: string;
  finishedAt: string;
  totalConnections: number;
  successful: number;
  failed: number;
  errors: Array<{ consultancyId: string; message: string }>;
  durationMs: number;
}

interface RunOptions {
  consultancyIds?: string[];
  dryRun?: boolean;
  includeStories?: boolean;
}

let snapshotLock = false;
let storiesLock = false;

function ensureDb() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

async function maybeRefreshToken(conn: MetaConnection): Promise<void> {
  const expiresAt = new Date(conn.expires_at).getTime();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  if (expiresAt - Date.now() > fourteenDays) return;
  // Não refresh se foi feito refresh nas últimas 24h (Meta exige >24h da criação)
  if (conn.last_refreshed_at) {
    const sinceRefresh = Date.now() - new Date(conn.last_refreshed_at).getTime();
    if (sinceRefresh < 24 * 60 * 60 * 1000) return;
  }

  const db = ensureDb();
  const token = await getDecryptedToken(conn.id);
  try {
    const refreshed = await refreshLongLivedToken(token);
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await db
      .from('instagram_official_connections')
      .update({
        access_token_encrypted: encryptToken(refreshed.access_token),
        expires_at: newExpiresAt,
        last_refreshed_at: new Date().toISOString(),
      })
      .eq('id', conn.id);
    logger.info('[metaSnapshot] token refreshed', { consultancyId: conn.consultancy_id });
  } catch (err) {
    logger.warn('[metaSnapshot] token refresh failed', {
      consultancyId: conn.consultancy_id,
      err: (err as Error).message,
    });
  }
}

async function persistAccountInsights(consultancyId: string, current: Record<string, number>, date: string): Promise<void> {
  const db = ensureDb();
  const rows = Object.entries(current)
    .filter(([, v]) => Number.isFinite(v))
    .map(([metric_name, value]) => ({
      consultancy_id: consultancyId,
      date,
      metric_name,
      value,
      period: 'days_28',
    }));
  if (rows.length === 0) return;
  await db
    .from('instagram_insights_daily')
    .upsert(rows, { onConflict: 'consultancy_id,date,metric_name,period' });
}

async function persistMediaInsights(consultancyId: string, items: Awaited<ReturnType<typeof fetchMediaWithInsights>>['items']): Promise<void> {
  if (items.length === 0) return;
  const db = ensureDb();
  const capturedAt = new Date().toISOString();
  const rows = items.map((m) => ({
    consultancy_id: consultancyId,
    ig_media_id: m.id,
    media_type: m.media_type,
    media_product_type: m.media_product_type,
    permalink: m.permalink ?? null,
    caption: m.caption ?? null,
    thumbnail_url: m.thumbnail_url ?? m.media_url ?? null,
    posted_at: m.timestamp ?? null,
    captured_at: capturedAt,
    metrics: m.metrics,
  }));
  await db
    .from('instagram_media_insights')
    .upsert(rows, { onConflict: 'consultancy_id,ig_media_id,captured_at' });
}

async function persistAudience(consultancyId: string, type: 'follower' | 'engaged', data: Awaited<ReturnType<typeof fetchAudienceDemographics>>, date: string): Promise<void> {
  if (!data) return;
  const db = ensureDb();
  await db
    .from('instagram_audience_snapshots')
    .upsert(
      {
        consultancy_id: consultancyId,
        date,
        audience_type: type,
        total_followers: data.total_followers,
        age_gender: data.age_gender,
        top_cities: data.top_cities,
        top_countries: data.top_countries,
        locales: data.locales,
        captured_at: new Date().toISOString(),
      },
      { onConflict: 'consultancy_id,date,audience_type' },
    );
}

async function persistStories(consultancyId: string, stories: Awaited<ReturnType<typeof fetchActiveStoriesWithInsights>>): Promise<void> {
  if (stories.length === 0) return;
  const db = ensureDb();
  const capturedAt = new Date().toISOString();
  const rows = stories.map((s) => ({
    consultancy_id: consultancyId,
    ig_story_id: s.id,
    permalink: s.permalink ?? null,
    thumbnail_url: s.thumbnail_url ?? null,
    posted_at: s.timestamp ?? null,
    captured_at: capturedAt,
    metrics: s.metrics,
    is_final: false,
  }));
  await db
    .from('instagram_stories_insights')
    .upsert(rows, { onConflict: 'consultancy_id,ig_story_id,captured_at' });

  // Marca stories antigas (>24h) como is_final
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await db
    .from('instagram_stories_insights')
    .update({ is_final: true })
    .eq('consultancy_id', consultancyId)
    .eq('is_final', false)
    .lt('posted_at', cutoff);
}

// ============================================================================
// runDailySnapshot
// ============================================================================

export async function runDailySnapshot(options: RunOptions = {}): Promise<SnapshotReport> {
  if (snapshotLock) {
    logger.warn('[metaSnapshot] daily already running, skipping');
    return {
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      totalConnections: 0,
      successful: 0,
      failed: 0,
      errors: [],
      durationMs: 0,
    };
  }
  snapshotLock = true;
  const start = Date.now();
  const startedAt = new Date().toISOString();
  logger.info('[metaSnapshot] daily snapshot started', { dryRun: options.dryRun });

  const report: SnapshotReport = {
    startedAt,
    finishedAt: startedAt,
    totalConnections: 0,
    successful: 0,
    failed: 0,
    errors: [],
    durationMs: 0,
  };

  try {
    let connections = await listActiveConnections();
    if (options.consultancyIds && options.consultancyIds.length > 0) {
      connections = connections.filter((c) => options.consultancyIds!.includes(c.consultancy_id));
    }
    report.totalConnections = connections.length;
    const date = new Date().toISOString().slice(0, 10);

    for (const conn of connections) {
      try {
        await maybeRefreshToken(conn);

        const [account, media, follower, engaged] = await Promise.all([
          fetchAccountInsightsAggregate28d(conn.consultancy_id),
          fetchMediaWithInsights(conn.consultancy_id, 25),
          fetchAudienceDemographics(conn.consultancy_id, 'follower'),
          fetchAudienceDemographics(conn.consultancy_id, 'engaged'),
        ]);

        if (!options.dryRun) {
          await persistAccountInsights(conn.consultancy_id, account.current as unknown as Record<string, number>, date);
          await persistMediaInsights(conn.consultancy_id, media.items);
          await persistAudience(conn.consultancy_id, 'follower', follower, date);
          await persistAudience(conn.consultancy_id, 'engaged', engaged, date);

          const db = ensureDb();
          await db
            .from('instagram_official_connections')
            .update({ last_snapshot_at: new Date().toISOString(), last_error: null })
            .eq('id', conn.id);
        }

        report.successful++;
      } catch (err) {
        report.failed++;
        const message = err instanceof Error ? err.message : String(err);
        report.errors.push({ consultancyId: conn.consultancy_id, message });
        await updateConnectionStatus(conn.consultancy_id, 'error', message).catch(() => undefined);
        logger.warn('[metaSnapshot] connection failed', { consultancyId: conn.consultancy_id, message });
      }
    }
  } finally {
    snapshotLock = false;
    report.durationMs = Date.now() - start;
    report.finishedAt = new Date().toISOString();
    logger.info('[metaSnapshot] daily snapshot finished', report);

    // Audit log
    if (!options.dryRun) {
      try {
        const db = ensureDb();
        await db.from('audit_logs').insert({
          actor_id: null,
          action: 'meta_snapshot_daily',
          entity_type: 'meta-snapshot',
          entity_id: null,
          metadata: report as unknown as Record<string, unknown>,
        });
      } catch {
        // audit_logs schema may differ; ignore
      }
    }
  }

  return report;
}

// ============================================================================
// runStoriesSnapshot
// ============================================================================

export async function runStoriesSnapshot(options: RunOptions = {}): Promise<SnapshotReport> {
  if (storiesLock) {
    logger.warn('[metaSnapshot] stories already running, skipping');
    return {
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      totalConnections: 0,
      successful: 0,
      failed: 0,
      errors: [],
      durationMs: 0,
    };
  }
  storiesLock = true;
  const start = Date.now();
  const startedAt = new Date().toISOString();

  const report: SnapshotReport = {
    startedAt,
    finishedAt: startedAt,
    totalConnections: 0,
    successful: 0,
    failed: 0,
    errors: [],
    durationMs: 0,
  };

  try {
    let connections = await listActiveConnections();
    if (options.consultancyIds && options.consultancyIds.length > 0) {
      connections = connections.filter((c) => options.consultancyIds!.includes(c.consultancy_id));
    }
    report.totalConnections = connections.length;

    for (const conn of connections) {
      try {
        const stories = await fetchActiveStoriesWithInsights(conn.consultancy_id);
        if (!options.dryRun) {
          await persistStories(conn.consultancy_id, stories);
        }
        report.successful++;
      } catch (err) {
        report.failed++;
        const message = err instanceof Error ? err.message : String(err);
        report.errors.push({ consultancyId: conn.consultancy_id, message });
      }
    }
  } finally {
    storiesLock = false;
    report.durationMs = Date.now() - start;
    report.finishedAt = new Date().toISOString();
  }

  return report;
}

// Status helpers
let lastDailyReport: SnapshotReport | null = null;
let lastStoriesReport: SnapshotReport | null = null;

export function setLastReport(kind: 'daily' | 'stories', report: SnapshotReport): void {
  if (kind === 'daily') lastDailyReport = report;
  else lastStoriesReport = report;
}

export function getSnapshotStatus(): {
  lastDaily: SnapshotReport | null;
  lastStories: SnapshotReport | null;
  isRunning: { daily: boolean; stories: boolean };
} {
  return {
    lastDaily: lastDailyReport,
    lastStories: lastStoriesReport,
    isRunning: { daily: snapshotLock, stories: storiesLock },
  };
}
