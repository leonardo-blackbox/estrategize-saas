import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/applications/:id/analytics (auth'd)
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

  const period = req.query.period as string || '30d';
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[period] || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabaseAdmin
    .from('application_events')
    .select('event_type, created_at')
    .eq('application_id', req.params.id)
    .gte('created_at', since);

  const allEvents = events || [];
  const views = allEvents.filter((e) => e.event_type === 'view').length;
  const starts = allEvents.filter((e) => e.event_type === 'start').length;
  const submits = allEvents.filter((e) => e.event_type === 'submit').length;

  // Group by day
  const byDay: Record<string, { views: number; starts: number; submits: number }> = {};
  for (const event of allEvents) {
    const day = event.created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = { views: 0, starts: 0, submits: 0 };
    const et = event.event_type as 'view' | 'start' | 'submit';
    if (et === 'view') byDay[day].views++;
    else if (et === 'start') byDay[day].starts++;
    else if (et === 'submit') byDay[day].submits++;
  }

  const timeline = Object.entries(byDay)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    data: {
      views,
      starts,
      submits,
      total_responses: app.response_count,
      start_rate: views > 0 ? Math.round((starts / views) * 100) : 0,
      completion_rate: starts > 0 ? Math.round((submits / starts) * 100) : 0,
      timeline,
      period,
    },
  });
});

export default router;
