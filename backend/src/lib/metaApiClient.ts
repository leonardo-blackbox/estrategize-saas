/**
 * metaApiClient — Cliente HTTP base para Graph API (Instagram + Facebook).
 * Epic 10, Story 10.3.
 *
 * - Retry exponencial em 429/5xx (3 tentativas, 1s/4s/16s + jitter)
 * - Respeita X-Business-Use-Case-Usage header
 * - Mascara token em logs
 * - Lança MetaApiError tipado em 4xx
 */
import { logger } from './logger.js';
import { MetaApiError, type MetaApiErrorJson } from '../types/metaApi.js';

const IG_BASE = 'https://graph.instagram.com';
const FB_BASE = 'https://graph.facebook.com';

const MAX_RETRIES = 3;

export type MetaBaseUrl = 'instagram' | 'facebook';

interface MetaGetOptions {
  baseUrl?: MetaBaseUrl;
  params?: Record<string, string>;
  version?: string;
  onTokenExpired?: () => Promise<void> | void;
}

function buildUrl(path: string, accessToken: string, options: MetaGetOptions): string {
  const baseUrl = options.baseUrl ?? 'instagram';
  const root =
    baseUrl === 'instagram'
      ? IG_BASE
      : `${FB_BASE}/${options.version ?? process.env['META_GRAPH_API_VERSION'] ?? 'v25.0'}`;
  const params = new URLSearchParams(options.params ?? {});
  params.set('access_token', accessToken);
  const sep = path.startsWith('/') ? '' : '/';
  return `${root}${sep}${path}?${params.toString()}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function maskUrl(url: string): string {
  return url.replace(/access_token=[^&]+/g, 'access_token=***');
}

function backoffDelay(attempt: number): number {
  // 1s, 4s, 16s + jitter
  return Math.pow(4, attempt) * 1000 + Math.random() * 500;
}

async function parseError(res: Response): Promise<MetaApiError> {
  let json: { error?: MetaApiErrorJson } = {};
  try {
    json = (await res.json()) as { error?: MetaApiErrorJson };
  } catch {
    // ignore
  }
  const err = json.error ?? { code: res.status, message: res.statusText };
  return new MetaApiError(err.message, err.code, res.status, {
    type: err.type,
    subcode: err.error_subcode,
    fbTraceId: err.fbtrace_id,
  });
}

export async function metaGet<T>(
  path: string,
  accessToken: string,
  options: MetaGetOptions = {},
): Promise<T> {
  let lastErr: MetaApiError | Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const url = buildUrl(path, accessToken, options);

    try {
      const res = await fetch(url);

      if (res.ok) {
        return (await res.json()) as T;
      }

      const err = await parseError(res);

      // Token expired: callback opcional + no retry
      if (err.isTokenExpired()) {
        if (options.onTokenExpired) {
          await Promise.resolve(options.onTokenExpired());
        }
        throw err;
      }

      // Rate limit: retry com backoff (a menos que estouramos retries)
      if (err.isRateLimited()) {
        const usage = res.headers.get('x-business-use-case-usage');
        logger.warn('[metaApi] rate limited', { attempt, usage, url: maskUrl(url) });
        if (attempt < MAX_RETRIES - 1) {
          await sleep(backoffDelay(attempt));
          continue;
        }
        throw err;
      }

      // Erro 5xx: retry
      if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
        logger.warn('[metaApi] 5xx, retrying', { attempt, status: res.status });
        await sleep(backoffDelay(attempt));
        continue;
      }

      // Outros 4xx — não faz retry
      throw err;
    } catch (err) {
      if (err instanceof MetaApiError) {
        if (!err.isRateLimited() || attempt >= MAX_RETRIES - 1) {
          throw err;
        }
        lastErr = err;
      } else {
        // Erro de rede
        lastErr = err as Error;
        if (attempt < MAX_RETRIES - 1) {
          await sleep(backoffDelay(attempt));
          continue;
        }
      }
    }
  }

  throw lastErr ?? new Error('metaGet exhausted retries');
}

/**
 * Batch request — multiplexa até 50 requests numa chamada.
 */
export async function metaBatch(
  requests: Array<{ method: string; relative_url: string }>,
  accessToken: string,
  options: { baseUrl?: MetaBaseUrl; version?: string } = {},
): Promise<Array<{ code: number; body: string } | null>> {
  const baseUrl = options.baseUrl ?? 'instagram';
  const root =
    baseUrl === 'instagram'
      ? IG_BASE
      : `${FB_BASE}/${options.version ?? process.env['META_GRAPH_API_VERSION'] ?? 'v25.0'}`;

  const body = new URLSearchParams({
    access_token: accessToken,
    batch: JSON.stringify(requests),
  });

  const res = await fetch(root, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  return (await res.json()) as Array<{ code: number; body: string } | null>;
}
