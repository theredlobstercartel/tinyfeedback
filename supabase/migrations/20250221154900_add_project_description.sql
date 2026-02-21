-- Migration: Add description field to bmad_projects table
-- Story: ST-42 - Botão Criar Projeto não faz nada

-- Add description column to bmad_projects table
ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bmad_projects.description IS 'Project description (optional)';
