-- Migration 021: Consultorias Full — Central da Cliente (Epic 5)
-- Expands the consultancies module with full operational data model

-- ============================================================
-- 1. Expand consultancies table with new fields
-- ============================================================
ALTER TABLE consultancies
  ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'onboarding'
    CHECK (phase IN ('onboarding','diagnosis','delivery','implementation','support','closed')),
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS niche TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date_estimated DATE,
  ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'none'
    CHECK (template IN ('none','positioning','educational_product','local_business','full_restructure')),
  ADD COLUMN IF NOT EXISTS implementation_score INTEGER DEFAULT 0
    CHECK (implementation_score >= 0 AND implementation_score <= 100),
  ADD COLUMN IF NOT EXISTS credits_spent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strategic_summary TEXT,
  ADD COLUMN IF NOT EXISTS real_bottleneck TEXT,
  ADD COLUMN IF NOT EXISTS next_meeting_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','at_risk'));

-- ============================================================
-- 2. Consultancy profiles (strategic client data)
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Contact & location
  whatsapp TEXT,
  city TEXT,
  state TEXT,
  -- Business context
  business_type TEXT,
  sub_niche TEXT,
  -- Strategic context
  main_objective TEXT,
  reported_pains TEXT[] DEFAULT '{}',
  current_stage TEXT,
  has_team BOOLEAN DEFAULT FALSE,
  has_physical_space BOOLEAN DEFAULT FALSE,
  has_local_presence BOOLEAN DEFAULT FALSE,
  has_google_mybusiness BOOLEAN DEFAULT FALSE,
  has_website BOOLEAN DEFAULT FALSE,
  -- Commercial profile
  main_offer TEXT,
  ticket_range TEXT,
  current_audience TEXT,
  desired_audience TEXT,
  acquisition_channels TEXT[] DEFAULT '{}',
  -- Financial (consulting contract)
  consulting_value NUMERIC(10,2),
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','partial','paid')),
  payment_installments INTEGER,
  -- Internal
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consultancy_id)
);

-- ============================================================
-- 3. Consultancy stages (journey milestones)
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','skipped')),
  checklist JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Meetings
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  meeting_url TEXT,
  recording_url TEXT,
  participants TEXT[] DEFAULT '{}',
  agenda TEXT,
  transcript TEXT,
  summary TEXT,
  decisions TEXT[] DEFAULT '{}',
  next_steps TEXT[] DEFAULT '{}',
  open_questions TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','cancelled')),
  credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Action items (plan de ação)
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES consultancy_meetings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  responsible TEXT,
  due_date DATE,
  status TEXT DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','done','cancelled')),
  expected_impact TEXT,
  evidence_url TEXT,
  origin TEXT DEFAULT 'manual'
    CHECK (origin IN ('manual','meeting_ai','diagnosis_ai')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Deliverables
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN (
      'executive_summary','action_plan','strategic_diagnosis',
      'competition_analysis','positioning_doc','content_bank',
      'offer_structure','contract','client_manual','presentation',
      'meeting_summary','custom'
    )),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  file_url TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','ready','delivered')),
  generated_by TEXT DEFAULT 'manual'
    CHECK (generated_by IN ('manual','ai')),
  credits_spent INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. AI memory per consultancy
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL
    CHECK (memory_type IN (
      'profile','diagnosis','meeting_insight','decision',
      'opportunity','positioning','risk','custom'
    )),
  content TEXT NOT NULL,
  source TEXT,
  importance INTEGER DEFAULT 3
    CHECK (importance >= 1 AND importance <= 5),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. AI conversation history
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. Competitors & market intelligence
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  city TEXT,
  type TEXT DEFAULT 'direct'
    CHECK (type IN ('direct','indirect','inspiration')),
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  opportunities TEXT[] DEFAULT '{}',
  google_rating NUMERIC(2,1),
  review_highlights TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. Content strategy
-- ============================================================
CREATE TABLE IF NOT EXISTS consultancy_content_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  central_narrative TEXT,
  brand_belief TEXT,
  enemy TEXT,
  content_pillars TEXT[] DEFAULT '{}',
  title_bank TEXT[] DEFAULT '{}',
  story_themes TEXT[] DEFAULT '{}',
  content_types JSONB DEFAULT '{}',
  hooks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consultancy_id)
);

-- ============================================================
-- RLS — Row Level Security
-- ============================================================
ALTER TABLE consultancy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_content_strategy ENABLE ROW LEVEL SECURITY;

-- SELECT policies (owner only)
CREATE POLICY "consultancy_profiles_select" ON consultancy_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consultancy_stages_select" ON consultancy_stages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consultancy_meetings_select" ON consultancy_meetings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consultancy_action_items_select" ON consultancy_action_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consultancy_deliverables_select" ON consultancy_deliverables FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consultancy_ai_memory_select" ON consultancy_ai_memory FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consultancy_ai_conversations_select" ON consultancy_ai_conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consultancy_competitors_select" ON consultancy_competitors FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consultancy_content_strategy_select" ON consultancy_content_strategy FOR SELECT USING (user_id = auth.uid());

-- INSERT policies
CREATE POLICY "consultancy_profiles_insert" ON consultancy_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consultancy_stages_insert" ON consultancy_stages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consultancy_meetings_insert" ON consultancy_meetings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consultancy_action_items_insert" ON consultancy_action_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consultancy_deliverables_insert" ON consultancy_deliverables FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consultancy_ai_memory_insert" ON consultancy_ai_memory FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consultancy_ai_conversations_insert" ON consultancy_ai_conversations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consultancy_competitors_insert" ON consultancy_competitors FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "consultancy_content_strategy_insert" ON consultancy_content_strategy FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE policies
CREATE POLICY "consultancy_profiles_update" ON consultancy_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "consultancy_stages_update" ON consultancy_stages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "consultancy_meetings_update" ON consultancy_meetings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "consultancy_action_items_update" ON consultancy_action_items FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "consultancy_deliverables_update" ON consultancy_deliverables FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "consultancy_ai_memory_update" ON consultancy_ai_memory FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "consultancy_ai_conversations_update" ON consultancy_ai_conversations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "consultancy_competitors_update" ON consultancy_competitors FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "consultancy_content_strategy_update" ON consultancy_content_strategy FOR UPDATE USING (user_id = auth.uid());

-- DELETE policies
CREATE POLICY "consultancy_profiles_delete" ON consultancy_profiles FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "consultancy_stages_delete" ON consultancy_stages FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "consultancy_meetings_delete" ON consultancy_meetings FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "consultancy_action_items_delete" ON consultancy_action_items FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "consultancy_deliverables_delete" ON consultancy_deliverables FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "consultancy_ai_memory_delete" ON consultancy_ai_memory FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "consultancy_ai_conversations_delete" ON consultancy_ai_conversations FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "consultancy_competitors_delete" ON consultancy_competitors FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "consultancy_content_strategy_delete" ON consultancy_content_strategy FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_consultancy_profiles_consultancy ON consultancy_profiles(consultancy_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_stages_consultancy ON consultancy_stages(consultancy_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_stages_order ON consultancy_stages(consultancy_id, order_index);
CREATE INDEX IF NOT EXISTS idx_consultancy_meetings_consultancy ON consultancy_meetings(consultancy_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_meetings_scheduled ON consultancy_meetings(consultancy_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultancy_action_items_consultancy ON consultancy_action_items(consultancy_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_action_items_status ON consultancy_action_items(consultancy_id, status);
CREATE INDEX IF NOT EXISTS idx_consultancy_deliverables_consultancy ON consultancy_deliverables(consultancy_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_ai_memory_consultancy ON consultancy_ai_memory(consultancy_id, is_active);
CREATE INDEX IF NOT EXISTS idx_consultancy_ai_conversations_consultancy ON consultancy_ai_conversations(consultancy_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_competitors_consultancy ON consultancy_competitors(consultancy_id);
CREATE INDEX IF NOT EXISTS idx_consultancy_content_strategy_consultancy ON consultancy_content_strategy(consultancy_id);

-- Index on new consultancies columns
CREATE INDEX IF NOT EXISTS idx_consultancies_phase ON consultancies(user_id, phase) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_consultancies_priority ON consultancies(user_id, priority) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_consultancies_next_meeting ON consultancies(user_id, next_meeting_at) WHERE deleted_at IS NULL;
