-- Migration: Add notification_preferences table
-- Story: ST-28 - Preferências de Notificação

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  notify_nps BOOLEAN NOT NULL DEFAULT true,
  notify_suggestion BOOLEAN NOT NULL DEFAULT true,
  notify_bug BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Add comments for documentation
COMMENT ON TABLE notification_preferences IS 'User preferences for notification types per project';
COMMENT ON COLUMN notification_preferences.project_id IS 'Reference to the project';
COMMENT ON COLUMN notification_preferences.notify_nps IS 'Whether to send notifications for NPS feedback';
COMMENT ON COLUMN notification_preferences.notify_suggestion IS 'Whether to send notifications for suggestion feedback';
COMMENT ON COLUMN notification_preferences.notify_bug IS 'Whether to send notifications for bug feedback';

-- Create index for faster lookups by project_id
CREATE INDEX IF NOT EXISTS idx_notification_preferences_project_id ON notification_preferences(project_id);

-- Enable RLS on the table
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to read their own project's notification preferences
CREATE POLICY "Users can read their project notification preferences"
  ON notification_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = notification_preferences.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Allow users to insert notification preferences for their own projects
CREATE POLICY "Users can create notification preferences for their projects"
  ON notification_preferences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = notification_preferences.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Allow users to update their own project's notification preferences
CREATE POLICY "Users can update their project notification preferences"
  ON notification_preferences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = notification_preferences.project_id 
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = notification_preferences.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Allow users to delete their own project's notification preferences
CREATE POLICY "Users can delete their project notification preferences"
  ON notification_preferences FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = notification_preferences.project_id 
      AND projects.user_id = auth.uid()
    )
  );
