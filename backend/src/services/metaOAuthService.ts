/**
 * metaOAuthService — OAuth flow Instagram Business Login (Epic 10, Story 10.2)
 *
 * Fluxo:
 *  1. buildAuthUrl()        → URL Instagram para o user autorizar
 *  2. user aprova           → callback recebe `code` + `state`
 *  3. exchangeCodeForToken() → short-lived token (1h) + ig_user_id
 *  4. exchangeForLongLived() → long-lived token (60d)
 *  5. fetchInstagramUserInfo() → username + account_type + foto
 *  6. salva em instagram_official_connections (token encriptado)
 *
 * Endpoints externos (Instagram Business Login):
 *  - https://www.instagram.com/oauth/authorize
 *  - https://api.instagram.com/oauth/access_token
 *  - https://graph.instagram.com/access_token
 *  - https://graph.instagram.com/refresh_access_token
 *  - https://graph.instagram.com/me
 */
import crypto from 'crypto';
import { logger } from '../lib/logger.js';
import type {
  IBLLongLivedTokenResponse,
  IBLTokenExchangeResponse,
  InstagramUserInfo,
  MetaAccountType,
} from '../types/metaApi.js';

const IG_OAUTH_BASE = 'https://www.instagram.com/oauth/authorize';
const IG_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const IG_GRAPH_BASE = 'https://graph.instagram.com';

const DEFAULT_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
  'instagram_business_content_publish',
];

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Env var ${name} is required`);
  return v;
}

function getOptional(name: string): string | undefined {
  return process.env[name];
}

// ============================================================================
// State token (JWT-like com HMAC, sem libs externas)
// ============================================================================

interface StatePayload {
  consultancyId: string;
  userId: string;
  nonce: string;
  exp: number; // unix seconds
}

function signState(payload: StatePayload): string {
  const secret = getEnv('META_OAUTH_STATE_SECRET');
  const json = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(json).digest('base64url');
  return `${json}.${sig}`;
}

export function verifyState(state: string): StatePayload {
  const secret = getEnv('META_OAUTH_STATE_SECRET');
  const parts = state.split('.');
  if (parts.length !== 2) throw new Error('Invalid state format');
  const [json, sig] = parts as [string, string];
  const expected = crypto.createHmac('sha256', secret).update(json).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Invalid state signature');
  }
  const payload = JSON.parse(Buffer.from(json, 'base64url').toString('utf8')) as StatePayload;
  if (Date.now() / 1000 > payload.exp) {
    throw new Error('State expired');
  }
  return payload;
}

// ============================================================================
// 1. buildAuthUrl
// ============================================================================

export function buildAuthUrl(consultancyId: string, userId: string): { url: string; state: string } {
  const igAppId = getEnv('IG_APP_ID');
  const redirectUri = getEnv('META_OAUTH_REDIRECT_URI');

  const state = signState({
    consultancyId,
    userId,
    nonce: crypto.randomBytes(16).toString('hex'),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 min
  });

  const params = new URLSearchParams({
    client_id: igAppId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DEFAULT_SCOPES.join(','),
    state,
  });

  return { url: `${IG_OAUTH_BASE}?${params.toString()}`, state };
}

// ============================================================================
// 2. exchangeCodeForToken (short-lived, ~1h)
// ============================================================================

export async function exchangeCodeForToken(code: string): Promise<IBLTokenExchangeResponse> {
  const igAppId = getEnv('IG_APP_ID');
  const igAppSecret = getEnv('IG_APP_SECRET');
  const redirectUri = getEnv('META_OAUTH_REDIRECT_URI');

  const body = new URLSearchParams({
    client_id: igAppId,
    client_secret: igAppSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(IG_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.warn('[metaOAuth] exchangeCodeForToken failed', { status: res.status, body: text });
    throw new Error(`Token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as IBLTokenExchangeResponse;
  if (!data.access_token || !data.user_id) {
    throw new Error('Token exchange returned incomplete data');
  }
  return data;
}

// ============================================================================
// 3. exchangeForLongLivedToken (60d)
// ============================================================================

export async function exchangeForLongLivedToken(shortToken: string): Promise<IBLLongLivedTokenResponse> {
  const igAppSecret = getEnv('IG_APP_SECRET');

  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: igAppSecret,
    access_token: shortToken,
  });

  const res = await fetch(`${IG_GRAPH_BASE}/access_token?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    logger.warn('[metaOAuth] exchangeForLongLivedToken failed', { status: res.status, body: text });
    throw new Error(`Long-lived exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as IBLLongLivedTokenResponse;
  if (!data.access_token) {
    throw new Error('Long-lived exchange returned no access_token');
  }
  return data;
}

// ============================================================================
// 4. fetchInstagramUserInfo
// ============================================================================

export async function fetchInstagramUserInfo(longToken: string): Promise<InstagramUserInfo> {
  const params = new URLSearchParams({
    fields: 'user_id,username,account_type,name,profile_picture_url',
    access_token: longToken,
  });

  const res = await fetch(`${IG_GRAPH_BASE}/me?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    logger.warn('[metaOAuth] fetchInstagramUserInfo failed', { status: res.status, body: text });
    throw new Error(`User info fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as InstagramUserInfo;
  if (!data.user_id || !data.username) {
    throw new Error('User info incomplete');
  }
  if (data.account_type !== 'BUSINESS' && data.account_type !== 'CREATOR') {
    throw new Error(`Unsupported account_type: ${data.account_type}. Must be BUSINESS.`);
  }
  return data;
}

// ============================================================================
// 5. refreshLongLivedToken (após 24h da criação, antes de expirar)
// ============================================================================

export async function refreshLongLivedToken(currentToken: string): Promise<IBLLongLivedTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: currentToken,
  });

  const res = await fetch(`${IG_GRAPH_BASE}/refresh_access_token?${params.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    logger.warn('[metaOAuth] refreshLongLivedToken failed', { status: res.status, body: text });
    throw new Error(`Refresh failed: ${res.status}`);
  }

  return (await res.json()) as IBLLongLivedTokenResponse;
}

// ============================================================================
// 6. revokeToken (best-effort)
// ============================================================================

export async function revokeToken(token: string): Promise<void> {
  try {
    const res = await fetch(`${IG_GRAPH_BASE}/me/permissions?access_token=${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      logger.warn('[metaOAuth] revokeToken non-OK response', { status: res.status });
    }
  } catch (err) {
    logger.warn('[metaOAuth] revokeToken threw', { err: (err as Error).message });
  }
}

// ============================================================================
// Webhook signature validation (deauthorize)
// ============================================================================

/**
 * Valida assinatura HMAC-SHA256 do webhook deauthorize.
 * Meta envia `X-Hub-Signature-256: sha256=<hex>` calculado com IG_APP_SECRET.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const secret = getOptional('IG_APP_SECRET') ?? getOptional('META_APP_SECRET');
  if (!secret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ============================================================================
// Helper: tipo de account aceito
// ============================================================================

export function isAcceptableAccountType(type: string): type is MetaAccountType {
  return type === 'BUSINESS' || type === 'CREATOR';
}
