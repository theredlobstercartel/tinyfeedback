-- Migration: Add api_key column to bmad_projects table
-- This column is used to authenticate widget requests

ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

COMMENT ON COLUMN bmad_projects.api_key IS 'API key for widget authentication';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bmad_projects_api_key ON bmad_projects(api_key);
