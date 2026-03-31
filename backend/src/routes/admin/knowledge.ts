import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import {
  parseFile,
  chunkText,
  generateEmbeddings,
  deleteDocument,
  getDocumentsByScope,
  testQuery,
} from '../../services/knowledgeService.js';

// ─── Constants ───────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Multer config ───────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const isByMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isByExt =
      file.mimetype === 'application/octet-stream' && (ext === 'md' || ext === 'txt');
    if (isByMime || isByExt) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Use PDF, TXT ou Markdown.'));
    }
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

// GET / — list global knowledge documents
router.get('/', async (_req, res) => {
  try {
    const documents = await getDocumentsByScope({ scope: 'global' });
    res.json(documents);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST / — upload document (async model: returns 201 with status 'processing')
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 10 MB.' });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database service unavailable' });
  }

  const userId = req.userId as string;
  const fileType = resolveFileType(req.file.mimetype, req.file.originalname);

  if (!fileType) {
    return res.status(400).json({ error: 'Tipo de arquivo não suportado.' });
  }

  // Step A — Insert document record with status 'processing'
  const { data: document, error: insertError } = await supabaseAdmin
    .from('knowledge_documents')
    .insert({
      user_id: userId,
      scope: 'global',
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

  // Step B — Return 201 immediately with the processing document
  res.status(201).json(document);

  // Step C — Fire background processing AFTER response is sent
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
          scope: 'global',
          consultancy_id: null,
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
      console.error(`[knowledge] Background processing failed for doc ${document.id}:`, message);
      await supabaseAdmin
        .from('knowledge_documents')
        .update({ status: 'error', error_message: message })
        .eq('id', document.id);
    }
  })();
});

// DELETE /:id — remove document and its chunks (CASCADE)
const idSchema = z.object({ id: z.string().uuid() });

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = idSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid document ID — must be a valid UUID.' });
  }

  const { id } = parsed.data;
  const userId = req.userId as string;

  try {
    const deleted = await deleteDocument(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }
    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST /test — run a RAG test query against global knowledge
const testQuerySchema = z.object({
  query: z.string().min(1).max(500),
});

router.post('/test', async (req, res) => {
  const parsed = testQuerySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const result = await testQuery(parsed.data.query, 'global');
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
