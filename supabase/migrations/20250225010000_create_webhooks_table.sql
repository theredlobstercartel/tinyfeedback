-- Migration: Create webhooks table for configurable webhooks
-- Story: ST-11 - Webhooks e Integrações

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES bmad_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- For HMAC signature generation
  events TEXT[] NOT NULL DEFAULT '{}', -- Array of events: feedback.created, feedback.updated
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE webhooks IS 'Webhook configurations for projects';
COMMENT ON COLUMN webhooks.project_id IS 'Reference to the project';
COMMENT ON COLUMN webhooks.name IS 'Human-readable name for the webhook';
COMMENT ON COLUMN webhooks.url IS 'Target URL for the webhook';
COMMENT ON COLUMN webhooks.secret IS 'Secret key for HMAC-SHA256 signature';
COMMENT ON COLUMN webhooks.events IS 'Array of event types to subscribe to';
COMMENT ON COLUMN webhooks.is_active IS 'Whether the webhook is active';

-- Create index for faster lookups by project_id
CREATE INDEX IF NOT EXISTS idx_webhooks_project_id ON webhooks(project_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

-- Enable RLS on the table
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to read their own project's webhooks
CREATE POLICY "Users can read their project webhooks"
  ON webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = webhooks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  );

-- Allow users to create webhooks for their own projects
CREATE POLICY "Users can create webhooks for their projects"
  ON webhooks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = webhooks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  );

-- Allow users to update their own project's webhooks
CREATE POLICY "Users can update their project webhooks"
  ON webhooks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = webhooks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = webhooks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  );

-- Allow users to delete their own project's webhooks
CREATE POLICY "Users can delete their project webhooks"
  ON webhooks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = webhooks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();
