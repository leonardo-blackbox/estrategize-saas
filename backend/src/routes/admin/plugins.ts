import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { listAllPlugins, getAllConfig, setConfig } from '../../services/pluginConfigService.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// GET / — list all plugins (including inactive) for admin
router.get('/', async (_req, res) => {
  try {
    const plugins = await listAllPlugins();
    res.json(plugins);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// GET /:slug/config — get all config entries for a plugin as key-value object
const slugParamsSchema = z.object({ slug: z.string().min(1) });

router.get('/:slug/config', async (req, res) => {
  const parsed = slugParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const config = await getAllConfig(parsed.data.slug);
    res.json(config);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// PUT /:slug/config — upsert a config entry for a plugin
const configBodySchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

router.put('/:slug/config', async (req, res) => {
  const paramsParsed = slugParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({ error: paramsParsed.error.flatten() });
  }

  const bodyParsed = configBodySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ error: bodyParsed.error.flatten() });
  }

  try {
    await setConfig(paramsParsed.data.slug, bodyParsed.data.key, bodyParsed.data.value);
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
