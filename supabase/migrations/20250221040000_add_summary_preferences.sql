-- Migration: Add summary preferences to notification_preferences table
-- Story: ST-27 - Resumo Diário/Semanal

-- Add columns for summary preferences
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS summary_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_daily_summary_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_weekly_summary_sent TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN notification_preferences.daily_summary_enabled IS 'Whether to send daily summary emails';
COMMENT ON COLUMN notification_preferences.weekly_summary_enabled IS 'Whether to send weekly summary emails';
COMMENT ON COLUMN notification_preferences.summary_email IS 'Email address to send summaries (defaults to user email if null)';
COMMENT ON COLUMN notification_preferences.last_daily_summary_sent IS 'Timestamp of the last daily summary sent';
COMMENT ON COLUMN notification_preferences.last_weekly_summary_sent IS 'Timestamp of the last weekly summary sent';
