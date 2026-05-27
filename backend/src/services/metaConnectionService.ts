/**
 * metaConnectionService — CRUD da tabela instagram_official_connections
 * Centraliza acesso ao token vault e estado das conexões OAuth.
 */
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { logger } from '../lib/logger.js';
import { encryptToken, decryptToken } from './metaTokenService.js';
import type { MetaConnection, MetaConnectionPublic } from '../types/metaApi.js';

function ensureDb() {
  if (!supabaseAdmin) throw new Error('Database service unavailable');
  return supabaseAdmin;
}

function toPublic(row: MetaConnection): MetaConnectionPublic {
  // strip user_id and tokens, keep safe fields
  const { user_id: _userId, ...rest } = row;
  void _userId;
  return rest as MetaConnectionPublic;
}

export async function getConnectionByConsultancy(consultancyId: string): Promise<MetaConnection | null> {
  const db = ensureDb();
  const { data, error } = await db
    .from('instagram_official_connections')
    .select('*')
    .eq('consultancy_id', consultancyId)
    .maybeSingle();
  if (error) {
    logger.warn('[metaConnection] fetch failed', { consultancyId, code: error.code });
    return null;
  }
  return (data as unknown as MetaConnection) ?? null;
}

export async function getConnectionPublic(consultancyId: string): Promise<MetaConnectionPublic | null> {
  const conn = await getConnectionByConsultancy(consultancyId);
  return conn ? toPublic(conn) : null;
}

export async function getDecryptedToken(connectionId: string): Promise<string> {
  const db = ensureDb();
  const { data, error } = await db
    .from('instagram_official_connections')
    .select('access_token_encrypted')
    .eq('id', connectionId)
    .single();
  if (error || !data) {
    throw new Error('Connection not found');
  }
  // Supabase retorna bytea como base64 (PostgREST) ou hex (\x...) dependendo da config.
  // Aceitar ambos:
  const raw = data.access_token_encrypted;
  let buf: Buffer;
  if (Buffer.isBuffer(raw)) {
    buf = raw;
  } else if (typeof raw === 'string') {
    if (raw.startsWith('\\x')) {
      buf = Buffer.from(raw.slice(2), 'hex');
    } else {
      buf = Buffer.from(raw, 'base64');
    }
  } else {
    throw new Error('Unexpected access_token_encrypted format');
  }
  return decryptToken(buf);
}

export interface SaveConnectionInput {
  consultancyId: string;
  userId: string;
  igUserId: string;
  igUsername: string;
  accountType: 'BUSINESS' | 'CREATOR';
  authFlow: 'instagram_business_login' | 'facebook_login';
  pageId?: string | null;
  pageName?: string | null;
  accessToken: string;
  scopes: string[];
  expiresInSeconds: number;
}

export async function upsertConnection(input: SaveConnectionInput): Promise<MetaConnection> {
  const db = ensureDb();
  const encrypted = encryptToken(input.accessToken);
  const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000).toISOString();

  const payload = {
    consultancy_id: input.consultancyId,
    user_id: input.userId,
    ig_user_id: input.igUserId,
    ig_username: input.igUsername,
    account_type: input.accountType,
    auth_flow: input.authFlow,
    page_id: input.pageId ?? null,
    page_name: input.pageName ?? null,
    access_token_encrypted: encrypted,
    scopes: input.scopes,
    status: 'active' as const,
    expires_at: expiresAt,
    last_refreshed_at: new Date().toISOString(),
    last_error: null,
  };

  const { data, error } = await db
    .from('instagram_official_connections')
    .upsert(payload, { onConflict: 'consultancy_id' })
    .select('*')
    .single();

  if (error) {
    logger.error('[metaConnection] upsert failed', { code: error.code, message: error.message });
    throw new Error(`Failed to save connection: ${error.message}`);
  }
  return data as unknown as MetaConnection;
}

export async function updateConnectionStatus(
  consultancyId: string,
  status: 'active' | 'expired' | 'revoked' | 'error',
  lastError?: string,
): Promise<void> {
  const db = ensureDb();
  await db
    .from('instagram_official_connections')
    .update({ status, last_error: lastError ?? null })
    .eq('consultancy_id', consultancyId);
}

export async function markConnectionByIgUserId(
  igUserId: string,
  status: 'active' | 'expired' | 'revoked' | 'error',
  lastError?: string,
): Promise<void> {
  const db = ensureDb();
  await db
    .from('instagram_official_connections')
    .update({ status, last_error: lastError ?? null })
    .eq('ig_user_id', igUserId);
}

export async function deleteConnection(consultancyId: string): Promise<void> {
  const db = ensureDb();
  await db
    .from('instagram_official_connections')
    .delete()
    .eq('consultancy_id', consultancyId);
}

export async function listActiveConnections(): Promise<MetaConnection[]> {
  const db = ensureDb();
  const { data, error } = await db
    .from('instagram_official_connections')
    .select('*')
    .eq('status', 'active');
  if (error) {
    logger.warn('[metaConnection] list active failed', { code: error.code });
    return [];
  }
  return (data as unknown as MetaConnection[]) ?? [];
}

export { toPublic as connectionToPublic };
