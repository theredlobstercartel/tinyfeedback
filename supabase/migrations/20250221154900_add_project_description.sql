-- Migration: Add description field to projects table
-- Story: ST-42 - Botão Criar Projeto não faz nada

-- Add description column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.description IS 'Project description (optional)';
