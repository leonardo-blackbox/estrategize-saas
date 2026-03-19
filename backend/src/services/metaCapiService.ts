import crypto from 'crypto';
import https from 'https';

const GRAPH_API_VERSION = 'v19.0';

function hashSHA256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export interface CapiUserData {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  fbc?: string;
  fbp?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

export interface CapiEventParams {
  pixelId: string;
  accessToken: string;
  eventName: string;
  eventId?: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData: CapiUserData;
  testEventCode?: string;
}

export function buildUserData(params: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fbc?: string;
  fbp?: string;
  ip?: string;
  userAgent?: string;
}): CapiUserData {
  const ud: CapiUserData = {};

  if (params.email) ud.em = hashSHA256(params.email);
  if (params.phone) ud.ph = hashSHA256(params.phone.replace(/\D/g, ''));
  if (params.firstName) ud.fn = hashSHA256(params.firstName.trim().toLowerCase());
  if (params.lastName) ud.ln = hashSHA256(params.lastName.trim().toLowerCase());
  if (params.fbc) ud.fbc = params.fbc;
  if (params.fbp) ud.fbp = params.fbp;
  if (params.ip) ud.client_ip_address = params.ip;
  if (params.userAgent) ud.client_user_agent = params.userAgent;

  return ud;
}

export function sendCapiEvent(params: CapiEventParams): void {
  const {
    pixelId, accessToken, eventName, eventId, eventTime,
    eventSourceUrl, userData, testEventCode,
  } = params;

  const eventPayload: Record<string, unknown> = {
    event_name: eventName,
    event_time: eventTime ?? Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
  };
  if (eventId) eventPayload.event_id = eventId;
  if (eventSourceUrl) eventPayload.event_source_url = eventSourceUrl;

  const payload: Record<string, unknown> = { data: [eventPayload] };
  if (testEventCode) payload.test_event_code = testEventCode;

  const body = JSON.stringify(payload);
  const path = `/${GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

  const req = https.request({
    hostname: 'graph.facebook.com',
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: 5000,
  }, (res) => {
    let data = '';
    res.on('data', (chunk: Buffer) => { data += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data) as { events_received?: number; error?: { message: string } };
        if (parsed.events_received) {
          console.info(`[capi] ✓ ${eventName} → pixel ${pixelId} (received: ${parsed.events_received})`);
        } else if (parsed.error) {
          console.warn(`[capi] ✗ ${eventName} API error:`, parsed.error.message);
        }
      } catch { /* ignore parse error */ }
    });
  });

  req.on('error', (err: Error) => {
    console.warn(`[capi] ✗ ${eventName} request failed:`, err.message);
  });

  req.on('timeout', () => {
    console.warn(`[capi] ✗ ${eventName} request timed out`);
    req.destroy();
  });

  req.write(body);
  req.end();
}
