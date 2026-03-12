-- Up
CREATE TABLE IF NOT EXISTS lesson_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'link' CHECK (type IN ('link', 'button')),
  label text NOT NULL,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lesson_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_lesson_links" ON lesson_links
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_lesson_links" ON lesson_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Down
-- DROP TABLE IF EXISTS lesson_links;
