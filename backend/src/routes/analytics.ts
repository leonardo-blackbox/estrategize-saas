import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/applications/:id/analytics (auth'd)
// Query params:
//   period: '7d' | '30d' | '90d'   (preset shorthand)
//   from:   ISO date string         (custom range start, inclusive)
//   to:     ISO date string         (custom range end, inclusive)
router.get('/:id/analytics', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Not configured' });
    return;
  }

  // Verify ownership
  const { data: app } = await supabaseAdmin
    .from('applications')
    .select('id, response_count')
    .eq('id', req.params.id)
    .eq('user_id', req.userId!)
    .single();

  if (!app) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // ── Date range resolution ──────────────────────────────────────────────────

  let sinceISO: string;
  let untilISO: string;
  let resolvedPeriod: string;

  const rawFrom = req.query.from as string | undefined;
  const rawTo = req.query.to as string | undefined;
  const period = (req.query.period as string) || '30d';

  if (rawFrom && rawTo) {
    // Custom range: treat as UTC start-of-day / end-of-day
    sinceISO = new Date(`${rawFrom}T00:00:00.000Z`).toISOString();
    untilISO = new Date(`${rawTo}T23:59:59.999Z`).toISOString();
    resolvedPeriod = 'custom';
  } else {
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 30;
    sinceISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    untilISO = new Date().toISOString();
    resolvedPeriod = period;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  const { data: events } = await supabaseAdmin
    .from('application_events')
    .select('event_type, created_at')
    .eq('application_id', req.params.id)
    .gte('created_at', sinceISO)
    .lte('created_at', untilISO);

  const allEvents = events || [];
  const views   = allEvents.filter((e) => e.event_type === 'view').length;
  const starts  = allEvents.filter((e) => e.event_type === 'start').length;
  const submits = allEvents.filter((e) => e.event_type === 'submit').length;

  // ── Group by day ───────────────────────────────────────────────────────────
  const byDay: Record<string, { views: number; starts: number; submits: number }> = {};
  for (const event of allEvents) {
    const day = event.created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = { views: 0, starts: 0, submits: 0 };
    const et = event.event_type as 'view' | 'start' | 'submit';
    if (et === 'view')   byDay[day].views++;
    else if (et === 'start')  byDay[day].starts++;
    else if (et === 'submit') byDay[day].submits++;
  }

  const timeline = Object.entries(byDay)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Group by hour (0-23 UTC) ───────────────────────────────────────────────
  const byHour: Record<number, { views: number; starts: number; submits: number }> = {};
  for (let h = 0; h < 24; h++) byHour[h] = { views: 0, starts: 0, submits: 0 };

  for (const event of allEvents) {
    const hour = new Date(event.created_at).getUTCHours();
    const et = event.event_type as 'view' | 'start' | 'submit';
    if (et === 'view')   byHour[hour].views++;
    else if (et === 'start')  byHour[hour].starts++;
    else if (et === 'submit') byHour[hour].submits++;
  }

  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, ...byHour[h] }));

  // ── Leads (name, email, phone from responses in range) ────────────────────
  const { data: responses } = await supabaseAdmin
    .from('application_responses')
    .select('id, submitted_at, metadata')
    .eq('application_id', req.params.id)
    .eq('status', 'complete')
    .gte('submitted_at', sinceISO)
    .lte('submitted_at', untilISO)
    .order('submitted_at', { ascending: false })
    .limit(200);

  interface LeadRow {
    name?: string;
    email?: string;
    phone?: string;
    instagram?: string;
    submitted_at: string;
    utm_source?: string;
    utm_campaign?: string;
  }

  let leads: LeadRow[] = [];

  if (responses && responses.length > 0) {
    const responseIds = responses.map((r) => r.id);

    const { data: answers } = await supabaseAdmin
      .from('application_response_answers')
      .select('response_id, field_type, value')
      .in('response_id', responseIds)
      .in('field_type', ['name', 'email', 'phone', 'short_text']);

    const answersByResponse: Record<string, typeof answers> = {};
    for (const a of answers || []) {
      if (!answersByResponse[a.response_id]) answersByResponse[a.response_id] = [];
      answersByResponse[a.response_id]!.push(a);
    }

    leads = responses.map((r) => {
      const ra = answersByResponse[r.id] || [];
      const meta = (r.metadata ?? {}) as Record<string, string | undefined>;

      const nameAns  = ra.find((a) => a.field_type === 'name');
      const emailAns = ra.find((a) => a.field_type === 'email');
      const phoneAns = ra.find((a) => a.field_type === 'phone');
      const igAns    = ra.find((a) => a.field_type === 'short_text');

      return {
        name:         typeof nameAns?.value  === 'string' ? nameAns.value  : undefined,
        email:        typeof emailAns?.value === 'string' ? emailAns.value : undefined,
        phone:        typeof phoneAns?.value === 'string' ? phoneAns.value : undefined,
        instagram:    typeof igAns?.value    === 'string' ? igAns.value    : undefined,
        submitted_at: r.submitted_at,
        utm_source:   meta.utm_source,
        utm_campaign: meta.utm_campaign,
      };
    });
  }

  res.json({
    data: {
      views,
      starts,
      submits,
      total_responses: app.response_count,
      start_rate:      views  > 0 ? Math.round((starts  / views)  * 100) : 0,
      completion_rate: starts > 0 ? Math.round((submits / starts) * 100) : 0,
      overall_rate:    views  > 0 ? Math.round((submits / views)  * 100) : 0,
      timeline,
      hourly,
      leads,
      period: resolvedPeriod,
      from:   sinceISO.slice(0, 10),
      to:     untilISO.slice(0, 10),
    },
  });
});

export default router;
