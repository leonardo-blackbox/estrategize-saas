import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Middleware: verifica JWT do Supabase no header Authorization.
 * Rejeita com 401 se token ausente/inválido.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Auth service unavailable' });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice(7);

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.userId = data.user.id;
  next();
}
