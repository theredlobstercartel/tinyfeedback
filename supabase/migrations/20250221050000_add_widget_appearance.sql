-- Migration: Add widget appearance fields to projects table
-- Story: ST-18 - Configurar Aparência do Widget

-- Add widget_color column with default neon green color
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS widget_color VARCHAR(7) DEFAULT '#00ff88';

-- Add widget_position column with default position
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS widget_position VARCHAR(20) DEFAULT 'bottom-right';

-- Add widget_text column with default text
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS widget_text VARCHAR(50) DEFAULT 'Feedback';

-- Update existing projects to have default values
UPDATE projects
SET widget_color = '#00ff88',
    widget_position = 'bottom-right',
    widget_text = 'Feedback'
WHERE widget_color IS NULL
   OR widget_position IS NULL
   OR widget_text IS NULL;
