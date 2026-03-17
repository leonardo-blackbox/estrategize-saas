import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PNG, JPG, WebP ou SVG.'));
    }
  },
});

// Verify application belongs to authenticated user
function paramId(id: string | string[]): string {
  return Array.isArray(id) ? id[0] : id;
}

async function getApplicationForUser(applicationId: string, userId: string) {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('id, user_id, theme_config')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data;
}

// POST /api/applications/:id/assets/logo
router.post('/:id/assets/logo', upload.single('file'), async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Storage not configured' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Arquivo não enviado' });
    return;
  }
  if (req.file.size > 2 * 1024 * 1024) {
    res.status(400).json({ error: 'Arquivo muito grande (máx 2MB para logo)' });
    return;
  }

  const app = await getApplicationForUser(paramId(req.params.id), req.userId!);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const ext = req.file.originalname.split('.').pop() || 'png';
  const path = `${req.userId}/${paramId(req.params.id)}/logo.${ext}`;
  const bucket = 'application-assets';

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    res.status(500).json({ error: 'Upload failed', details: uploadError.message });
    return;
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  const newThemeConfig = { ...(app.theme_config as object || {}), logoUrl: publicUrl };
  await supabaseAdmin
    .from('applications')
    .update({ theme_config: newThemeConfig, updated_at: new Date().toISOString() })
    .eq('id', paramId(req.params.id));

  res.json({ url: publicUrl });
});

// DELETE /api/applications/:id/assets/logo
router.delete('/:id/assets/logo', async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Storage not configured' });
    return;
  }
  const app = await getApplicationForUser(paramId(req.params.id), req.userId!);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const bucket = 'application-assets';
  const prefix = `${req.userId}/${paramId(req.params.id)}/logo`;
  // Try to remove common extensions
  for (const ext of ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif']) {
    await supabaseAdmin.storage.from(bucket).remove([`${prefix}.${ext}`]);
  }

  const themeConfig = app.theme_config as Record<string, unknown>;
  delete themeConfig.logoUrl;
  await supabaseAdmin
    .from('applications')
    .update({ theme_config: themeConfig, updated_at: new Date().toISOString() })
    .eq('id', paramId(req.params.id));

  res.json({ success: true });
});

// POST /api/applications/:id/assets/background
router.post('/:id/assets/background', upload.single('file'), async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Storage not configured' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Arquivo não enviado' });
    return;
  }

  const app = await getApplicationForUser(paramId(req.params.id), req.userId!);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const ext = req.file.originalname.split('.').pop() || 'jpg';
  const path = `${req.userId}/${paramId(req.params.id)}/background.${ext}`;
  const bucket = 'application-assets';

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    res.status(500).json({ error: 'Upload failed', details: uploadError.message });
    return;
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  const opacity = Math.min(80, Math.max(0, Number(req.body.opacity) || 50));
  const newThemeConfig = {
    ...(app.theme_config as object || {}),
    backgroundImageUrl: publicUrl,
    backgroundOverlayOpacity: opacity,
  };
  await supabaseAdmin
    .from('applications')
    .update({ theme_config: newThemeConfig, updated_at: new Date().toISOString() })
    .eq('id', paramId(req.params.id));

  res.json({ url: publicUrl });
});

// DELETE /api/applications/:id/assets/background
router.delete('/:id/assets/background', async (req: AuthenticatedRequest, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Storage not configured' });
    return;
  }
  const app = await getApplicationForUser(paramId(req.params.id), req.userId!);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const bucket = 'application-assets';
  const prefix = `${req.userId}/${paramId(req.params.id)}/background`;
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
    await supabaseAdmin.storage.from(bucket).remove([`${prefix}.${ext}`]);
  }

  const themeConfig = app.theme_config as Record<string, unknown>;
  delete themeConfig.backgroundImageUrl;
  delete themeConfig.backgroundOverlayOpacity;
  await supabaseAdmin
    .from('applications')
    .update({ theme_config: themeConfig, updated_at: new Date().toISOString() })
    .eq('id', paramId(req.params.id));

  res.json({ success: true });
});

export default router;
