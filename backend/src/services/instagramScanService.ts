import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { runActor } from './apifyService.js';
import type {
  InstagramSnapshot,
  InstagramProfileData,
  InstagramLatestPost,
} from '../types/marketIntelligence.js';

// ============================================================================
// Types from Apify instagram-profile-scraper
// ============================================================================

interface ApifyInstagramProfile {
  username?: string;
  fullName?: string;
  biography?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isBusinessAccount?: boolean;
  businessCategoryName?: string | null;
  externalUrl?: string | null;
  profilePicUrl?: string;
  latestPosts?: Array<{
    type?: string;
    caption?: string;
    likesCount?: number;
    commentsCount?: number;
    timestamp?: string;
    url?: string;
    displayUrl?: string;
  }>;
}

// ============================================================================
// Helpers
// ============================================================================

function ensureAdmin() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

function computeEngagementRate(
  followers: number,
  posts: ApifyInstagramProfile['latestPosts'],
): number {
  if (!followers || !posts || posts.length === 0) return 0;
  const avgLikes = posts.reduce((s, p) => s + (p.likesCount ?? 0), 0) / posts.length;
  const avgComments = posts.reduce((s, p) => s + (p.commentsCount ?? 0), 0) / posts.length;
  return Number(((avgLikes + avgComments) / followers * 100).toFixed(2));
}

function computePostsPerWeek(posts: ApifyInstagramProfile['latestPosts']): number {
  if (!posts || posts.length === 0) return 0;
  // Count posts from last 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = posts.filter((p) => {
    if (!p.timestamp) return false;
    return new Date(p.timestamp).getTime() > cutoff;
  });
  return Number((recent.length / 4.3).toFixed(1));
}

function computeContentBreakdown(posts: ApifyInstagramProfile['latestPosts']) {
  if (!posts || posts.length === 0) return { reels: 0, photos: 0, carousels: 0 };
  const total = posts.length;
  const reels = posts.filter((p) => p.type === 'Video').length;
  const carousels = posts.filter((p) => p.type === 'Sidecar').length;
  const photos = total - reels - carousels;
  return {
    reels: Math.round((reels / total) * 100),
    photos: Math.round((photos / total) * 100),
    carousels: Math.round((carousels / total) * 100),
  };
}

function extractProfileData(raw: ApifyInstagramProfile): InstagramProfileData {
  const posts = raw.latestPosts ?? [];
  const followers = raw.followersCount ?? 0;

  const latestPosts: InstagramLatestPost[] = posts.slice(0, 12).map((p) => ({
    type: p.type ?? 'Photo',
    caption: (p.caption ?? '').slice(0, 200),
    likesCount: p.likesCount ?? 0,
    commentsCount: p.commentsCount ?? 0,
    timestamp: p.timestamp ?? '',
    url: p.url ?? '',
    displayUrl: p.displayUrl,
  }));

  return {
    username: raw.username ?? '',
    fullName: raw.fullName ?? '',
    biography: raw.biography ?? '',
    followersCount: followers,
    followingCount: raw.followingCount ?? 0,
    postsCount: raw.postsCount ?? 0,
    isBusinessAccount: raw.isBusinessAccount ?? false,
    businessCategoryName: raw.businessCategoryName ?? null,
    externalUrl: raw.externalUrl ?? null,
    profilePicUrl: raw.profilePicUrl ?? '',
    engagementRate: computeEngagementRate(followers, posts),
    postsPerWeek: computePostsPerWeek(posts),
    contentBreakdown: computeContentBreakdown(posts),
    latestPosts,
  };
}

// ============================================================================
// processScan (internal)
// ============================================================================

async function processScan(snapshotId: string, handle: string): Promise<void> {
  const db = ensureAdmin();
  console.log(`[instagram-scan] Starting scan for @${handle}`);

  await db
    .from('instagram_snapshots')
    .update({ status: 'running' })
    .eq('id', snapshotId);

  try {
    const results = await runActor<ApifyInstagramProfile>(
      'apify/instagram-profile-scraper',
      { usernames: [handle.replace(/^@/, '')], proxy: { useApifyProxy: true } },
    );

    if (!results || results.length === 0) {
      throw new Error('No data returned from Apify — profile may be private or not found');
    }

    const profileData = extractProfileData(results[0]);

    await db
      .from('instagram_snapshots')
      .update({
        status: 'done',
        raw_data: profileData,
        scraped_at: new Date().toISOString(),
      })
      .eq('id', snapshotId);

    console.log(
      `[instagram-scan] Done: @${handle} — ${profileData.followersCount} followers`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[instagram-scan] Error for @${handle}: ${message}`);

    await db
      .from('instagram_snapshots')
      .update({ status: 'failed', error_message: message })
      .eq('id', snapshotId);
  }
}

// ============================================================================
// triggerScan — fire-and-forget
// ============================================================================

export function triggerScan(
  consultancyId: string,
  userId: string,
  handle: string,
): void {
  const db = ensureAdmin();

  void Promise.resolve(
    db.from('instagram_snapshots')
      .insert({ consultancy_id: consultancyId, user_id: userId, handle, status: 'pending' })
      .select('id')
      .single(),
  ).then(({ data, error }) => {
    if (error || !data) {
      console.error('[instagram-scan] Failed to create snapshot record:', error?.message);
      return;
    }
    setImmediate(() => {
      void processScan(data.id as string, handle).catch((err: unknown) => {
        console.error('[instagram-scan] Unhandled error in processScan:', err);
      });
    });
  }).catch((err: unknown) => {
    console.error('[instagram-scan] Failed to insert snapshot:', err);
  });
}

// ============================================================================
// getSnapshot
// ============================================================================

export async function getSnapshot(
  consultancyId: string,
  userId: string,
): Promise<InstagramSnapshot | null> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('instagram_snapshots')
    .select('*')
    .eq('consultancy_id', consultancyId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to get snapshot: ${error.message}`);
  return data as InstagramSnapshot | null;
}
