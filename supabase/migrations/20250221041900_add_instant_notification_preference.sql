-- Migration: Add instant notification preference for ST-25
-- Story: ST-25 - Configurar Notificações por Email

-- Add column for instant notification preference
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS instant_notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN notification_preferences.instant_notifications_enabled IS 'Whether to send instant notifications when feedback is received';
