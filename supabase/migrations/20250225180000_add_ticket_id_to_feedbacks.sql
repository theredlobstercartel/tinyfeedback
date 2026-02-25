-- Migration: Add ticket_id field to feedbacks table
-- Story: ST-14 - Endpoint Público para Receber Feedbacks

-- Add ticket_id column for tracking feedbacks from public endpoint
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS ticket_id TEXT UNIQUE;

-- Add comment for documentation
COMMENT ON COLUMN feedbacks.ticket_id IS 'Unique ticket ID for public feedback submissions (format: TF-XXXXXXXX)';

-- Create index for faster lookups by ticket_id
CREATE INDEX IF NOT EXISTS idx_feedbacks_ticket_id ON feedbacks(ticket_id) WHERE ticket_id IS NOT NULL;
