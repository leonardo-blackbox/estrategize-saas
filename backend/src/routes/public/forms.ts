import { Router } from 'express';
import { z } from 'zod';
import https from 'https';
import rateLimit from 'express-rate-limit';
import { buildUserData, sendCapiEvent } from '../../services/metaCapiService.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { notifyNewResponse } from '../../services/emailNotificationService.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';

// ─── Bot detection ────────────────────────────────────────────────────────────

const BOT_UA_PATTERNS = [
  // Meta / Facebook crawlers
  /facebookexternalhit/i,
  /facebookbot/i,
  /meta-externalagent/i,
  /facebot/i,
  // Google
  /googlebot/i,
  /adsbot-google/i,
  /apis-google/i,
  /google-inspectiontool/i,
  // Common crawlers
  /bingbot/i,
  /yandexbot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /slackbot/i,
  /discordbot/i,
  /telegrambot/i,
  /applebot/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  // Generic patterns
  /\bbot\b/i,
  /\bspider\b/i,
  /\bcrawler\b/i,
  /\bscraper\b/i,
  // Headless browsers (Meta ad review uses headless Chrome)
  /headlesschrome/i,
  /phantomjs/i,
  /prerender/i,
  /puppeteer/i,
  /selenium/i,
  /webdriver/i,
];

/**
 * Returns true if the request appears to be from a bot or headless browser.
 * Silent drop: we still return 200 to the client so bots don't retry.
 */
function isBotRequest(req: import('express').Request): boolean {
  const ua = req.headers['user-agent'] || '';

  // 1. Known bot user agents
  if (BOT_UA_PATTERNS.some((re) => re.test(ua))) return true;

  // 2. Missing sec-fetch-site — real browsers always send this on cross-origin fetch
  //    (Chrome 63+, Firefox 90+, Safari 16.4+). Headless crawlers typically omit it.
  const secFetchSite = req.headers['sec-fetch-site'];
  if (!secFetchSite) {
    // Only flag if UA also lacks a recognizable browser token
    // (avoids false positives on older mobile browsers)
    const looksLikeBrowser = /mozilla|chrome|safari|firefox|edge/i.test(ua);
    if (!looksLikeBrowser) return true;
  }

  // 3. Empty User-Agent
  if (!ua.trim()) return true;

  return false;
}

// ─── Server-side Meta Pixel ───────────────────────────────────────────────────

/**
 * Fires a Meta noscript pixel from the server.
 * This is not blockable by browser ad blockers.
 * Uses the basic pixel endpoint (no access token required).
 * Events appear in Events Manager with limited attribution data.
 */
function fireServerMetaPixel(pixelId: string, event: string): void {
  const path = `/tr?id=${encodeURIComponent(pixelId)}&ev=${encodeURIComponent(event)}&noscript=1`;
  const options = {
    hostname: 'www.facebook.com',
    path,
    method: 'GET',
    timeout: 3000,
  };
  const req = https.request(options);
  req.on('error', (err) => {
    console.warn('[pixel:server] Meta pixel fire failed:', err.message);
  });
  req.end();
  console.debug(`[pixel:server] fired → ${event} (pixel: ${pixelId})`);
}

const router = Router();

// ─── IP helpers ───────────────────────────────────────────────────────────────

/**
 * Extract the real public client IP from request headers.
 * Returns undefined if only private/loopback addresses are found.
 * Railway forwards x-forwarded-for; the first entry is the real client IP.
 */
function getPublicClientIp(req: import('express').Request): string | undefined {
  const PRIVATE_IP = /^(::1|::ffff:127\.|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|fd[0-9a-f]{2}:|fc)/i;

  // x-forwarded-for can be comma-separated: "realClientIp, proxy1, proxy2"
  const xff = (req.headers['x-forwarded-for'] as string | undefined)?.split(',');
  if (xff) {
    for (const raw of xff) {
      const ip = raw.trim();
      if (ip && !PRIVATE_IP.test(ip)) return ip;
    }
  }

  const remoteAddr = req.socket.remoteAddress ?? '';
  if (remoteAddr && !PRIVATE_IP.test(remoteAddr)) return remoteAddr;

  return undefined; // only private/internal IPs found — omit rather than send garbage
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

const publicFormLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

router.use(publicFormLimit);

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const answerItemSchema = z.object({
  field_id:    z.string().uuid(),
  field_type:  z.string().optional().default(''),
  field_title: z.string().optional().default(''),
  value:       z.unknown(),
});

const submitSchema = z.object({
  answers:  z.array(answerItemSchema).min(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/forms/:slug/events — fire-and-forget event tracking
router.post('/:slug/events', async (req, res) => {
  res.json({ ok: true }); // respond immediately — always, even for bots

  if (!supabaseAdmin) return;
  if (isBotRequest(req)) return; // silent drop: don't record bot events

  const {
    event,
    session_token,
    event_id,
    page_url,
    fbc,
    fbp,
  } = req.body as {
    event: string;
    session_token?: string;
    event_id?: string;
    page_url?: string;
    fbc?: string;
    fbp?: string;
  };
  if (!['view', 'start', 'submit'].includes(event)) return;

  try {
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, settings')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .single();

    if (!app) return;

    await supabaseAdmin.from('application_events').insert({
      application_id: app.id,
      event_type: event,
      session_token: session_token || null,
    });

    // Server-side Meta Pixel (not blockable by ad blockers)
    const settings = app.settings as Record<string, unknown> | null;
    const tracking = settings?.tracking as Record<string, unknown> | undefined;
    if (tracking?.metaPixelActive && tracking?.metaPixelId) {
      const pixelId = tracking.metaPixelId as string;
      // metaLeadEvent: 'start' | 'submit' — defaults to 'submit' (fire Lead at end of form)
      const metaLeadEvent = (tracking.metaLeadEvent as string) || 'submit';

      // submit: Lead + CompleteRegistration are fired by the /responses endpoint
      // (which also has email/phone data). Only view and start are handled here.
      const eventsToFire: string[] = [];
      if (event === 'view') {
        eventsToFire.push('PageView');
      } else if (event === 'start' && metaLeadEvent === 'start') {
        eventsToFire.push('Lead');
      }
      // event === 'submit' → skipped here, handled in POST /:slug/responses with full PII

      const accessToken = tracking.metaAccessToken as string | undefined;
      const testEventCode = tracking.metaTestEventCode as string | undefined;
      const clientIp = getPublicClientIp(req);
      const userAgent = req.headers['user-agent'];

      for (const metaEvent of eventsToFire) {
        if (accessToken) {
          sendCapiEvent({
            pixelId,
            accessToken,
            eventName: metaEvent,
            eventId: event_id,
            eventSourceUrl: page_url,
            userData: buildUserData({ fbc, fbp, ip: clientIp, userAgent }),
            testEventCode,
          });
        } else {
          fireServerMetaPixel(pixelId, metaEvent);
        }
      }
    }
  } catch (err) {
    console.warn('[forms/events] error:', err);
  }
});

// GET /api/forms/:slug/preview — fetch draft form (owner only, for preview)
router.get('/:slug/preview', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const { slug } = req.params;

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .select('id, title, slug, status, theme_config, settings, response_count, created_at, user_id')
      .eq('slug', slug)
      .single();

    if (error || !application) {
      res.status(404).json({ error: 'Formulário não encontrado' });
      return;
    }

    // Only the owner can preview a draft
    if (application.user_id !== req.userId) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    const { data: fields, error: fieldsError } = await supabaseAdmin
      .from('application_fields')
      .select('id, position, type, title, description, required, options, conditional_logic')
      .eq('application_id', application.id)
      .order('position', { ascending: true });

    if (fieldsError) {
      res.status(500).json({ error: fieldsError.message });
      return;
    }

    res.json({ data: { application, fields: fields ?? [], isPreview: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/forms/:slug  — fetch published form + fields
router.get('/:slug', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const { slug } = req.params;

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .select('id, title, slug, status, theme_config, settings, response_count, created_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !application) {
      res.status(404).json({ error: 'Formulário não encontrado' });
      return;
    }

    const { data: fields, error: fieldsError } = await supabaseAdmin
      .from('application_fields')
      .select(
        'id, position, type, title, description, required, options, conditional_logic',
      )
      .eq('application_id', application.id)
      .order('position', { ascending: true });

    if (fieldsError) {
      res.status(500).json({ error: fieldsError.message });
      return;
    }

    // Strip sensitive CAPI credentials before returning to the public browser
    const publicApp = {
      ...application,
      settings: (() => {
        const s = (application.settings ?? {}) as Record<string, unknown>;
        const tracking = s.tracking as Record<string, unknown> | undefined;
        if (!tracking) return s;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { metaAccessToken: _at, metaTestEventCode: _tc, ...safeTracking } = tracking;
        return { ...s, tracking: safeTracking };
      })(),
    };

    res.json({ data: { application: publicApp, fields: fields ?? [] } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/forms/:slug/responses  — submit a completed response
router.post('/:slug/responses', async (req, res) => {
  if (isBotRequest(req)) {
    res.status(200).json({ data: { response_id: null } }); // silent drop
    return;
  }

  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const { slug } = req.params;
    const { answers, metadata } = parsed.data;

    // Verify the form exists and is published
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, status, settings')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (appError || !application) {
      res.status(404).json({ error: 'Formulário não encontrado' });
      return;
    }

    // Insert response
    const { data: response, error: responseError } = await supabaseAdmin
      .from('application_responses')
      .insert({
        application_id: application.id,
        status: 'complete',
        submitted_at: new Date().toISOString(),
        metadata: metadata ?? {},
      })
      .select('id')
      .single();

    if (responseError || !response) {
      res.status(500).json({ error: responseError?.message ?? 'Failed to save response' });
      return;
    }

    // Insert all answers (skip if none provided)
    if (answers.length > 0) {
      const answerRows = answers.map((a) => ({
        response_id: response.id,
        field_id:    a.field_id,
        field_type:  a.field_type,
        field_title: a.field_title,
        value:       a.value ?? null,
      }));

      const { error: answersError } = await supabaseAdmin
        .from('application_response_answers')
        .insert(answerRows);

      if (answersError) {
        console.error('[public/forms] Failed to insert answers:', answersError.message);
        // Response row was already committed; log and continue
      }
    }

    res.status(201).json({ data: { response_id: response.id } });

    // Server-side CAPI — CompleteRegistration (+Lead if configured)
    ;(async () => {
      try {
        const settings = application.settings as Record<string, unknown> | null;
        const tracking = settings?.tracking as Record<string, unknown> | undefined;
        if (!tracking?.metaPixelActive || !tracking?.metaPixelId) return;

        const pixelId = tracking.metaPixelId as string;
        const accessToken = tracking.metaAccessToken as string | undefined;
        const testEventCode = tracking.metaTestEventCode as string | undefined;
        const metaLeadEvent = (tracking.metaLeadEvent as string) || 'submit';

        // Extract PII from answers for hashing
        const emailAnswer = answers.find((a) => a.field_type === 'email');
        const phoneAnswer = answers.find((a) => a.field_type === 'phone');
        const nameAnswer  = answers.find((a) => a.field_type === 'name');
        let firstName: string | undefined;
        let lastName: string | undefined;
        if (typeof nameAnswer?.value === 'string') {
          const parts = nameAnswer.value.trim().split(/\s+/);
          firstName = parts[0];
          lastName  = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
        }

        const meta = (metadata ?? {}) as Record<string, string | undefined>;
        const clientIp = getPublicClientIp(req);
        const userAgent = req.headers['user-agent'];

        const userData = buildUserData({
          email:     typeof emailAnswer?.value === 'string' ? emailAnswer.value : undefined,
          phone:     typeof phoneAnswer?.value === 'string' ? phoneAnswer.value : undefined,
          firstName,
          lastName,
          fbc:       meta.fbc,
          fbp:       meta.fbp,
          ip:        clientIp,
          userAgent,
        });

        const eventId = meta.event_id as string | undefined;
        const pageUrl = meta.page_url as string | undefined;

        const eventsToFire: string[] = ['CompleteRegistration'];
        if (metaLeadEvent === 'submit') eventsToFire.push('Lead');

        for (const metaEvent of eventsToFire) {
          const eid = eventId ? `${eventId}-${metaEvent.toLowerCase()}` : undefined;
          if (accessToken) {
            sendCapiEvent({ pixelId, accessToken, eventName: metaEvent, eventId: eid, eventSourceUrl: pageUrl, userData, testEventCode });
          } else {
            fireServerMetaPixel(pixelId, metaEvent);
          }
        }
      } catch { /* non-critical */ }
    })();

    // Trigger email notification (async, non-blocking)
    const answersToInsert = answers.map((a) => ({
      field_id:    a.field_id,
      field_type:  a.field_type,
      field_title: a.field_title,
      value:       a.value ?? null,
    }));
    ;(async () => {
      try {
        if (!supabaseAdmin) return;
        const { data: appData } = await supabaseAdmin
          .from('applications')
          .select('id, title, settings, user_id')
          .eq('slug', slug)
          .single();

        if (!appData) return;

        const settings = appData.settings as Record<string, unknown>;
        const notifications = settings?.notifications as Record<string, unknown> | undefined;
        if (!notifications?.emailEnabled) return;

        // Get the user's email
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(appData.user_id as string);
        if (!user?.email) return;

        const emailTo = (notifications.emailTo as string) || user.email;
        const emailCc = notifications.emailCc as string | undefined;

        // Format answers for email
        const emailAnswers = answersToInsert.map((a) => ({
          field_title: a.field_title || 'Campo',
          value: a.value,
        }));

        await notifyNewResponse({
          to: emailTo,
          cc: emailCc,
          applicationTitle: appData.title as string,
          applicationId: appData.id as string,
          responseId: response.id,
          answers: emailAnswers,
          submittedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[forms] Email notification failed:', err);
      }
    })();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/forms/:slug/capi-test — validate CAPI token and fire a test PageView
// Returns raw Facebook response. Remove test_event_code from form settings to go live.
router.get('/:slug/capi-test', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) { res.status(503).json({ error: 'DB unavailable' }); return; }

  const { data: app } = await supabaseAdmin
    .from('applications')
    .select('id, title, settings, user_id')
    .eq('slug', req.params.slug)
    .single();

  if (!app || app.user_id !== req.userId) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const tracking = (app.settings as Record<string, unknown>)?.tracking as Record<string, unknown> | undefined;

  if (!tracking?.metaPixelActive || !tracking?.metaPixelId) {
    res.json({ ok: false, reason: 'Meta Pixel não está ativo ou sem Pixel ID' });
    return;
  }

  const pixelId = tracking.metaPixelId as string;
  const accessToken = tracking.metaAccessToken as string | undefined;
  const testEventCode = tracking.metaTestEventCode as string | undefined;

  if (!accessToken) {
    res.json({ ok: false, reason: 'Access Token não configurado — modo Pixel Normal (sem CAPI)' });
    return;
  }

  // Fire a test PageView and return raw Facebook response
  const payload = JSON.stringify({
    data: [{
      event_name: 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: `https://app.estrategize.co/f/${req.params.slug}`,
      user_data: { client_user_agent: req.headers['user-agent'] ?? 'test' },
    }],
    ...(testEventCode && { test_event_code: testEventCode }),
  });

  const path = `/v19.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

  const result = await new Promise<{ statusCode: number; body: string }>((resolve) => {
    const r = https.request({
      hostname: 'graph.facebook.com',
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 8000,
    }, (fbRes) => {
      let data = '';
      fbRes.on('data', (c: Buffer) => { data += c; });
      fbRes.on('end', () => resolve({ statusCode: fbRes.statusCode ?? 0, body: data }));
    });
    r.on('error', (err) => resolve({ statusCode: 0, body: err.message }));
    r.on('timeout', () => { r.destroy(); resolve({ statusCode: 0, body: 'timeout' }); });
    r.write(payload);
    r.end();
  });

  let parsed: unknown;
  try { parsed = JSON.parse(result.body); } catch { parsed = result.body; }

  res.json({
    pixel_id: pixelId,
    has_token: true,
    test_event_code: testEventCode ?? null,
    http_status: result.statusCode,
    facebook_response: parsed,
  });
});

export default router;
