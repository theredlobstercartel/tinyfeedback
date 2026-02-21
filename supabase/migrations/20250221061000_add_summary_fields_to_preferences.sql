-- Migration: Add summary_email and summary preferences to notification_preferences (ST-26/ST-27)
-- This migration adds fields for instant notification email and summary preferences

-- Add summary_email field for instant notification delivery
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS summary_email TEXT;

-- Add daily summary enabled flag
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add weekly summary enabled flag  
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add last sent timestamps for summaries
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS last_daily_summary_sent TIMESTAMP WITH TIME ZONE;

ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS last_weekly_summary_sent TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN notification_preferences.summary_email IS 'Email address to send notifications and summaries to (defaults to user email if null)';
COMMENT ON COLUMN notification_preferences.daily_summary_enabled IS 'Whether to send daily summary emails';
COMMENT ON COLUMN notification_preferences.weekly_summary_enabled IS 'Whether to send weekly summary emails';
COMMENT ON COLUMN notification_preferences.last_daily_summary_sent IS 'Timestamp of last daily summary sent';
COMMENT ON COLUMN notification_preferences.last_weekly_summary_sent IS 'Timestamp of last weekly summary sent';
