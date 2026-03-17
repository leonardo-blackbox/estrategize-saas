CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES application_responses(id) ON DELETE CASCADE,
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "owner_webhook_configs" ON webhook_configs
  USING (application_id IN (SELECT id FROM applications WHERE user_id = auth.uid()));
