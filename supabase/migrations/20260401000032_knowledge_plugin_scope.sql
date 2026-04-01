-- Migration 032: Add plugin scope to knowledge base for Helena plugin RAG

-- ============================================================================
-- 1. Add plugin_slug column to knowledge_documents
-- ============================================================================

ALTER TABLE public.knowledge_documents
  ADD COLUMN plugin_slug text NULL REFERENCES public.plugins(slug) ON UPDATE CASCADE ON DELETE CASCADE;

-- ============================================================================
-- 2. Drop the anonymous inline CHECK on scope column and replace with updated version
-- PostgreSQL auto-names it: knowledge_documents_scope_check
-- ============================================================================

ALTER TABLE public.knowledge_documents DROP CONSTRAINT knowledge_documents_scope_check;
ALTER TABLE public.knowledge_documents ADD CONSTRAINT knowledge_documents_scope_check
  CHECK (scope IN ('global', 'consultancy', 'plugin'));

-- ============================================================================
-- 3. Replace chk_consultancy_scope with updated three-branch integrity constraint
-- ============================================================================

ALTER TABLE public.knowledge_documents DROP CONSTRAINT chk_consultancy_scope;
ALTER TABLE public.knowledge_documents ADD CONSTRAINT chk_knowledge_scope CHECK (
  (scope = 'global'      AND consultancy_id IS NULL    AND plugin_slug IS NULL) OR
  (scope = 'consultancy' AND consultancy_id IS NOT NULL AND plugin_slug IS NULL) OR
  (scope = 'plugin'      AND plugin_slug IS NOT NULL    AND consultancy_id IS NULL)
);

-- ============================================================================
-- 4. Add partial index for plugin documents
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_plugin
  ON public.knowledge_documents(plugin_slug) WHERE plugin_slug IS NOT NULL;

-- ============================================================================
-- 5. Add RLS policy for plugin documents (SELECT for authenticated users)
-- ============================================================================

CREATE POLICY "Users can view plugin documents"
  ON public.knowledge_documents FOR SELECT
  USING (scope = 'plugin');

-- ============================================================================
-- 6. Replace match_knowledge_chunks function (backward compatible)
-- Adds filter_plugin_slug parameter with DEFAULT NULL
-- Existing ragService.ts calls omit this parameter — DEFAULT NULL ensures
-- plugin chunks are NOT returned in consultancy/global queries.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_scope text DEFAULT NULL,
  filter_consultancy_id uuid DEFAULT NULL,
  filter_plugin_slug text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  token_count integer,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    kc.token_count,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_documents kd ON kd.id = kc.document_id
  WHERE kd.status = 'ready'
    AND (filter_scope IS NULL OR kd.scope = filter_scope)
    AND (filter_consultancy_id IS NULL OR kd.consultancy_id = filter_consultancy_id)
    AND (filter_plugin_slug IS NULL OR kd.plugin_slug = filter_plugin_slug)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
