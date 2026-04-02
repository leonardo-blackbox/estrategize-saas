import https from 'https';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { buildUserData, sendCapiEvent } from './metaCapiService.js';
import { logger } from '../lib/logger.js';
import type { AnswerItem } from './formSubmissionService.js';

export interface TrackingConfig {
  metaPixelActive?: boolean;
  metaPixelId?: string;
  metaAccessToken?: string;
  metaTestEventCode?: string;
  metaLeadEvent?: string;
}

const BOT_UA_PATTERNS = [
  /facebookexternalhit/i, /facebookbot/i, /meta-externalagent/i, /facebot/i,
  /googlebot/i, /adsbot-google/i, /apis-google/i, /google-inspectiontool/i,
  /bingbot/i, /yandexbot/i, /twitterbot/i, /linkedinbot/i, /whatsapp/i,
  /slackbot/i, /discordbot/i, /telegrambot/i, /applebot/i, /ahrefsbot/i,
  /semrushbot/i, /mj12bot/i, /dotbot/i, /petalbot/i,
  /\bbot\b/i, /\bspider\b/i, /\bcrawler\b/i, /\bscraper\b/i,
  /headlesschrome/i, /phantomjs/i, /prerender/i, /puppeteer/i,
  /selenium/i, /webdriver/i,
];

export function isBotRequest(req: import('express').Request): boolean {
  const ua = req.headers['user-agent'] || '';
  if (BOT_UA_PATTERNS.some((re) => re.test(ua))) return true;
  const secFetchSite = req.headers['sec-fetch-site'];
  if (!secFetchSite) {
    const looksLikeBrowser = /mozilla|chrome|safari|firefox|edge/i.test(ua);
    if (!looksLikeBrowser) return true;
  }
  if (!ua.trim()) return true;
  return false;
}

const PRIVATE_IP = /^(::1|::ffff:127\.|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|fd[0-9a-f]{2}:|fc)/i;

export function getPublicClientIp(req: import('express').Request): string | undefined {
  const xff = (req.headers['x-forwarded-for'] as string | undefined)?.split(',');
  if (xff) {
    for (const raw of xff) {
      const ip = raw.trim();
      if (ip && !PRIVATE_IP.test(ip)) return ip;
    }
  }
  const remoteAddr = req.socket.remoteAddress ?? '';
  if (remoteAddr && !PRIVATE_IP.test(remoteAddr)) return remoteAddr;
  return undefined;
}

export function fireServerMetaPixel(pixelId: string, event: string): void {
  const path = `/tr?id=${encodeURIComponent(pixelId)}&ev=${encodeURIComponent(event)}&noscript=1`;
  const req = https.request({ hostname: 'www.facebook.com', path, method: 'GET', timeout: 3000 });
  req.on('error', (err) => logger.warn('[pixel:server] Meta pixel fire failed:', err.message));
  req.end();
  logger.debug(`[pixel:server] fired -> ${event} (pixel: ${pixelId})`);
}

export function getTracking(settings: Record<string, unknown> | null): TrackingConfig | undefined {
  return (settings?.tracking as TrackingConfig | undefined);
}

export async function trackEvent(
  slug: string,
  event: string,
  body: { session_token?: string; event_id?: string; page_url?: string; fbc?: string; fbp?: string },
  clientIp: string | undefined,
  userAgent: string | undefined,
) {
  if (!supabaseAdmin) return;
  if (!['view', 'start', 'submit'].includes(event)) return;

  const { data: app } = await supabaseAdmin
    .from('applications').select('id, settings').eq('slug', slug).eq('status', 'published').single();
  if (!app) return;

  await supabaseAdmin.from('application_events').insert({
    application_id: app.id, event_type: event, session_token: body.session_token || null,
  });

  const tracking = getTracking(app.settings as Record<string, unknown> | null);
  if (!tracking?.metaPixelActive || !tracking?.metaPixelId) return;

  const pixelId = tracking.metaPixelId;
  const metaLeadEvent = tracking.metaLeadEvent || 'submit';
  const eventsToFire: string[] = [];
  if (event === 'view') eventsToFire.push('PageView');
  else if (event === 'start' && metaLeadEvent === 'start') eventsToFire.push('Lead');

  for (const metaEvent of eventsToFire) {
    if (tracking.metaAccessToken) {
      sendCapiEvent({
        pixelId, accessToken: tracking.metaAccessToken, eventName: metaEvent,
        eventId: body.event_id, eventSourceUrl: body.page_url,
        userData: buildUserData({ fbc: body.fbc, fbp: body.fbp, ip: clientIp, userAgent }),
        testEventCode: tracking.metaTestEventCode,
      });
    } else {
      fireServerMetaPixel(pixelId, metaEvent);
    }
  }
}

export function fireSubmitCapiEvents(
  application: { settings: unknown },
  answers: AnswerItem[],
  metadata: Record<string, unknown>,
  clientIp: string | undefined,
  userAgent: string | undefined,
) {
  (async () => {
    try {
      const tracking = getTracking(application.settings as Record<string, unknown> | null);
      if (!tracking?.metaPixelActive || !tracking?.metaPixelId) return;

      const pixelId = tracking.metaPixelId;
      const metaLeadEvent = tracking.metaLeadEvent || 'submit';
      const emailAnswer = answers.find((a) => a.field_type === 'email');
      const phoneAnswer = answers.find((a) => a.field_type === 'phone');
      const nameAnswer = answers.find((a) => a.field_type === 'name');
      let firstName: string | undefined;
      let lastName: string | undefined;
      if (typeof nameAnswer?.value === 'string') {
        const parts = nameAnswer.value.trim().split(/\s+/);
        firstName = parts[0];
        lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
      }

      const meta = metadata as Record<string, string | undefined>;
      const userData = buildUserData({
        email: typeof emailAnswer?.value === 'string' ? emailAnswer.value : undefined,
        phone: typeof phoneAnswer?.value === 'string' ? phoneAnswer.value : undefined,
        firstName, lastName, fbc: meta.fbc, fbp: meta.fbp, ip: clientIp, userAgent,
      });

      const eventsToFire: string[] = ['CompleteRegistration'];
      if (metaLeadEvent === 'submit') eventsToFire.push('Lead');

      for (const metaEvent of eventsToFire) {
        const eid = meta.event_id ? `${meta.event_id}-${metaEvent.toLowerCase()}` : undefined;
        if (tracking.metaAccessToken) {
          sendCapiEvent({
            pixelId, accessToken: tracking.metaAccessToken, eventName: metaEvent,
            eventId: eid, eventSourceUrl: meta.page_url, userData, testEventCode: tracking.metaTestEventCode,
          });
        } else {
          fireServerMetaPixel(pixelId, metaEvent);
        }
      }
    } catch { /* non-critical */ }
  })();
}

export async function testCapi(slug: string, userId: string, userAgent: string | undefined) {
  if (!supabaseAdmin) throw new Error('DB unavailable');

  const { data: app } = await supabaseAdmin
    .from('applications').select('id, title, settings, user_id').eq('slug', slug).single();
  if (!app || app.user_id !== userId) return { forbidden: true };

  const tracking = getTracking(app.settings as Record<string, unknown>);
  if (!tracking?.metaPixelActive || !tracking?.metaPixelId) {
    return { ok: false, reason: 'Meta Pixel nao esta ativo ou sem Pixel ID' };
  }

  const pixelId = tracking.metaPixelId;
  const accessToken = tracking.metaAccessToken;
  const testEventCode = tracking.metaTestEventCode;
  if (!accessToken) {
    return { ok: false, reason: 'Access Token nao configurado — modo Pixel Normal (sem CAPI)' };
  }

  const payload = JSON.stringify({
    data: [{ event_name: 'PageView', event_time: Math.floor(Date.now() / 1000),
      action_source: 'website', event_source_url: `https://app.estrategize.co/f/${slug}`,
      user_data: { client_user_agent: userAgent ?? 'test' } }],
    ...(testEventCode && { test_event_code: testEventCode }),
  });

  const path = `/v19.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;
  const result = await new Promise<{ statusCode: number; body: string }>((resolve) => {
    const r = https.request({
      hostname: 'graph.facebook.com', path, method: 'POST',
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

  return {
    pixel_id: pixelId, has_token: true, test_event_code: testEventCode ?? null,
    http_status: result.statusCode, facebook_response: parsed,
  };
}
