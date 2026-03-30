import { generateEmbeddings } from './embeddingService.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// ============================================================
// Types
// ============================================================

export interface RAGChunk {
  id: string;
  document_id: string;
  content: string;
  token_count: number;
  metadata: Record<string, unknown>;
  similarity: number;
}

// ============================================================
// RAG Retrieval
// ============================================================

/**
 * Retrieves relevant knowledge base chunks for a given user message and consultancy.
 * Queries both global scope (Iris methodology docs) and consultancy scope (client-specific docs)
 * in parallel, deduplicates by chunk id, and returns the top 5 most similar chunks.
 *
 * Returns an empty array on any error (graceful degradation — chat still works without RAG).
 */
export async function retrieveRAGContext(
  userMessage: string,
  consultancyId: string,
): Promise<RAGChunk[]> {
  if (!supabaseAdmin) return [];

  try {
    const embeddings = await generateEmbeddings([userMessage]);
    const vector = embeddings[0];
    if (!vector || vector.length === 0) return [];

    // PostgREST requires string representation for vector type
    const vectorString = '[' + vector.join(',') + ']';

    const [globalResult, consultancyResult] = await Promise.all([
      supabaseAdmin.rpc('match_knowledge_chunks', {
        query_embedding: vectorString,
        match_threshold: 0.5,
        match_count: 5,
        filter_scope: 'global',
        filter_consultancy_id: null,
      }),
      supabaseAdmin.rpc('match_knowledge_chunks', {
        query_embedding: vectorString,
        match_threshold: 0.5,
        match_count: 5,
        filter_scope: 'consultancy',
        filter_consultancy_id: consultancyId,
      }),
    ]);

    if (globalResult.error) {
      console.error('RAG global retrieval error:', globalResult.error);
    }
    if (consultancyResult.error) {
      console.error('RAG consultancy retrieval error:', consultancyResult.error);
    }

    const globalChunks: RAGChunk[] = (globalResult.data as RAGChunk[]) ?? [];
    const consultancyChunks: RAGChunk[] = (consultancyResult.data as RAGChunk[]) ?? [];

    // Deduplicate by id, merge, sort by similarity descending, take top 5
    const chunkMap = new Map<string, RAGChunk>();
    for (const chunk of [...globalChunks, ...consultancyChunks]) {
      const existing = chunkMap.get(chunk.id);
      if (!existing || chunk.similarity > existing.similarity) {
        chunkMap.set(chunk.id, chunk);
      }
    }

    return Array.from(chunkMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  } catch (error) {
    console.error('RAG retrieval failed:', error);
    return [];
  }
}
