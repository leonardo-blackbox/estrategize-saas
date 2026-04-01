import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  listPlugins,
  listConsultancyPlugins,
  installPlugin,
  uninstallPlugin,
} from '../services/pluginService.js';

const router = Router();
router.use(requireAuth);

// GET /api/plugins — catalog of available plugins
router.get('/', async (_req, res) => {
  try {
    const plugins = await listPlugins();
    res.json({ plugins });
  } catch (err) {
    console.error('[plugins] listPlugins error:', err);
    res.status(500).json({ error: 'Failed to fetch plugins' });
  }
});

// GET /api/plugins/consultancy/:consultancyId — installed plugins for a consultancy
router.get('/consultancy/:consultancyId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const consultancyId = req.params.consultancyId as string;
    const plugins = await listConsultancyPlugins(userId, consultancyId);
    res.json({ plugins });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch plugins';
    const status = msg.includes('not found') || msg.includes('access denied') ? 404 : 500;
    res.status(status).json({ error: msg });
  }
});

// POST /api/plugins/consultancy/:consultancyId/install — install a plugin
const installSchema = z.object({ slug: z.string().min(1) });

router.post('/consultancy/:consultancyId/install', async (req: AuthenticatedRequest, res) => {
  const parsed = installSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'slug is required' });
  }

  try {
    const userId = req.userId as string;
    const consultancyId = req.params.consultancyId as string;
    const { slug } = parsed.data;
    const plugin = await installPlugin(userId, consultancyId, slug);
    return res.json({ plugin });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to install plugin';
    const status = msg.includes('not found') || msg.includes('access denied') ? 404 : 500;
    return res.status(status).json({ error: msg });
  }
});

// DELETE /api/plugins/consultancy/:consultancyId/:slug — uninstall a plugin
router.delete('/consultancy/:consultancyId/:slug', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId as string;
    const consultancyId = req.params.consultancyId as string;
    const slug = req.params.slug as string;
    await uninstallPlugin(userId, consultancyId, slug);
    return res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to uninstall plugin';
    const status = msg.includes('not found') || msg.includes('access denied') ? 404 : 500;
    return res.status(status).json({ error: msg });
  }
});

export { router as pluginsRouter };
