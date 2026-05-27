/**
 * Routes — OAuth Instagram Business Login + Connection management
 * Epic 10, Story 10.2
 */
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getConsultancy } from '../services/consultancyService.js';
import {
  buildAuthUrl,
  verifyState,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchInstagramUserInfo,
  revokeToken,
  verifyWebhookSignature,
} from '../services/metaOAuthService.js';
import {
  getConnectionPublic,
  upsertConnection,
  deleteConnection,
  getDecryptedToken,
  getConnectionByConsultancy,
  markConnectionByIgUserId,
} from '../services/metaConnectionService.js';
import { logger } from '../lib/logger.js';

const router = Router();

const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';

// ─── POST /api/meta/oauth/start ──────────────────────────────────
// Inicia o OAuth flow. Retorna URL para frontend redirecionar.
router.post('/oauth/start', requireAuth, async (req: AuthenticatedRequest, res) => {
  const schema = z.object({ consultancyId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'consultancyId required' });
    return;
  }
  const userId = req.userId as string;
  const { consultancyId } = parsed.data;

  const consultancy = await getConsultancy(userId, consultancyId);
  if (!consultancy) {
    res.status(404).json({ error: 'Consultancy not found' });
    return;
  }

  try {
    const { url } = buildAuthUrl(consultancyId, userId);
    res.json({ url });
  } catch (err) {
    logger.error('[meta-oauth] start failed', { err: (err as Error).message });
    res.status(500).json({ error: 'Failed to build authorization URL' });
  }
});

// ─── GET /api/meta/oauth/callback ────────────────────────────────
// Meta redireciona aqui após user aprovar.
router.get('/oauth/callback', async (req, res) => {
  const code = typeof req.query['code'] === 'string' ? req.query['code'] : undefined;
  const state = typeof req.query['state'] === 'string' ? req.query['state'] : undefined;
  const error = typeof req.query['error'] === 'string' ? req.query['error'] : undefined;
  const errorDesc =
    typeof req.query['error_description'] === 'string' ? req.query['error_description'] : undefined;

  const redirectErr = (slug: string) =>
    res.redirect(`${FRONTEND_URL}/consultoria?meta_error=${encodeURIComponent(slug)}`);

  if (error) {
    logger.warn('[meta-oauth] callback received error', { error, errorDesc });
    return redirectErr(error);
  }
  if (!code || !state) return redirectErr('missing_params');

  // 1. Validar state
  let payload;
  try {
    payload = verifyState(state);
  } catch (err) {
    logger.warn('[meta-oauth] invalid state', { err: (err as Error).message });
    return redirectErr('invalid_state');
  }

  try {
    // 2. Trocar code por short-lived
    const shortRes = await exchangeCodeForToken(code);

    // 3. Trocar short por long-lived
    const longRes = await exchangeForLongLivedToken(shortRes.access_token);

    // 4. Buscar info da conta
    const userInfo = await fetchInstagramUserInfo(longRes.access_token);

    // 5. Validar account_type
    if (userInfo.account_type !== 'BUSINESS' && userInfo.account_type !== 'CREATOR') {
      return redirectErr('not_business_account');
    }

    // 6. Persistir
    await upsertConnection({
      consultancyId: payload.consultancyId,
      userId: payload.userId,
      igUserId: userInfo.user_id,
      igUsername: userInfo.username,
      accountType: userInfo.account_type,
      authFlow: 'instagram_business_login',
      pageId: null,
      pageName: null,
      accessToken: longRes.access_token,
      scopes: [
        'instagram_business_basic',
        'instagram_business_manage_insights',
        'instagram_business_manage_comments',
        'instagram_business_manage_messages',
        'instagram_business_content_publish',
      ],
      expiresInSeconds: longRes.expires_in,
    });

    logger.info('[meta-oauth] connection created', {
      consultancyId: payload.consultancyId,
      igUsername: userInfo.username,
      accountType: userInfo.account_type,
    });

    return res.redirect(
      `${FRONTEND_URL}/consultoria/${payload.consultancyId}?meta_connected=1`,
    );
  } catch (err) {
    logger.error('[meta-oauth] callback flow failed', { err: (err as Error).message });
    return redirectErr('exchange_failed');
  }
});

// ─── GET /api/meta/connections/:consultancyId ────────────────────
// Retorna conexão (campos seguros, sem token).
router.get('/connections/:consultancyId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const userId = req.userId as string;

  const consultancy = await getConsultancy(userId, consultancyId);
  if (!consultancy) {
    res.status(404).json({ error: 'Consultancy not found' });
    return;
  }

  const conn = await getConnectionPublic(consultancyId);
  res.json({ connection: conn });
});

// ─── DELETE /api/meta/connections/:consultancyId ─────────────────
// Revoga no Meta + apaga do banco.
router.delete('/connections/:consultancyId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const consultancyId = req.params['consultancyId'] as string;
  const userId = req.userId as string;

  const consultancy = await getConsultancy(userId, consultancyId);
  if (!consultancy) {
    res.status(404).json({ error: 'Consultancy not found' });
    return;
  }

  const conn = await getConnectionByConsultancy(consultancyId);
  if (!conn) {
    res.status(404).json({ error: 'No active connection' });
    return;
  }

  // Best-effort revoke
  try {
    const token = await getDecryptedToken(conn.id);
    await revokeToken(token);
  } catch (err) {
    logger.warn('[meta-oauth] revoke best-effort failed', { err: (err as Error).message });
  }

  await deleteConnection(consultancyId);
  res.json({ disconnected: true });
});

// ─── POST /api/meta/webhooks/deauthorize ─────────────────────────
// Meta chama quando user revoga acesso no app dashboard dele.
// IMPORTANTE: precisa receber raw body para validar signature.
router.post('/webhooks/deauthorize', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  // Body raw é necessário — assumir que express.raw foi aplicado por upstream
  // ou usar JSON.stringify de req.body como fallback (degraded mode)
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn('[meta-oauth] deauthorize webhook with invalid signature');
    res.status(403).json({ error: 'Invalid signature' });
    return;
  }

  try {
    // Meta envia signed_request com user_id (Facebook User ID).
    // Para Instagram Business Login, esperamos receber instagram user_id.
    // Aceita ambos:
    const parsed =
      typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const igUserId = (parsed['user_id'] ?? parsed['instagram_user_id']) as string | undefined;

    if (!igUserId) {
      logger.warn('[meta-oauth] deauthorize missing user_id in payload');
      res.status(400).json({ error: 'Missing user_id' });
      return;
    }

    await markConnectionByIgUserId(String(igUserId), 'revoked', 'User revoked via Meta dashboard');
    logger.info('[meta-oauth] connection marked as revoked', { igUserId });
    res.json({ ok: true });
  } catch (err) {
    logger.error('[meta-oauth] deauthorize handler failed', { err: (err as Error).message });
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
