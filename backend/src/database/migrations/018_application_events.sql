-- Track form views, starts, and submits for analytics
CREATE TABLE IF NOT EXISTS application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'start', 'submit')),
  session_token TEXT,
  ip_hash TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_application_events_app_type
  ON application_events(application_id, event_type, created_at DESC);
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "owner_select_events" ON application_events
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );
CREATE POLICY IF NOT EXISTS "public_insert_events" ON application_events
  FOR INSERT WITH CHECK (true);
