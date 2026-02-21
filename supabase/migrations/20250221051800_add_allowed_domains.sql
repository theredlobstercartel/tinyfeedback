-- Migration: Add allowed_domains array to projects table
-- Story: ST-19 - Gerenciar Domínios Permitidos

-- Add allowed_domains column as text array
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}'::TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN projects.allowed_domains IS 'Array of domains allowed to use the widget (empty array allows all domains)';

-- Create index for efficient domain lookups
CREATE INDEX IF NOT EXISTS idx_projects_allowed_domains ON projects USING GIN (allowed_domains);

-- Update existing projects to have empty array as default
UPDATE projects 
SET allowed_domains = '{}'::TEXT[] 
WHERE allowed_domains IS NULL;
