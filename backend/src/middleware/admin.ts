import type { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { AuthenticatedRequest } from './auth.js';

/**
 * Middleware: verifica se o usuário autenticado tem role = 'admin'.
 * Deve ser usado APÓS requireAuth.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Database service unavailable' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.userId)
    .single();

  if (error || !data) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  if (data.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}
