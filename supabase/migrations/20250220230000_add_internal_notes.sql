-- Migration: Add internal_notes field to feedbacks table
-- Story: ST-15 - Adicionar Notas Internas

-- Add internal_notes column
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN feedbacks.internal_notes IS 'Private notes for founders about this feedback';

-- Create index for better performance when filtering by internal_notes presence
CREATE INDEX IF NOT EXISTS idx_feedbacks_internal_notes ON feedbacks(internal_notes) WHERE internal_notes IS NOT NULL;
