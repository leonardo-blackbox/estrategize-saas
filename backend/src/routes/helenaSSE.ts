import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { helenaEmitter } from '../services/helenaSSE.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { HelenaReport } from '../services/helenaService.js';

const router = Router();
router.use(requireAuth);

/**
 * GET /api/meetings/:sessionId/helena
 *
 * SSE endpoint for live Helena reports during a meeting.
 * - Authenticated: consultora must own the meeting session
 * - Heartbeat every 30s to keep connection alive
 * - Closes automatically when meeting reaches terminal state
 */
router.get('/:sessionId/helena', async (req: AuthenticatedRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const userId = req.userId as string;

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'DB unavailable' });
  }

  // Verify ownership
  const { data: session, error } = await supabaseAdmin
    .from('meeting_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // If already terminal, return 204 — no stream to subscribe to
  const terminal = ['done', 'error'];
  if (terminal.includes(session.status as string)) {
    return res.status(204).send();
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering if proxied
  });
  res.flushHeaders();

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Helena report handler
  const onReport = (report: HelenaReport) => {
    try {
      res.write(`data: ${JSON.stringify(report)}\n\n`);
    } catch {
      // Client disconnected
    }
  };

  helenaEmitter.on(sessionId, onReport);

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 30_000);

  // Cleanup on client disconnect
  req.on('close', () => {
    helenaEmitter.off(sessionId, onReport);
    clearInterval(heartbeat);
  });
});

export default router;
