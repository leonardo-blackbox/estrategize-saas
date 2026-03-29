-- Migration 026: knowledge_base tables for RAG pipeline
-- Creates knowledge_documents and knowledge_chunks with pgvector support and RLS

-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- knowledge_documents: tracks uploaded files and their processing status
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope           text        NOT NULL CHECK (scope IN ('global', 'consultancy')),
  consultancy_id  uuid        REFERENCES public.consultancies(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  file_type       text        NOT NULL CHECK (file_type IN ('pdf', 'txt', 'md')),
  file_size_bytes integer     NOT NULL CHECK (file_size_bytes > 0),
  chunk_count     integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  error_message   text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT chk_consultancy_scope CHECK (
    (scope = 'global' AND consultancy_id IS NULL) OR
    (scope = 'consultancy' AND consultancy_id IS NOT NULL)
  )
);

-- ============================================================================
-- knowledge_chunks: individual text chunks with vector embeddings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id     uuid        NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index     integer     NOT NULL,
  content         text        NOT NULL,
  token_count     integer     NOT NULL,
  embedding       vector(1536) NOT NULL,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_user ON public.knowledge_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_scope ON public.knowledge_documents (scope);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_consultancy ON public.knowledge_documents (consultancy_id) WHERE consultancy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document ON public.knowledge_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON public.knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- knowledge_documents: owner can manage their own docs
CREATE POLICY "Users can view own documents"
  ON public.knowledge_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view global documents"
  ON public.knowledge_documents FOR SELECT
  USING (scope = 'global');

CREATE POLICY "Users can insert own documents"
  ON public.knowledge_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.knowledge_documents FOR DELETE
  USING (auth.uid() = user_id);

-- knowledge_chunks: access follows parent document
CREATE POLICY "Users can view chunks of own documents"
  ON public.knowledge_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view chunks of global documents"
  ON public.knowledge_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_documents d
      WHERE d.id = document_id AND d.scope = 'global'
    )
  );

-- ============================================================================
-- updated_at trigger for knowledge_documents
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_knowledge_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_knowledge_documents_updated_at
  BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_documents_updated_at();

-- ============================================================================
-- Similarity search function for RAG queries (Phase 13)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_scope text DEFAULT NULL,
  filter_consultancy_id uuid DEFAULT NULL
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
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
