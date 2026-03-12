-- Up
CREATE TABLE IF NOT EXISTS lesson_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES lesson_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lesson_comments_lesson_id ON lesson_comments(lesson_id);

CREATE POLICY "auth_read_comments" ON lesson_comments
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "auth_insert_comments" ON lesson_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "auth_update_own_comments" ON lesson_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Down
-- DROP TABLE IF EXISTS lesson_comments;
