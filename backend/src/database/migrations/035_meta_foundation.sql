-- Migration 035: Meta API Foundation
-- Epic 10 — Onda 1: Fundação para integração oficial com Instagram via Meta Graph API
-- Cria token vault (pgcrypto) + 5 tabelas para snapshots de insights oficiais
-- Suporta Instagram Business Login (padrão Onda 1) e Facebook Login (futuro)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABELA 1: instagram_official_connections
-- Token vault encriptado + estado da conexão OAuth
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_official_connections (
  id                      uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  consultancy_id          uuid          NOT NULL UNIQUE REFERENCES public.consultancies(id) ON DELETE CASCADE,
  user_id                 uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ig_user_id              text          NOT NULL UNIQUE,
  ig_username             text          NOT NULL,
  account_type            text          NOT NULL CHECK (account_type IN ('BUSINESS','CREATOR')),
  auth_flow               text          NOT NULL DEFAULT 'instagram_business_login'
                                          CHECK (auth_flow IN ('instagram_business_login','facebook_login')),
  page_id                 text,
  page_name               text,
  access_token_encrypted  bytea         NOT NULL,
  scopes                  text[]        NOT NULL DEFAULT '{}',
  status                  text          NOT NULL DEFAULT 'active'
                                          CHECK (status IN ('active','expired','revoked','error')),
  expires_at              timestamptz   NOT NULL,
  last_refreshed_at       timestamptz,
  last_snapshot_at        timestamptz,
  last_error              text,
  connected_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.instagram_official_connections.access_token_encrypted IS
  'Long-lived access token (60d) encriptado via pgp_sym_encrypt(token, META_TOKEN_ENCRYPTION_KEY)';
COMMENT ON COLUMN public.instagram_official_connections.auth_flow IS
  'instagram_business_login (padrão Onda 1) | facebook_login (futuro, suporta Creator)';
COMMENT ON COLUMN public.instagram_official_connections.page_id IS
  'Facebook Page ID — NULL para auth_flow=instagram_business_login';

CREATE INDEX IF NOT EXISTS idx_ig_connections_status      ON public.instagram_official_connections (status);
CREATE INDEX IF NOT EXISTS idx_ig_connections_expires_at  ON public.instagram_official_connections (expires_at);
CREATE INDEX IF NOT EXISTS idx_ig_connections_user        ON public.instagram_official_connections (user_id);

-- Reutiliza set_updated_at() criada em migration 034
DROP TRIGGER IF EXISTS trg_ig_connections_updated ON public.instagram_official_connections;
CREATE TRIGGER trg_ig_connections_updated
  BEFORE UPDATE ON public.instagram_official_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.instagram_official_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_ig_connections_owner" ON public.instagram_official_connections;
CREATE POLICY "users_ig_connections_owner"
  ON public.instagram_official_connections
  FOR ALL
  USING (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABELA 2: instagram_insights_daily
-- Snapshot diário de métricas de conta (1 linha por consultoria × dia × métrica × period)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_insights_daily (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  consultancy_id  uuid          NOT NULL REFERENCES public.consultancies(id) ON DELETE CASCADE,
  date            date          NOT NULL,
  metric_name     text          NOT NULL,
  value           bigint        NOT NULL,
  period          text          NOT NULL CHECK (period IN ('day','week','days_28','lifetime')),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT uq_ig_insights_daily UNIQUE (consultancy_id, date, metric_name, period)
);

COMMENT ON TABLE public.instagram_insights_daily IS
  'Snapshot diário de métricas de conta IG. Métricas comuns: reach, views, accounts_engaged, profile_views, profile_links_taps, total_interactions, likes, comments, saves, shares, follows, unfollows';

CREATE INDEX IF NOT EXISTS idx_ig_insights_daily_lookup ON public.instagram_insights_daily (consultancy_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ig_insights_daily_metric ON public.instagram_insights_daily (consultancy_id, metric_name, date DESC);

ALTER TABLE public.instagram_insights_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_ig_insights_daily_owner" ON public.instagram_insights_daily;
CREATE POLICY "users_ig_insights_daily_owner"
  ON public.instagram_insights_daily
  FOR ALL
  USING (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABELA 3: instagram_media_insights
-- Snapshot diário de métricas por post/reel
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_media_insights (
  id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  consultancy_id      uuid          NOT NULL REFERENCES public.consultancies(id) ON DELETE CASCADE,
  ig_media_id         text          NOT NULL,
  media_type          text          NOT NULL CHECK (media_type IN ('IMAGE','VIDEO','CAROUSEL_ALBUM')),
  media_product_type  text          NOT NULL CHECK (media_product_type IN ('FEED','REELS','STORY')),
  permalink           text,
  caption             text,
  thumbnail_url       text,
  posted_at           timestamptz,
  captured_at         timestamptz   NOT NULL DEFAULT now(),
  metrics             jsonb         NOT NULL DEFAULT '{}',
  CONSTRAINT uq_ig_media_insights UNIQUE (consultancy_id, ig_media_id, captured_at)
);

COMMENT ON COLUMN public.instagram_media_insights.metrics IS
  'JSON de métricas: { reach, views, likes, comments, saved, shares, total_interactions, profile_visits, profile_activity, follows, ig_reels_avg_watch_time, ig_reels_video_view_total_time, clips_replays_count }';

CREATE INDEX IF NOT EXISTS idx_ig_media_insights_lookup     ON public.instagram_media_insights (consultancy_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_media_insights_type       ON public.instagram_media_insights (consultancy_id, media_product_type);
CREATE INDEX IF NOT EXISTS idx_ig_media_insights_captured   ON public.instagram_media_insights (consultancy_id, captured_at DESC);

ALTER TABLE public.instagram_media_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_ig_media_insights_owner" ON public.instagram_media_insights;
CREATE POLICY "users_ig_media_insights_owner"
  ON public.instagram_media_insights
  FOR ALL
  USING (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABELA 4: instagram_audience_snapshots
-- Demografia (1 snapshot por dia × type)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_audience_snapshots (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  consultancy_id    uuid          NOT NULL REFERENCES public.consultancies(id) ON DELETE CASCADE,
  date              date          NOT NULL,
  audience_type     text          NOT NULL CHECK (audience_type IN ('follower','engaged')),
  total_followers   bigint,
  age_gender        jsonb         NOT NULL DEFAULT '{}',
  top_cities        jsonb         NOT NULL DEFAULT '[]',
  top_countries     jsonb         NOT NULL DEFAULT '[]',
  locales           jsonb         NOT NULL DEFAULT '[]',
  captured_at       timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT uq_ig_audience UNIQUE (consultancy_id, date, audience_type)
);

COMMENT ON TABLE public.instagram_audience_snapshots IS
  'Demografia da audiência. type=follower (seguidores totais) ou engaged (interagiram nos últimos 90d)';

CREATE INDEX IF NOT EXISTS idx_ig_audience_lookup ON public.instagram_audience_snapshots (consultancy_id, date DESC);

ALTER TABLE public.instagram_audience_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_ig_audience_owner" ON public.instagram_audience_snapshots;
CREATE POLICY "users_ig_audience_owner"
  ON public.instagram_audience_snapshots
  FOR ALL
  USING (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABELA 5: instagram_stories_insights
-- Stories ativas — captura a cada 6h (expiram em 24h)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.instagram_stories_insights (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  consultancy_id  uuid          NOT NULL REFERENCES public.consultancies(id) ON DELETE CASCADE,
  ig_story_id     text          NOT NULL,
  permalink       text,
  thumbnail_url   text,
  posted_at       timestamptz,
  captured_at     timestamptz   NOT NULL DEFAULT now(),
  metrics         jsonb         NOT NULL DEFAULT '{}',
  is_final        boolean       NOT NULL DEFAULT false,
  CONSTRAINT uq_ig_stories UNIQUE (consultancy_id, ig_story_id, captured_at)
);

COMMENT ON COLUMN public.instagram_stories_insights.metrics IS
  'JSON: { views, reach, replies, navigation, profile_visits, follows, shares, reposts, total_interactions }';
COMMENT ON COLUMN public.instagram_stories_insights.is_final IS
  'True após 24h da posted_at — congela último snapshot da story expirada';

CREATE INDEX IF NOT EXISTS idx_ig_stories_lookup    ON public.instagram_stories_insights (consultancy_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_stories_captured  ON public.instagram_stories_insights (captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_stories_active    ON public.instagram_stories_insights (consultancy_id, is_final) WHERE is_final = false;

ALTER TABLE public.instagram_stories_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_ig_stories_owner" ON public.instagram_stories_insights;
CREATE POLICY "users_ig_stories_owner"
  ON public.instagram_stories_insights
  FOR ALL
  USING (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    consultancy_id IN (SELECT id FROM public.consultancies WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TESTE DE pgcrypto round-trip
-- ============================================================================
-- Após apply, validar manualmente:
--   SELECT pgp_sym_decrypt(pgp_sym_encrypt('test-token','my-key'), 'my-key') = 'test-token';
-- Deve retornar TRUE.
