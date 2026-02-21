-- Migration: Add allowed_domains column to projects table
-- Story: ST-09 - Configurar CORS e Domínios Permitidos

-- Add allowed_domains column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN projects.allowed_domains IS 'List of allowed domains for widget CORS validation';

-- Create index for domain lookups
CREATE INDEX IF NOT EXISTS idx_projects_allowed_domains ON projects USING GIN (allowed_domains);
