import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { logger } from '../../lib/logger.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { listAllPlugins, getAllConfig, setConfig } from '../../services/pluginConfigService.js';
import {
  getConfig as getMktConfig,
  updateConfig as updateMktConfig,
  pesquisaMercadoConfigSchema,
} from '../../services/marketPluginConfigService.js';
import {
  listPluginDocuments,
  deletePluginDocument,
  parseFile,
  chunkText,
  generateEmbeddings,
} from '../../services/knowledgeService.js';

// ─── Multer config ───────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const isByMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isByExt =
      file.mimetype === 'application/octet-stream' && (ext === 'md' || ext === 'txt');
    if (isByMime || isByExt) cb(null, true);
    else cb(new Error('Tipo de arquivo invalido. Use PDF, TXT ou Markdown.'));
  },
});

// ─── Helpers ─────────────────────────────────────────────────────
function resolveFileType(
  mimetype: string,
  originalname: string,
): 'pdf' | 'txt' | 'md' | null {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype === 'text/plain') return 'txt';
  if (mimetype === 'text/markdown') return 'md';
  const ext = originalname.split('.').pop()?.toLowerCase();
  if (ext === 'md') return 'md';
  if (ext === 'txt') return 'txt';
  return null;
}

// ─── Router ──────────────────────────────────────────────────────
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

// ─── Helena knowledge routes ─────────────────────────────────────
// IMPORTANT: These must be defined BEFORE /:slug/config to avoid
// Express capturing "helena" as :slug.

// GET /helena/knowledge — list Helena plugin documents
router.get('/helena/knowledge', async (_req, res) => {
  try {
    const documents = await listPluginDocuments('helena');
    res.json(documents);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST /helena/knowledge — upload document with scope=plugin, plugin_slug=helena
router.post(
  '/helena/knowledge',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Tamanho maximo: 10 MB.' });
      }
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req: AuthenticatedRequest, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable' });

    const userId = req.userId as string;
    const fileType = resolveFileType(req.file.mimetype, req.file.originalname);
    if (!fileType) return res.status(400).json({ error: 'Tipo de arquivo nao suportado.' });

    // Step A — Insert with scope=plugin, plugin_slug=helena
    const { data: document, error: insertError } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({
        user_id: userId,
        scope: 'plugin',
        plugin_slug: 'helena',
        name: req.file.originalname,
        file_type: fileType,
        file_size_bytes: req.file.buffer.length,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !document) {
      return res
        .status(500)
        .json({ error: insertError?.message ?? 'Failed to create document' });
    }

    // Step B — Return 201 immediately
    res.status(201).json(document);

    // Step C — Background indexing IIFE
    const fileBuffer = req.file.buffer;
    const originalname = req.file.originalname;

    (async () => {
      try {
        const text = await parseFile(fileType, fileBuffer);
        const chunks = chunkText(text);
        if (chunks.length === 0) throw new Error('Document produced no chunks');

        const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

        const chunkRows = chunks.map((chunk, i) => ({
          document_id: document.id,
          chunk_index: chunk.index,
          content: chunk.content,
          token_count: chunk.tokenCount,
          embedding: `[${embeddings[i].join(',')}]`,
          metadata: {
            scope: 'plugin',
            plugin_slug: 'helena',
            document_name: originalname,
          },
        }));

        const { error: chunksError } = await supabaseAdmin
          .from('knowledge_chunks')
          .insert(chunkRows);
        if (chunksError) throw new Error(`Failed to insert chunks: ${chunksError.message}`);

        await supabaseAdmin
          .from('knowledge_documents')
          .update({ status: 'ready', chunk_count: chunks.length })
          .eq('id', document.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(
          `[plugins/helena] Background processing failed for doc ${document.id}:`,
          message,
        );
        await supabaseAdmin
          .from('knowledge_documents')
          .update({ status: 'error', error_message: message })
          .eq('id', document.id);
      }
    })();
  },
);

// DELETE /helena/knowledge/:id — remove Helena document
const docIdSchema = z.object({ id: z.string().uuid() });

router.delete('/helena/knowledge/:id', async (req, res) => {
  const parsed = docIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid document ID — must be a valid UUID.' });
  }

  try {
    const deleted = await deletePluginDocument(parsed.data.id, 'helena');
    if (!deleted) return res.status(404).json({ error: 'Document not found' });
    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── Market Intelligence config routes (pesquisa-mercado) ──────────
// Must be defined BEFORE generic /:slug/config routes to avoid capture.

// GET /pesquisa-mercado/config
router.get('/pesquisa-mercado/config', async (_req, res) => {
  try {
    const config = await getMktConfig('pesquisa-mercado');
    res.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// PUT /pesquisa-mercado/config
router.put('/pesquisa-mercado/config', async (req, res) => {
  const parsed = pesquisaMercadoConfigSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' });
  }
  try {
    const config = await updateMktConfig('pesquisa-mercado', parsed.data);
    res.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── Plugin config routes ─────────────────────────────────────────
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
