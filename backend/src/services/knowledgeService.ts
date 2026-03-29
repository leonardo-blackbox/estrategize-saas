import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { generateEmbeddings } from './embeddingService.js';

// ============================================================================
// Constants
// ============================================================================

const TARGET_CHUNK_TOKENS = 400;   // target chunk size
const MIN_CHUNK_TOKENS = 300;      // minimum viable chunk
const MAX_CHUNK_TOKENS = 500;      // hard cap
const OVERLAP_TOKENS = 50;         // overlap between chunks
const AVG_CHARS_PER_TOKEN = 4;     // rough approximation for splitting

// ============================================================================
// Types
// ============================================================================

export interface ProcessDocumentParams {
  userId: string;
  scope: 'global' | 'consultancy';
  consultancyId?: string;
  fileName: string;
  fileType: 'pdf' | 'txt' | 'md';
  fileBuffer: Buffer;
}

interface Chunk {
  content: string;
  tokenCount: number;
  index: number;
}

interface KnowledgeDocument {
  id: string;
  user_id: string;
  scope: string;
  consultancy_id: string | null;
  name: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Helpers
// ============================================================================

function ensureAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Database service unavailable');
  }
  return supabaseAdmin;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
}

// ============================================================================
// File Parsing
// ============================================================================

async function parseFile(fileType: 'pdf' | 'txt' | 'md', fileBuffer: Buffer): Promise<string> {
  if (fileType === 'pdf') {
    const result = await pdfParse(fileBuffer);
    return result.text;
  }
  return fileBuffer.toString('utf-8');
}

// ============================================================================
// Chunking
// ============================================================================

function chunkText(text: string): Chunk[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const chunks: Chunk[] = [];
  let currentContent = '';
  let previousChunkTail = '';

  for (const paragraph of paragraphs) {
    const candidate = currentContent
      ? currentContent + '\n\n' + paragraph
      : paragraph;

    if (estimateTokens(candidate) > MAX_CHUNK_TOKENS && currentContent) {
      const fullContent = previousChunkTail
        ? previousChunkTail + '\n\n' + currentContent
        : currentContent;

      chunks.push({
        content: fullContent.trim(),
        tokenCount: estimateTokens(fullContent),
        index: chunks.length,
      });

      // Save overlap tail for next chunk
      const tailChars = OVERLAP_TOKENS * AVG_CHARS_PER_TOKEN;
      previousChunkTail = currentContent.slice(-tailChars);
      currentContent = paragraph;
    } else {
      currentContent = candidate;
    }
  }

  // Flush remaining content
  if (currentContent.trim()) {
    const fullContent = previousChunkTail
      ? previousChunkTail + '\n\n' + currentContent
      : currentContent;

    chunks.push({
      content: fullContent.trim(),
      tokenCount: estimateTokens(fullContent),
      index: chunks.length,
    });
  }

  // Discard undersized chunks unless it's the only one
  if (chunks.length > 1) {
    return chunks.filter((c) => c.tokenCount >= MIN_CHUNK_TOKENS);
  }

  return chunks;
}

// ============================================================================
// processDocument
// ============================================================================

export async function processDocument(
  params: ProcessDocumentParams,
): Promise<KnowledgeDocument> {
  const db = ensureAdmin();

  // 1. Insert document record with status 'processing'
  const { data: docData, error: insertError } = await db
    .from('knowledge_documents')
    .insert({
      user_id: params.userId,
      scope: params.scope,
      consultancy_id: params.consultancyId ?? null,
      name: params.fileName,
      file_type: params.fileType,
      file_size_bytes: params.fileBuffer.length,
      status: 'processing',
    })
    .select()
    .single();

  if (insertError || !docData) {
    throw new Error(`Failed to create document record: ${insertError?.message}`);
  }

  const document = docData as KnowledgeDocument;

  try {
    // 2. Parse file content
    const text = await parseFile(params.fileType, params.fileBuffer);

    // 3. Split into chunks
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error('Document produced no chunks — file may be empty or unreadable');
    }

    // 4. Generate embeddings
    const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

    // 5. Insert chunks with embeddings
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: document.id,
      chunk_index: chunk.index,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: `[${embeddings[i].join(',')}]`,
      metadata: {
        scope: params.scope,
        consultancy_id: params.consultancyId ?? null,
        document_name: params.fileName,
      },
    }));

    const { error: chunksError } = await db.from('knowledge_chunks').insert(chunkRows);

    if (chunksError) {
      throw new Error(`Failed to insert chunks: ${chunksError.message}`);
    }

    // 6. Update document: status = 'ready', chunk_count
    const { data: updatedDoc, error: updateError } = await db
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: chunks.length })
      .eq('id', document.id)
      .select()
      .single();

    if (updateError || !updatedDoc) {
      throw new Error(`Failed to update document status: ${updateError?.message}`);
    }

    return updatedDoc as KnowledgeDocument;
  } catch (err) {
    // 7. On any error: mark document as 'error'
    const message = err instanceof Error ? err.message : String(err);
    console.error('[knowledgeService] processDocument error:', message);

    await db
      .from('knowledge_documents')
      .update({ status: 'error', error_message: message })
      .eq('id', document.id);

    throw err;
  }
}

// ============================================================================
// deleteDocument
// ============================================================================

export async function deleteDocument(
  documentId: string,
  userId: string,
): Promise<boolean> {
  const db = ensureAdmin();

  // Verify ownership
  const { data: doc, error: fetchError } = await db
    .from('knowledge_documents')
    .select('id')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !doc) {
    return false;
  }

  // Delete document (CASCADE deletes chunks)
  const { error: deleteError } = await db
    .from('knowledge_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to delete document: ${deleteError.message}`);
  }

  return true;
}

// ============================================================================
// getDocumentsByScope
// ============================================================================

export async function getDocumentsByScope(params: {
  scope: 'global' | 'consultancy';
  consultancyId?: string;
  userId?: string;
}): Promise<KnowledgeDocument[]> {
  const db = ensureAdmin();

  let query = db
    .from('knowledge_documents')
    .select('*')
    .eq('scope', params.scope)
    .order('created_at', { ascending: false });

  if (params.consultancyId) {
    query = query.eq('consultancy_id', params.consultancyId);
  }

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list documents: ${error.message}`);
  }

  return (data ?? []) as KnowledgeDocument[];
}
